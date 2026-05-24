package com.edefence.ecompta.dto.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class UtilisateurAdminDto {

    private UtilisateurAdminDto() {}

    public record Response(
            UUID id,
            String nom,
            String email,
            String role,
            boolean actif,
            OffsetDateTime createdAt
    ) {}

    public record InviterRequest(
            @NotBlank String nom,
            @NotBlank @Email String email,
            @NotNull String role,
            @NotBlank String motDePasse
    ) {}

    public record UpdateRoleRequest(@NotNull String role) {}

    public record UpdateActifRequest(boolean actif) {}
}
