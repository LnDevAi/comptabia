package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.provision.ProvisionTechniqueDto;
import com.edefence.ecompta.service.ProvisionTechniqueService;
import com.edefence.ecompta.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Provisions techniques", description = "Gestion des provisions techniques CIMA (assurances)")
@RestController
@RequestMapping("/api/provisions-techniques")
@RequiredArgsConstructor
public class ProvisionTechniqueController {

    private final ProvisionTechniqueService service;

    private int currentYear() { return LocalDate.now().getYear(); }

    @Operation(summary = "Lister toutes les provisions")
    @GetMapping
    public List<ProvisionTechniqueDto.Response> lister() {
        return service.lister(TenantContext.get());
    }

    @Operation(summary = "Lister les provisions par exercice")
    @GetMapping("/exercice/{exercice}")
    public List<ProvisionTechniqueDto.Response> listerParExercice(@PathVariable int exercice) {
        return service.listerParExercice(TenantContext.get(), exercice);
    }

    @Operation(summary = "Dashboard prudentiel CIMA")
    @GetMapping("/dashboard")
    public ProvisionTechniqueDto.DashboardResponse dashboard(
            @RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : currentYear();
        return service.getDashboard(TenantContext.get(), annee);
    }

    @Operation(summary = "Créer une provision technique")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProvisionTechniqueDto.Response creer(@RequestBody ProvisionTechniqueDto.CreateRequest req) {
        return service.creer(TenantContext.get(), req);
    }

    @Operation(summary = "Mettre à jour une provision")
    @PatchMapping("/{id}")
    public ProvisionTechniqueDto.Response mettrAJour(@PathVariable UUID id,
                                                      @RequestBody ProvisionTechniqueDto.UpdateRequest req) {
        return service.mettrAJour(TenantContext.get(), id, req);
    }

    @Operation(summary = "Supprimer une provision")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable UUID id) {
        service.supprimer(TenantContext.get(), id);
    }
}
