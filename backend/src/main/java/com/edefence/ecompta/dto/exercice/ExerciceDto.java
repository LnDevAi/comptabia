package com.edefence.ecompta.dto.exercice;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class ExerciceDto {

    private ExerciceDto() {}

    public record Response(
            UUID id,
            int annee,
            String statut,
            LocalDate dateOuverture,
            LocalDate dateCloture,
            OffsetDateTime clotureAt
    ) {}

    public record ClotureResponse(
            UUID id,
            int annee,
            String statut,
            LocalDate dateCloture,
            BigDecimal totalCharges,
            BigDecimal totalProduits,
            BigDecimal resultatNet
    ) {}
}
