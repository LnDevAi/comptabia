package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.discipline.DisciplineDto;
import com.edefence.ecompta.service.DisciplineService;
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
@RequestMapping("/api/discipline")
@RequiredArgsConstructor
public class DisciplineController {

    private final DisciplineService svc;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<DisciplineDto.DossierResponse> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/en-cours")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DisciplineDto.DossierResponse> findEnCours() {
        return svc.findEnCours(TenantContext.get());
    }

    @GetMapping("/collaborateur/{collabId}")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DisciplineDto.DossierResponse> findByCollaborateur(@PathVariable UUID collabId) {
        return svc.findByCollaborateur(TenantContext.get(), collabId);
    }

    @GetMapping("/historique")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DisciplineDto.HistoriqueCollaborateur> historique() {
        return svc.historique(TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public DisciplineDto.DossierResponse create(@Valid @RequestBody DisciplineDto.DossierSaveRequest req,
                                                @AuthenticationPrincipal Utilisateur user) {
        return svc.create(TenantContext.get(), user.getId(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DisciplineDto.DossierResponse update(@PathVariable UUID id,
                                                @RequestBody DisciplineDto.DossierUpdateRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @PostMapping("/{id}/cloture")
    @PreAuthorize("hasRole('ADMIN')")
    public DisciplineDto.DossierResponse cloture(@PathVariable UUID id) {
        return svc.cloture(id, TenantContext.get());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }

    @GetMapping("/{dossierId}/etapes")
    @PreAuthorize("hasRole('ADMIN')")
    public List<DisciplineDto.EtapeResponse> findEtapes(@PathVariable UUID dossierId) {
        return svc.findEtapes(dossierId, TenantContext.get());
    }

    @PostMapping("/{dossierId}/etapes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public DisciplineDto.EtapeResponse addEtape(@PathVariable UUID dossierId,
                                                @Valid @RequestBody DisciplineDto.EtapeSaveRequest req) {
        return svc.addEtape(dossierId, TenantContext.get(), req);
    }

    @DeleteMapping("/etapes/{etapeId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteEtape(@PathVariable UUID etapeId) {
        svc.deleteEtape(etapeId);
    }
}
