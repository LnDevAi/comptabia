package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.analytique.AnalytiqueDto;
import com.edefence.ecompta.service.AnalytiqueService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytique")
@RequiredArgsConstructor
public class AnalytiqueController {

    private final AnalytiqueService service;

    // ─── Axes ────────────────────────────────────────────────────────────────

    @GetMapping("/axes")
    public List<AnalytiqueDto.AxeResponse> listerAxes(
            @RequestParam(required = false) String type) {
        return type != null
                ? service.listerAxesParType(TenantContext.get(), type)
                : service.listerAxes(TenantContext.get());
    }

    @PostMapping("/axes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public AnalytiqueDto.AxeResponse creerAxe(@RequestBody AnalytiqueDto.AxeRequest req) {
        return service.creerAxe(TenantContext.get(), req);
    }

    @PutMapping("/axes/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public AnalytiqueDto.AxeResponse modifierAxe(@PathVariable UUID id,
                                                  @RequestBody AnalytiqueDto.AxeRequest req) {
        return service.modifierAxe(TenantContext.get(), id, req);
    }

    @PatchMapping("/axes/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void toggleActif(@PathVariable UUID id) {
        service.toggleActif(TenantContext.get(), id);
    }

    @DeleteMapping("/axes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimerAxe(@PathVariable UUID id) {
        service.supprimerAxe(TenantContext.get(), id);
    }

    // ─── Ventilation ─────────────────────────────────────────────────────────

    @PostMapping("/ventiler")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void ventiler(@RequestBody AnalytiqueDto.VentilerRequest req) {
        service.ventiler(TenantContext.get(), req.ligneIds(), req.axeId());
    }

    // ─── Rapport général ─────────────────────────────────────────────────────

    @GetMapping("/rapport")
    public AnalytiqueDto.RapportResponse rapport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return service.rapport(TenantContext.get(), debut, fin);
    }

    // ─── Rapport bailleur ─────────────────────────────────────────────────────

    @GetMapping("/rapport-bailleur")
    public AnalytiqueDto.RapportBailleurResponse rapportBailleur(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return service.rapportBailleur(TenantContext.get(), debut, fin);
    }
}
