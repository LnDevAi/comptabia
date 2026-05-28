package com.edefence.comptabia.dto.admin;

import java.util.UUID;

public final class EntrepriseSettingsDto {

    private EntrepriseSettingsDto() {}

    public record Response(
            UUID id,
            String nom,
            String pays,
            String nif,
            String plan,
            String systemeComptable
    ) {}

    public record UpdateRequest(
            String nom,
            String pays,
            String nif,
            String systemeComptable
    ) {}
}
