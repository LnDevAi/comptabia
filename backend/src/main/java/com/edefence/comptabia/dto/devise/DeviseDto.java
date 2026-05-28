package com.edefence.comptabia.dto.devise;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class DeviseDto {

    public record TauxRequest(
            @NotBlank String devise,
            @NotNull LocalDate dateTaux,
            @NotNull @Positive BigDecimal taux
    ) {}

    public record TauxResponse(
            UUID id,
            String devise,
            LocalDate dateTaux,
            BigDecimal taux,
            OffsetDateTime createdAt
    ) {}

    public record TauxLatest(
            String devise,
            BigDecimal taux,
            LocalDate dateTaux
    ) {}

    public record SoldeDevise(
            String devise,
            BigDecimal totalDebitDevise,
            BigDecimal totalCreditDevise,
            BigDecimal soldeDevise,
            BigDecimal tauxActuel,
            BigDecimal soldeXof
    ) {}

    public record ConversionRequest(
            @NotNull BigDecimal montant,
            @NotBlank String deviseSource,
            @NotBlank String deviseCible,
            @NotNull LocalDate date
    ) {}

    public record ConversionResponse(
            BigDecimal montantSource,
            String deviseSource,
            BigDecimal montantCible,
            String deviseCible,
            BigDecimal taux,
            LocalDate date
    ) {}
}
