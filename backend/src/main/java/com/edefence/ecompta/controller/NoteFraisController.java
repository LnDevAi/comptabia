package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.notefrais.NoteFraisDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.service.NoteFraisService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/notes-frais")
@RequiredArgsConstructor
public class NoteFraisController {

    private final NoteFraisService     svc;
    private final EntrepriseRepository entrepriseRepo;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public NoteFraisDto.Stats stats(@RequestParam(defaultValue = "0") int exercice) {
        return svc.getStats(TenantContext.get(), exercice);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public List<NoteFraisDto.Resume> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/mes-notes")
    public List<NoteFraisDto.Resume> mesNotes(@AuthenticationPrincipal Utilisateur user) {
        return svc.findMesNotes(TenantContext.get(), user.getId());
    }

    @GetMapping("/soumises")
    @PreAuthorize("hasRole('ADMIN')")
    public List<NoteFraisDto.Resume> soumises() {
        return svc.findSoumises(TenantContext.get());
    }

    @GetMapping("/{id}")
    public NoteFraisDto.Response findOne(@PathVariable UUID id) {
        return svc.findOne(id, TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NoteFraisDto.Response create(@Valid @RequestBody NoteFraisDto.SaveRequest req,
                                         @AuthenticationPrincipal Utilisateur user) {
        return svc.create(TenantContext.get(), user.getId(), req);
    }

    @PutMapping("/{id}")
    public NoteFraisDto.Response update(@PathVariable UUID id,
                                         @Valid @RequestBody NoteFraisDto.SaveRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }

    @PostMapping("/{id}/soumettre")
    @ResponseStatus(HttpStatus.OK)
    public NoteFraisDto.Response soumettre(@PathVariable UUID id) {
        return svc.soumettre(id, TenantContext.get());
    }

    @PostMapping("/{id}/approuver")
    @PreAuthorize("hasRole('ADMIN')")
    public NoteFraisDto.Response approuver(@PathVariable UUID id,
                                            @AuthenticationPrincipal Utilisateur auteur) {
        UUID eid = TenantContext.get();
        return svc.approuver(id, eid, entrepriseRepo.getReferenceById(eid), auteur);
    }

    @PostMapping("/{id}/rejeter")
    @PreAuthorize("hasRole('ADMIN')")
    public NoteFraisDto.Response rejeter(@PathVariable UUID id,
                                          @RequestBody NoteFraisDto.RejeterRequest req) {
        return svc.rejeter(id, TenantContext.get(), req);
    }

    @PostMapping("/{id}/rembourser")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public NoteFraisDto.Response rembourser(@PathVariable UUID id,
                                             @AuthenticationPrincipal Utilisateur auteur) {
        UUID eid = TenantContext.get();
        return svc.rembourser(id, eid, entrepriseRepo.getReferenceById(eid), auteur);
    }
}
