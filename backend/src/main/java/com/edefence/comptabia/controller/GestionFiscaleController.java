package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.fiscal.FiscalDto;
import com.edefence.comptabia.service.GestionFiscaleService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/fiscal")
@RequiredArgsConstructor
public class GestionFiscaleController {

    private final GestionFiscaleService svc;

    @GetMapping("/ref")
    public List<FiscalDto.ObligationRefResponse> refParPays(@RequestParam String codePays) {
        return svc.refParPays(codePays);
    }

    @GetMapping
    public List<FiscalDto.DeclarationResponse> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/annee/{annee}")
    public List<FiscalDto.DeclarationResponse> findByAnnee(@PathVariable int annee) {
        return svc.findByAnnee(TenantContext.get(), annee);
    }

    @GetMapping("/calendrier/{annee}")
    public List<FiscalDto.CalendrierItem> calendrier(@PathVariable int annee) {
        return svc.calendrier(TenantContext.get(), annee);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FiscalDto.DeclarationResponse create(@Valid @RequestBody FiscalDto.DeclarationSaveRequest req) {
        return svc.create(TenantContext.get(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public FiscalDto.DeclarationResponse update(@PathVariable UUID id,
                                                @Valid @RequestBody FiscalDto.DeclarationUpdateRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }
}
