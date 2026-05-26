package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.gouvernance.AssocieDto;
import com.edefence.ecompta.dto.gouvernance.AssembleeDto;
import com.edefence.ecompta.service.AssocieService;
import com.edefence.ecompta.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Gouvernance", description = "Registre des associés, Assemblées (AG/CA), Résolutions, Portail associé")
@RestController
@RequestMapping("/api/gouvernance")
@RequiredArgsConstructor
public class AssocieController {

    private final AssocieService svc;

    // ─── Associés ────────────────────────────────────────────────────────────

    @Operation(summary = "Lister les associés")
    @GetMapping("/associes")
    public List<AssocieDto.Response> listerAssocies() {
        return svc.listerAssocies(TenantContext.get());
    }

    @Operation(summary = "Créer un associé")
    @PostMapping("/associes")
    @ResponseStatus(HttpStatus.CREATED)
    public AssocieDto.Response creerAssocie(@RequestBody AssocieDto.CreateRequest req) {
        return svc.creerAssocie(TenantContext.get(), req);
    }

    @Operation(summary = "Mettre à jour un associé")
    @PatchMapping("/associes/{id}")
    public AssocieDto.Response mettreAJourAssocie(@PathVariable UUID id,
                                                   @RequestBody AssocieDto.UpdateRequest req) {
        return svc.mettreAJourAssocie(TenantContext.get(), id, req);
    }

    @Operation(summary = "Régénérer le token de portail d'un associé")
    @PostMapping("/associes/{id}/regenerer-token")
    public AssocieDto.Response regenererToken(@PathVariable UUID id) {
        return svc.regenererToken(TenantContext.get(), id);
    }

    @Operation(summary = "Supprimer un associé")
    @DeleteMapping("/associes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimerAssocie(@PathVariable UUID id) {
        svc.supprimerAssocie(TenantContext.get(), id);
    }

    // ─── Assemblées ──────────────────────────────────────────────────────────

    @Operation(summary = "Lister les assemblées (AG/CA)")
    @GetMapping("/assemblees")
    public List<AssembleeDto.Response> listerAssemblees() {
        return svc.listerAssemblees(TenantContext.get());
    }

    @Operation(summary = "Détail d'une assemblée avec résolutions")
    @GetMapping("/assemblees/{id}")
    public AssembleeDto.Response getAssemblee(@PathVariable UUID id) {
        return svc.getAssemblee(TenantContext.get(), id);
    }

    @Operation(summary = "Créer une assemblée")
    @PostMapping("/assemblees")
    @ResponseStatus(HttpStatus.CREATED)
    public AssembleeDto.Response creerAssemblee(@RequestBody AssembleeDto.CreateRequest req) {
        return svc.creerAssemblee(TenantContext.get(), req);
    }

    @Operation(summary = "Mettre à jour une assemblée (statut, PV, résolutions)")
    @PatchMapping("/assemblees/{id}")
    public AssembleeDto.Response mettreAJourAssemblee(@PathVariable UUID id,
                                                       @RequestBody AssembleeDto.UpdateRequest req) {
        return svc.mettreAJourAssemblee(TenantContext.get(), id, req);
    }

    @Operation(summary = "Supprimer une assemblée")
    @DeleteMapping("/assemblees/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimerAssemblee(@PathVariable UUID id) {
        svc.supprimerAssemblee(TenantContext.get(), id);
    }
}
