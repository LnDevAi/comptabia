package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.admin.EntrepriseSettingsDto;
import com.edefence.ecompta.service.AdminService;
import com.edefence.ecompta.tenant.TenantContext;
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
