package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.admin.EntrepriseSettingsDto;
import com.edefence.comptabia.service.AdminService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService service;

    // ─── Paramètres entreprise ────────────────────────────────────────────────

    @GetMapping("/entreprise")
    public EntrepriseSettingsDto.Response getSettings() {
        return service.getSettings(TenantContext.get());
    }

    @PatchMapping("/entreprise")
    public EntrepriseSettingsDto.Response updateSettings(@RequestBody EntrepriseSettingsDto.UpdateRequest req) {
        return service.updateSettings(TenantContext.get(), req);
    }
}
