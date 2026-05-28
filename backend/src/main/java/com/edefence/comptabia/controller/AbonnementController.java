package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.abonnement.AbonnementDto;
import com.edefence.comptabia.dto.facture.FactureDto;
import com.edefence.comptabia.service.AbonnementService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/abonnements")
@RequiredArgsConstructor
public class AbonnementController {

    private final AbonnementService svc;

    @GetMapping
    public List<AbonnementDto.Resume> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/{id}")
    public AbonnementDto.Response findOne(@PathVariable UUID id) {
        return svc.findOne(id, TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public AbonnementDto.Response create(@Valid @RequestBody AbonnementDto.SaveRequest req) {
        return svc.create(TenantContext.get(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public AbonnementDto.Response update(@PathVariable UUID id,
                                         @Valid @RequestBody AbonnementDto.SaveRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void toggle(@PathVariable UUID id) {
        svc.toggle(id, TenantContext.get());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }

    @PostMapping("/{id}/generer")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    @ResponseStatus(HttpStatus.CREATED)
    public FactureDto.Response generer(@PathVariable UUID id) {
        return svc.genererFacture(id, TenantContext.get());
    }
}
