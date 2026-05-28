package com.edefence.comptabia.dto.compte;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public class CompteDto {

    public record Request(
            @NotBlank String numero,
            @NotBlank String intitule,
            @NotNull @Min(1) @Max(9) Integer classe
    ) {}

    public record UpdateRequest(
            String numero,
            String intitule
    ) {}

    public record Response(
            UUID id,
            String numero,
            String intitule,
            int classe,
            boolean actif,
            OffsetDateTime createdAt
    ) {}
}
