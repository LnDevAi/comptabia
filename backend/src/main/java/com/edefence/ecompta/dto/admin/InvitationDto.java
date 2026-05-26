package com.edefence.ecompta.dto.admin;

import com.edefence.ecompta.domain.Utilisateur;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class InvitationDto {

    private InvitationDto() {}

    public record InviteRequest(String email, String nom, Utilisateur.Role role) {}

    public record AcceptInviteRequest(String token, String motDePasse) {}

    public record ChangeRoleRequest(Utilisateur.Role role) {}

    public record UtilisateurAdminResponse(
            UUID id,
            String nom,
            String email,
            String role,
            boolean actif,
            boolean invitePending,
            boolean totpEnabled,
            OffsetDateTime createdAt
    ) {}
}
