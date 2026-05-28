package com.edefence.comptabia.dto.paie;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class PayeDto {

    public record SauvegarderRequest(
        @Min(1) @Max(12)
        int mois,

        @Min(0)
        int nbSalaries,

        @NotNull @DecimalMin("0.0")
        BigDecimal masseSalarialeBrute,

        @NotNull @DecimalMin("0.0")
        BigDecimal cotisationsSalariales,

        @NotNull @DecimalMin("0.0")
        BigDecimal cotisationsPatronales,

        @NotNull @DecimalMin("0.0")
        BigDecimal impotRetenu
    ) {}

    public record Response(
        UUID           id,
        int            exercice,
        int            mois,
        String         moisLibelle,
        int            nbSalaries,
        BigDecimal     masseSalarialeBrute,
        BigDecimal     cotisationsSalariales,
        BigDecimal     cotisationsPatronales,
        BigDecimal     impotRetenu,
        BigDecimal     netAPayer,
        BigDecimal     coutTotal,
        String         statut,
        UUID           ecritureId,
        OffsetDateTime createdAt
    ) {}
}
