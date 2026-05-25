package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Devis;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.devis.DevisDto;
import com.edefence.ecompta.dto.facture.FactureDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.service.DevisService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/devis")
@RequiredArgsConstructor
public class DevisController {

    private final DevisService         svc;
    private final EntrepriseRepository entrepriseRepo;

    @GetMapping
    public Page<DevisDto.Resume> findAll(
            @RequestParam(required = false) Devis.Statut statut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20) Pageable pageable) {
        return svc.findAll(TenantContext.get(), statut, from, to, pageable);
    }

    @GetMapping("/{id}")
    public DevisDto.Response findOne(@PathVariable UUID id) {
        return svc.findOne(id, TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public DevisDto.Response create(@Valid @RequestBody DevisDto.SaveRequest req) {
        return svc.create(TenantContext.get(), req, loadEntreprise());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public DevisDto.Response update(@PathVariable UUID id,
                                    @Valid @RequestBody DevisDto.SaveRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }

    @PostMapping("/{id}/envoyer")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public DevisDto.Response envoyer(@PathVariable UUID id) {
        return svc.envoyer(id, TenantContext.get());
    }

    @PostMapping("/{id}/statut/{nouveau}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public DevisDto.Response changerStatut(@PathVariable UUID id,
                                           @PathVariable Devis.Statut nouveau) {
        return svc.changerStatut(id, TenantContext.get(), nouveau);
    }

    @PostMapping("/{id}/convertir")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FactureDto.Response convertir(@PathVariable UUID id,
                                          @AuthenticationPrincipal Utilisateur auteur) {
        return svc.convertirEnFacture(id, TenantContext.get(), loadEntreprise(), auteur);
    }

    private Entreprise loadEntreprise() {
        return entrepriseRepo.findById(TenantContext.get())
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
    }
}
