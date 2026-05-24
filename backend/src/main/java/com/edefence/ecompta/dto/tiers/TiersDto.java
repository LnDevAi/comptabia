package com.edefence.ecompta.dto.tiers;

import com.edefence.ecompta.domain.Tiers.TypeTiers;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class TiersDto {

    private TiersDto() {}

    public record Request(
            @NotBlank @Size(max = 20)  String code,
            @NotBlank @Size(max = 255) String nom,
            @NotNull                   TypeTiers type,
            String email,
            String telephone,
            String adresse,
            @Size(max = 20) String compteNumero
    ) {}

    public record Response(
            UUID id,
            String code,
            String nom,
            String type,
            String email,
            String telephone,
            String adresse,
            String compteNumero,
            boolean actif,
            OffsetDateTime createdAt
    ) {}

    public record Stats(
            long total,
            long clients,
            long fournisseurs,
            long actifs
    ) {}
}
