package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.compte.CompteDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.service.CompteComptableService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/comptes")
@RequiredArgsConstructor
public class CompteComptableController {

    private final CompteComptableService service;
    private final EntrepriseRepository   entrepriseRepo;

    @GetMapping
    public List<CompteDto.Response> findAll(@RequestParam(required = false) String q) {
        return q != null && !q.isBlank()
                ? service.search(TenantContext.get(), q)
                : service.findAll(TenantContext.get());
    }

    @GetMapping("/classe/{classe}")
    public List<CompteDto.Response> findByClasse(@PathVariable int classe) {
        return service.findByClasse(TenantContext.get(), classe);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public CompteDto.Response create(@Valid @RequestBody CompteDto.Request dto,
                                     @AuthenticationPrincipal Utilisateur user) {
        return service.create(TenantContext.get(), dto, loadEntreprise());
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public CompteDto.Response update(@PathVariable UUID id,
                                     @RequestBody CompteDto.UpdateRequest dto) {
        return service.update(id, TenantContext.get(), dto);
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public CompteDto.Response toggle(@PathVariable UUID id) {
        return service.toggleActif(id, TenantContext.get());
    }

    private Entreprise loadEntreprise() {
        return entrepriseRepo.findById(TenantContext.get())
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
    }
}
