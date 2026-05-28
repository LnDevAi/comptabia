package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.Facture;
import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.facture.FactureDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.service.FactureService;
import com.edefence.comptabia.tenant.TenantContext;
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
@RequestMapping("/api/factures")
@RequiredArgsConstructor
public class FactureController {

    private final FactureService       svc;
    private final EntrepriseRepository entrepriseRepo;

    @GetMapping("/stats")
    public FactureDto.StatFacturation stats(
            @RequestParam(defaultValue = "0") int exercice) {
        return svc.getStats(TenantContext.get(), exercice);
    }

    @GetMapping
    public Page<FactureDto.Resume> findAll(
            @RequestParam(required = false) Facture.Statut statut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20) Pageable pageable) {
        return svc.findAll(TenantContext.get(), statut, from, to, pageable);
    }

    @GetMapping("/{id}")
    public FactureDto.Response findOne(@PathVariable UUID id) {
        return svc.findOne(id, TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FactureDto.Response create(@Valid @RequestBody FactureDto.CreateRequest req,
                                      @AuthenticationPrincipal Utilisateur auteur) {
        return svc.create(TenantContext.get(), req, loadEntreprise(), auteur);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FactureDto.Response update(@PathVariable UUID id,
                                      @Valid @RequestBody FactureDto.UpdateRequest req,
                                      @AuthenticationPrincipal Utilisateur auteur) {
        return svc.update(id, TenantContext.get(), req, loadEntreprise());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }

    @PostMapping("/{id}/emettre")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FactureDto.Response emettre(@PathVariable UUID id,
                                       @AuthenticationPrincipal Utilisateur auteur) {
        return svc.emettre(id, TenantContext.get(), loadEntreprise(), auteur);
    }

    @PostMapping("/{id}/payer")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FactureDto.Response payer(@PathVariable UUID id,
                                     @Valid @RequestBody FactureDto.PayerRequest req,
                                     @AuthenticationPrincipal Utilisateur auteur) {
        return svc.payer(id, TenantContext.get(), req, loadEntreprise(), auteur);
    }

    @PostMapping("/{id}/annuler")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FactureDto.Response annuler(@PathVariable UUID id) {
        return svc.annuler(id, TenantContext.get());
    }

    @PostMapping("/{id}/normaliser")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FactureDto.Response normaliser(@PathVariable UUID id,
                                          @Valid @RequestBody FactureDto.NormalisationRequest req) {
        return svc.normaliser(id, TenantContext.get(), req);
    }

    private Entreprise loadEntreprise() {
        return entrepriseRepo.findById(TenantContext.get())
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
    }
}
