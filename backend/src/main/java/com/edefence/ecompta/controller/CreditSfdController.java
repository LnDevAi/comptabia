package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.sfd.CreditSfdDto;
import com.edefence.ecompta.service.CreditSfdService;
import com.edefence.ecompta.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Portefeuille crédits SFD", description = "Gestion du portefeuille de crédits — Microfinance BCEAO/UMOA")
@RestController
@RequestMapping("/api/credits-sfd")
@RequiredArgsConstructor
public class CreditSfdController {

    private final CreditSfdService service;

    private int currentYear() { return LocalDate.now().getYear(); }

    @Operation(summary = "Lister tous les crédits")
    @GetMapping
    public List<CreditSfdDto.Response> lister() {
        return service.lister(TenantContext.get());
    }

    @Operation(summary = "Dashboard SFD — PAR et ratios prudentiels BCEAO")
    @GetMapping("/dashboard")
    public CreditSfdDto.DashboardResponse dashboard(@RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : currentYear();
        return service.getDashboard(TenantContext.get(), annee);
    }

    @Operation(summary = "Créer un crédit")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CreditSfdDto.Response creer(@RequestBody CreditSfdDto.CreateRequest req) {
        return service.creer(TenantContext.get(), req);
    }

    @Operation(summary = "Mettre à jour un crédit")
    @PatchMapping("/{id}")
    public CreditSfdDto.Response mettrAJour(@PathVariable UUID id,
                                             @RequestBody CreditSfdDto.UpdateRequest req) {
        return service.mettrAJour(TenantContext.get(), id, req);
    }

    @Operation(summary = "Supprimer un crédit")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable UUID id) {
        service.supprimer(TenantContext.get(), id);
    }
}
