package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.conge.CongeDto;
import com.edefence.comptabia.service.CongeService;
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
@RequestMapping("/api/conges")
@RequiredArgsConstructor
public class CongeController {

    private final CongeService svc;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public List<CongeDto.Response> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/mes-conges")
    public List<CongeDto.Response> mesConges(@AuthenticationPrincipal Utilisateur user) {
        return svc.mesConges(TenantContext.get(), user.getId());
    }

    @GetMapping("/soumises")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CongeDto.Response> soumises() {
        return svc.soumises(TenantContext.get());
    }

    @GetMapping("/calendrier")
    public List<CongeDto.CalendrierItem> calendrier(
            @RequestParam int annee,
            @RequestParam int mois) {
        return svc.calendrier(TenantContext.get(), annee, mois);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CongeDto.Response create(@Valid @RequestBody CongeDto.SaveRequest req,
                                    @AuthenticationPrincipal Utilisateur user) {
        return svc.create(TenantContext.get(), user.getId(), req);
    }

    @PutMapping("/{id}")
    public CongeDto.Response update(@PathVariable UUID id,
                                    @Valid @RequestBody CongeDto.SaveRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }

    @PostMapping("/{id}/soumettre")
    public CongeDto.Response soumettre(@PathVariable UUID id) {
        return svc.soumettre(id, TenantContext.get());
    }

    @PostMapping("/{id}/approuver")
    @PreAuthorize("hasRole('ADMIN')")
    public CongeDto.Response approuver(@PathVariable UUID id) {
        return svc.approuver(id, TenantContext.get());
    }

    @PostMapping("/{id}/rejeter")
    @PreAuthorize("hasRole('ADMIN')")
    public CongeDto.Response rejeter(@PathVariable UUID id,
                                     @RequestBody CongeDto.RejeterRequest req) {
        return svc.rejeter(id, TenantContext.get(), req);
    }
}
