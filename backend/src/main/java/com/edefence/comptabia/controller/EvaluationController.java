package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.evaluation.EvaluationDto;
import com.edefence.comptabia.service.EvaluationService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/evaluations")
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService svc;

    // ── Objectifs ─────────────────────────────────────────────────────────────

    @GetMapping("/objectifs")
    public List<EvaluationDto.ObjectifResponse> mesObjectifs(
            @AuthenticationPrincipal Utilisateur user,
            @RequestParam int annee) {
        return svc.mesObjectifs(TenantContext.get(), user.getId(), annee);
    }

    @GetMapping("/objectifs/all")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EvaluationDto.ObjectifResponse> allObjectifs(@RequestParam int annee) {
        return svc.allObjectifs(TenantContext.get(), annee);
    }

    @PostMapping("/objectifs")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public EvaluationDto.ObjectifResponse createObjectif(
            @RequestParam UUID collaborateurId,
            @Valid @RequestBody EvaluationDto.ObjectifSaveRequest req) {
        return svc.createObjectifForCollab(TenantContext.get(), collaborateurId, req);
    }

    @PutMapping("/objectifs/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public EvaluationDto.ObjectifResponse updateObjectif(
            @PathVariable UUID id,
            @Valid @RequestBody EvaluationDto.ObjectifSaveRequest req) {
        return svc.updateObjectif(id, TenantContext.get(), req);
    }

    @DeleteMapping("/objectifs/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteObjectif(@PathVariable UUID id) {
        svc.deleteObjectif(id, TenantContext.get());
    }

    // ── Evaluations ───────────────────────────────────────────────────────────

    @GetMapping("/mes-evaluations")
    public List<EvaluationDto.EvaluationResponse> mesEvaluations(@AuthenticationPrincipal Utilisateur user) {
        return svc.mesEvaluations(TenantContext.get(), user.getId());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<EvaluationDto.EvaluationResponse> allEvaluations() {
        return svc.allEvaluations(TenantContext.get());
    }

    @GetMapping("/soumises")
    @PreAuthorize("hasRole('ADMIN')")
    public List<EvaluationDto.EvaluationResponse> soumises() {
        return svc.soumises(TenantContext.get());
    }

    @GetMapping("/{id}")
    public EvaluationDto.EvaluationResponse findOne(@PathVariable UUID id) {
        return svc.findOne(id, TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public EvaluationDto.EvaluationResponse create(@Valid @RequestBody EvaluationDto.EvaluationCreateRequest req) {
        return svc.create(TenantContext.get(), req);
    }

    @PutMapping("/{id}/lignes")
    public EvaluationDto.EvaluationResponse saveLignes(
            @PathVariable UUID id,
            @Valid @RequestBody EvaluationDto.EvaluationSaveRequest req) {
        return svc.saveLignes(id, TenantContext.get(), req);
    }

    @PostMapping("/{id}/soumettre")
    public EvaluationDto.EvaluationResponse soumettre(@PathVariable UUID id) {
        return svc.soumettre(id, TenantContext.get());
    }

    @PostMapping("/{id}/valider")
    @PreAuthorize("hasRole('ADMIN')")
    public EvaluationDto.EvaluationResponse valider(@PathVariable UUID id) {
        return svc.valider(id, TenantContext.get());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }
}
