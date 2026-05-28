package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.devise.DeviseDto;
import com.edefence.comptabia.service.DeviseService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/devises")
@RequiredArgsConstructor
public class DeviseController {

    private final DeviseService svc;

    @GetMapping("/taux")
    public List<DeviseDto.TauxResponse> listTaux() {
        return svc.listTaux(TenantContext.get());
    }

    @GetMapping("/taux/latest")
    public List<DeviseDto.TauxLatest> tauxLatest() {
        return svc.tauxLatest(TenantContext.get());
    }

    @PostMapping("/taux")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public DeviseDto.TauxResponse upsertTaux(@Valid @RequestBody DeviseDto.TauxRequest req) {
        return svc.upsertTaux(TenantContext.get(), req);
    }

    @DeleteMapping("/taux/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void deleteTaux(@PathVariable UUID id) {
        svc.deleteTaux(id, TenantContext.get());
    }

    @GetMapping("/soldes")
    public List<DeviseDto.SoldeDevise> soldesParDevise() {
        return svc.soldesParDevise(TenantContext.get());
    }

    @PostMapping("/convertir")
    public DeviseDto.ConversionResponse convertir(@Valid @RequestBody DeviseDto.ConversionRequest req) {
        return svc.convertir(TenantContext.get(), req);
    }
}
