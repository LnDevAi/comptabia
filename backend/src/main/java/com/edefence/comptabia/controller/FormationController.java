package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.formation.FormationDto;
import com.edefence.comptabia.service.FormationService;
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
@RequestMapping("/api/formation")
@RequiredArgsConstructor
public class FormationController {

    private final FormationService svc;

    // ── Formations ────────────────────────────────────────────────────────────

    @GetMapping
    public List<FormationDto.FormationResponse> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/annee/{annee}")
    public List<FormationDto.FormationResponse> findByAnnee(@PathVariable int annee) {
        return svc.findByAnnee(TenantContext.get(), annee);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public FormationDto.FormationResponse createFormation(@Valid @RequestBody FormationDto.FormationSaveRequest req) {
        return svc.createFormation(TenantContext.get(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public FormationDto.FormationResponse updateFormation(@PathVariable UUID id,
                                                          @RequestBody FormationDto.FormationUpdateRequest req) {
        return svc.updateFormation(id, TenantContext.get(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteFormation(@PathVariable UUID id) {
        svc.deleteFormation(id, TenantContext.get());
    }

    // ── Sessions ──────────────────────────────────────────────────────────────

    @GetMapping("/sessions")
    public List<FormationDto.SessionResponse> findSessions() {
        return svc.findSessions(TenantContext.get());
    }

    @GetMapping("/{formationId}/sessions")
    public List<FormationDto.SessionResponse> findSessionsByFormation(@PathVariable UUID formationId) {
        return svc.findSessionsByFormation(formationId);
    }

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public FormationDto.SessionResponse createSession(@Valid @RequestBody FormationDto.SessionSaveRequest req) {
        return svc.createSession(TenantContext.get(), req);
    }

    @PutMapping("/sessions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public FormationDto.SessionResponse updateSession(@PathVariable UUID id,
                                                      @RequestBody FormationDto.SessionUpdateRequest req) {
        return svc.updateSession(id, TenantContext.get(), req);
    }

    @DeleteMapping("/sessions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteSession(@PathVariable UUID id) {
        svc.deleteSession(id, TenantContext.get());
    }

    // ── Inscriptions ──────────────────────────────────────────────────────────

    @GetMapping("/sessions/{sessionId}/inscriptions")
    public List<FormationDto.InscriptionResponse> findInscriptions(@PathVariable UUID sessionId) {
        return svc.findInscriptions(sessionId);
    }

    @GetMapping("/mes-formations")
    public List<FormationDto.InscriptionResponse> mesFormations(@AuthenticationPrincipal Utilisateur user) {
        return svc.mesFormations(TenantContext.get(), user.getId());
    }

    @PostMapping("/sessions/{sessionId}/inscrire")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public FormationDto.InscriptionResponse inscrire(@PathVariable UUID sessionId,
                                                     @Valid @RequestBody FormationDto.InscriptionSaveRequest req) {
        return svc.inscrire(sessionId, TenantContext.get(), req);
    }

    @PutMapping("/inscriptions/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public FormationDto.InscriptionResponse updateInscription(@PathVariable UUID id,
                                                              @RequestBody FormationDto.InscriptionUpdateRequest req) {
        return svc.updateInscription(id, TenantContext.get(), req);
    }

    @DeleteMapping("/inscriptions/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void desinscrire(@PathVariable UUID id) {
        svc.desinscrire(id, TenantContext.get());
    }

    // ── Bilan ─────────────────────────────────────────────────────────────────

    @GetMapping("/bilan")
    @PreAuthorize("hasRole('ADMIN')")
    public List<FormationDto.BilanCollaborateur> bilan() {
        return svc.bilan(TenantContext.get());
    }
}
