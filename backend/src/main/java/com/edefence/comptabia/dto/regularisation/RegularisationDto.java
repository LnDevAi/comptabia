package com.edefence.comptabia.dto.regularisation;

import com.edefence.comptabia.domain.Regularisation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class RegularisationDto {

    public record SaveRequest(
            @NotNull Regularisation.TypeRegularisation type,
            @NotBlank String libelle,
            @NotBlank String compteContrepartie,
            @NotNull @Positive BigDecimal montant,
            @NotNull int exercice,
            @NotNull LocalDate dateRegularisation,
            @NotNull LocalDate dateExtourne
    ) {}

    public record Response(
            UUID id,
            Regularisation.TypeRegularisation type,
            String libelle,
            String compteContrepartie,
            BigDecimal montant,
            int exercice,
            LocalDate dateRegularisation,
            LocalDate dateExtourne,
            Regularisation.Statut statut,
            UUID ecritureId,
            UUID ecritureExtourneId,
            String compteRegularisation,
            String description
    ) {}
}
