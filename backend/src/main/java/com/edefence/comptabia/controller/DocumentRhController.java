package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.document.DocumentRhDto;
import com.edefence.comptabia.service.DocumentRhService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents-rh")
@RequiredArgsConstructor
public class DocumentRhController {

    private final DocumentRhService svc;

    @GetMapping
    public List<DocumentRhDto.Response> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/collaborateur/{uid}")
    public List<DocumentRhDto.Response> findByCollaborateur(@PathVariable UUID uid) {
        return svc.findByCollaborateur(uid, TenantContext.get());
    }

    @GetMapping("/expirant")
    public List<DocumentRhDto.Response> findExpirant(
            @RequestParam(defaultValue = "30") int jours) {
        return svc.findExpirantBientot(TenantContext.get(), jours);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public DocumentRhDto.Response create(@Valid @RequestBody DocumentRhDto.SaveRequest req) {
        return svc.create(TenantContext.get(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public DocumentRhDto.Response update(
            @PathVariable UUID id,
            @Valid @RequestBody DocumentRhDto.SaveRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @PostMapping("/{id}/archiver")
    @PreAuthorize("hasRole('ADMIN')")
    public DocumentRhDto.Response archiver(@PathVariable UUID id) {
        return svc.archiver(id, TenantContext.get());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }
}
