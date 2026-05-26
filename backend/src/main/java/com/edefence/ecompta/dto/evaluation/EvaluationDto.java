package com.edefence.ecompta.dto.evaluation;

import com.edefence.ecompta.domain.Evaluation;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class EvaluationDto {

    public record ObjectifSaveRequest(
            @NotBlank String titre,
            String description,
            @NotNull @Min(1) @Max(100) Integer poids,
            @NotNull Integer annee
    ) {}

    public record ObjectifResponse(
            UUID id,
            UUID collaborateurId,
            String collaborateurNom,
            int annee,
            String titre,
            String description,
            int poids,
            OffsetDateTime createdAt
    ) {}

    public record EvaluationCreateRequest(
            @NotNull UUID collaborateurId,
            @NotNull Integer annee,
            @NotNull Evaluation.Periode periode
    ) {}

    public record LigneSaveRequest(
            @NotNull UUID objectifId,
            @NotNull BigDecimal note,
            String commentaire
    ) {}

    public record EvaluationSaveRequest(
            String commentaireGlobal,
            @NotNull List<LigneSaveRequest> lignes
    ) {}

    public record LigneResponse(
            UUID id,
            UUID objectifId,
            String objectifTitre,
            int objectifPoids,
            BigDecimal note,
            String commentaire
    ) {}

    public record EvaluationResponse(
            UUID id,
            UUID collaborateurId,
            String collaborateurNom,
            int annee,
            Evaluation.Periode periode,
            Evaluation.Statut statut,
            String commentaireGlobal,
            BigDecimal scoreGlobal,
            List<LigneResponse> lignes,
            OffsetDateTime createdAt
    ) {}
}
