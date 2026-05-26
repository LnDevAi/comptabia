package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Candidature;
import com.edefence.ecompta.domain.OffreEmploi;
import com.edefence.ecompta.dto.recrutement.RecrutementDto;
import com.edefence.ecompta.service.RecrutementService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/recrutement")
@RequiredArgsConstructor
public class RecrutementController {

    private final RecrutementService svc;

    // ── Offres ────────────────────────────────────────────────────────────

    @GetMapping("/offres")
    public List<RecrutementDto.OffreResponse> findOffres() {
        return svc.findOffres(TenantContext.get());
    }

    @PostMapping("/offres")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.OffreResponse createOffre(
            @Valid @RequestBody RecrutementDto.OffreRequest req) {
        return svc.createOffre(TenantContext.get(), req);
    }

    @PatchMapping("/offres/{id}/statut")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.OffreResponse updateStatutOffre(
            @PathVariable UUID id,
            @RequestParam OffreEmploi.Statut statut) {
        return svc.updateStatutOffre(id, TenantContext.get(), statut);
    }

    @DeleteMapping("/offres/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteOffre(@PathVariable UUID id) {
        svc.deleteOffre(id, TenantContext.get());
    }

    // ── Candidatures ──────────────────────────────────────────────────────

    @GetMapping("/candidatures")
    public List<RecrutementDto.CandidatureResponse> findCandidatures() {
        return svc.findCandidatures(TenantContext.get());
    }

    @PostMapping("/candidatures")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.CandidatureResponse createCandidature(
            @Valid @RequestBody RecrutementDto.CandidatureRequest req) {
        return svc.createCandidature(TenantContext.get(), req);
    }

    @PatchMapping("/candidatures/{id}/statut")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.CandidatureResponse avancerStatut(
            @PathVariable UUID id,
            @RequestParam Candidature.Statut statut) {
        return svc.avancerStatut(id, TenantContext.get(), statut);
    }

    @DeleteMapping("/candidatures/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCandidature(@PathVariable UUID id) {
        svc.deleteCandidature(id, TenantContext.get());
    }

    // ── Onboarding ────────────────────────────────────────────────────────

    @GetMapping("/onboarding")
    public List<RecrutementDto.PlanResponse> findPlans() {
        return svc.findPlans(TenantContext.get());
    }

    @PostMapping("/onboarding")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.PlanResponse createPlan(
            @Valid @RequestBody RecrutementDto.PlanRequest req) {
        return svc.createPlan(TenantContext.get(), req);
    }

    @PostMapping("/onboarding/{planId}/taches")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.PlanResponse addTache(
            @PathVariable UUID planId,
            @Valid @RequestBody RecrutementDto.TacheRequest req) {
        return svc.addTache(planId, TenantContext.get(), req);
    }

    @PatchMapping("/onboarding/{planId}/taches/{tacheId}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public RecrutementDto.PlanResponse toggleTache(
            @PathVariable UUID planId,
            @PathVariable UUID tacheId) {
        return svc.toggleTache(planId, tacheId, TenantContext.get());
    }

    @DeleteMapping("/onboarding/{planId}/taches/{tacheId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteTache(
            @PathVariable UUID planId,
            @PathVariable UUID tacheId) {
        svc.deleteTache(planId, tacheId, TenantContext.get());
    }

    @DeleteMapping("/onboarding/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePlan(@PathVariable UUID id) {
        svc.deletePlan(id, TenantContext.get());
    }
}
