package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.pret.PretDto;
import com.edefence.ecompta.service.PretService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/prets")
@RequiredArgsConstructor
public class PretController {

    private final PretService svc;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<PretDto.PretResponse> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/collaborateur/{collabId}")
    public List<PretDto.PretResponse> findByCollaborateur(@PathVariable UUID collabId) {
        return svc.findByCollaborateur(collabId, TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public PretDto.PretResponse create(@Valid @RequestBody PretDto.PretRequest req) {
        return svc.create(TenantContext.get(), req);
    }

    @PostMapping("/{id}/approuver")
    @PreAuthorize("hasRole('ADMIN')")
    public PretDto.PretResponse approuver(@PathVariable UUID id) {
        return svc.approuver(id, TenantContext.get());
    }

    @PostMapping("/{id}/refuser")
    @PreAuthorize("hasRole('ADMIN')")
    public PretDto.PretResponse refuser(@PathVariable UUID id) {
        return svc.refuser(id, TenantContext.get());
    }

    @PostMapping("/{pretId}/echeances/{echeanceId}/prelever")
    @PreAuthorize("hasRole('ADMIN')")
    public PretDto.PretResponse prelevEcheance(
            @PathVariable UUID pretId,
            @PathVariable UUID echeanceId) {
        return svc.prelevEcheance(pretId, echeanceId, TenantContext.get());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }
}
