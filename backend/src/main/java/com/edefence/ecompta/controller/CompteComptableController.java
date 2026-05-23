package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.compte.CompteDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.service.CompteComptableService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comptes")
@RequiredArgsConstructor
public class CompteComptableController {

    private final CompteComptableService service;
    private final EntrepriseRepository entrepriseRepo;

    @GetMapping
    public List<CompteDto.Response> findAll(@AuthenticationPrincipal Utilisateur user) {
        return service.findAll(TenantContext.get());
    }

    @GetMapping("/classe/{classe}")
    public List<CompteDto.Response> findByClasse(@PathVariable int classe,
                                                  @AuthenticationPrincipal Utilisateur user) {
        return service.findByClasse(TenantContext.get(), classe);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public CompteDto.Response create(@Valid @RequestBody CompteDto.Request dto,
                                     @AuthenticationPrincipal Utilisateur user) {
        Entreprise entreprise = loadEntreprise();
        return service.create(TenantContext.get(), dto, entreprise);
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public void toggle(@PathVariable java.util.UUID id) {
        service.toggleActif(id, TenantContext.get());
    }

    private Entreprise loadEntreprise() {
        return entrepriseRepo.findById(TenantContext.get())
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
    }
}
