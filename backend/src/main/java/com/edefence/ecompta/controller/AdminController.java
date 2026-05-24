package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.admin.EntrepriseSettingsDto;
import com.edefence.ecompta.dto.admin.UtilisateurAdminDto;
import com.edefence.ecompta.service.AdminService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService service;

    // ─── Utilisateurs ────────────────────────────────────────────────────────

    @GetMapping("/utilisateurs")
    public List<UtilisateurAdminDto.Response> lister() {
        return service.listerUtilisateurs(TenantContext.get());
    }

    @PostMapping("/utilisateurs/inviter")
    @ResponseStatus(HttpStatus.CREATED)
    public UtilisateurAdminDto.Response inviter(@Valid @RequestBody UtilisateurAdminDto.InviterRequest req) {
        return service.inviterUtilisateur(TenantContext.get(), req);
    }

    @PatchMapping("/utilisateurs/{id}/role")
    public UtilisateurAdminDto.Response changerRole(
            @PathVariable UUID id,
            @RequestBody UtilisateurAdminDto.UpdateRoleRequest req,
            @AuthenticationPrincipal UserDetails caller) {
        return service.changerRole(TenantContext.get(), id, req.role(), caller.getUsername());
    }

    @PatchMapping("/utilisateurs/{id}/actif")
    public UtilisateurAdminDto.Response changerActif(
            @PathVariable UUID id,
            @RequestBody UtilisateurAdminDto.UpdateActifRequest req,
            @AuthenticationPrincipal UserDetails caller) {
        return service.changerActif(TenantContext.get(), id, req.actif(), caller.getUsername());
    }

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
