package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.admin.InvitationDto;
import com.edefence.comptabia.tenant.TenantContext;
import com.edefence.comptabia.service.AdminUtilisateurService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Administration", description = "Gestion des utilisateurs de l'entreprise")
@RestController
@RequestMapping("/api/admin/utilisateurs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUtilisateurController {

    private final AdminUtilisateurService service;

    @Operation(summary = "Lister les utilisateurs", description = "Retourne tous les utilisateurs de l'entreprise courante.")
    @GetMapping
    public List<InvitationDto.UtilisateurAdminResponse> lister() {
        return service.lister(TenantContext.get());
    }

    @Operation(summary = "Inviter un utilisateur", description = "Crée un compte inactif et envoie un email d'invitation.")
    @PostMapping("/invite")
    @ResponseStatus(HttpStatus.CREATED)
    public InvitationDto.UtilisateurAdminResponse inviter(
            @RequestBody InvitationDto.InviteRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return service.inviter(TenantContext.get(), req, user.getUsername());
    }

    @Operation(summary = "Changer le rôle d'un utilisateur")
    @PatchMapping("/{id}/role")
    public InvitationDto.UtilisateurAdminResponse changerRole(
            @PathVariable UUID id,
            @RequestBody InvitationDto.ChangeRoleRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return service.changerRole(TenantContext.get(), id, req, user.getUsername());
    }

    @Operation(summary = "Activer un utilisateur")
    @PostMapping("/{id}/activer")
    public InvitationDto.UtilisateurAdminResponse activer(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        return service.toggleActif(TenantContext.get(), id, true, user.getUsername());
    }

    @Operation(summary = "Désactiver un utilisateur")
    @PostMapping("/{id}/desactiver")
    public InvitationDto.UtilisateurAdminResponse desactiver(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        return service.toggleActif(TenantContext.get(), id, false, user.getUsername());
    }

    @Operation(summary = "Supprimer un utilisateur")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        service.supprimer(TenantContext.get(), id, user.getUsername());
    }
}
