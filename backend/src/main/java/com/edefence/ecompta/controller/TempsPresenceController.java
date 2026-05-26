package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.temps.TempsPresenceDto;
import com.edefence.ecompta.service.TempsPresenceService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/temps-presences")
@RequiredArgsConstructor
public class TempsPresenceController {

    private final TempsPresenceService svc;

    // ─── Pointages ────────────────────────────────────────────────────────

    @GetMapping("/pointages")
    public List<TempsPresenceDto.PointageResponse> findPointages(
            @RequestParam(defaultValue = "0") int mois,
            @RequestParam(defaultValue = "0") int annee) {
        LocalDate now = LocalDate.now();
        int m = mois  > 0 ? mois  : now.getMonthValue();
        int a = annee > 0 ? annee : now.getYear();
        return svc.findPointages(TenantContext.get(), m, a);
    }

    @PostMapping("/pointages")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TempsPresenceDto.PointageResponse createPointage(
            @Valid @RequestBody TempsPresenceDto.PointageRequest req) {
        return svc.createPointage(TenantContext.get(), req);
    }

    @PatchMapping("/pointages/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TempsPresenceDto.PointageResponse patchPointage(
            @PathVariable UUID id,
            @RequestBody TempsPresenceDto.PointagePatchRequest req) {
        return svc.patchPointage(id, TenantContext.get(), req);
    }

    @DeleteMapping("/pointages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deletePointage(@PathVariable UUID id) {
        svc.deletePointage(id, TenantContext.get());
    }

    // ─── Absences ─────────────────────────────────────────────────────────

    @GetMapping("/absences")
    public List<TempsPresenceDto.AbsenceResponse> findAbsences() {
        return svc.findAbsences(TenantContext.get());
    }

    @PostMapping("/absences")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TempsPresenceDto.AbsenceResponse createAbsence(
            @Valid @RequestBody TempsPresenceDto.AbsenceRequest req) {
        return svc.createAbsence(TenantContext.get(), req);
    }

    @PostMapping("/absences/{id}/approuver")
    @PreAuthorize("hasRole('ADMIN')")
    public TempsPresenceDto.AbsenceResponse approuver(@PathVariable UUID id) {
        return svc.approuver(id, TenantContext.get());
    }

    @PostMapping("/absences/{id}/rejeter")
    @PreAuthorize("hasRole('ADMIN')")
    public TempsPresenceDto.AbsenceResponse rejeter(@PathVariable UUID id) {
        return svc.rejeter(id, TenantContext.get());
    }

    @DeleteMapping("/absences/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAbsence(@PathVariable UUID id) {
        svc.deleteAbsence(id, TenantContext.get());
    }

    // ─── État mensuel ──────────────────────────────────────────────────────

    @GetMapping("/etat-mensuel")
    public TempsPresenceDto.EtatMensuel etatMensuel(
            @RequestParam(defaultValue = "0") int mois,
            @RequestParam(defaultValue = "0") int annee) {
        LocalDate now = LocalDate.now();
        int m = mois  > 0 ? mois  : now.getMonthValue();
        int a = annee > 0 ? annee : now.getYear();
        return svc.etatMensuel(TenantContext.get(), m, a);
    }
}
