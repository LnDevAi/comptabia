package com.edefence.ecompta.dto.immobilisation;

import com.edefence.ecompta.domain.Immobilisation.Categorie;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class ImmobilisationDto {

    private ImmobilisationDto() {}

    public record Request(
            @NotBlank @Size(max = 20)  String code,
            @NotBlank @Size(max = 255) String designation,
            @NotNull                   Categorie categorie,
            @Size(max = 20)            String compteNumero,
            @Size(max = 20)            String compteAmortNumero,
            @NotNull                   LocalDate dateAcquisition,
            @NotNull @DecimalMin("0.01") BigDecimal valeurBrute,
            @NotNull @Min(1) @Max(50)  int dureeAmortissement
    ) {}

    public record Response(
            UUID id,
            String code,
            String designation,
            String categorie,
            String compteNumero,
            String compteAmortNumero,
            LocalDate dateAcquisition,
            BigDecimal valeurBrute,
            int dureeAmortissement,
            String methode,
            String statut,
            LocalDate dateCession,
            BigDecimal cumulAmortissement,
            BigDecimal valeurNette,
            OffsetDateTime createdAt
    ) {}

    public record LignePlan(
            int exercice,
            BigDecimal dotation,
            BigDecimal cumulAmortissement,
            BigDecimal valeurNette,
            boolean comptabilisee
    ) {}

    public record PlanAmortissement(
            UUID immobilisationId,
            String code,
            String designation,
            BigDecimal valeurBrute,
            int dureeAmortissement,
            List<LignePlan> lignes
    ) {}

    public record DotationResult(
            UUID immobilisationId,
            int exercice,
            BigDecimal dotation,
            UUID ecritureId
    ) {}

    public record Stats(
            long totalActifs,
            BigDecimal valeurBrute,
            BigDecimal cumulAmortissements,
            BigDecimal valeurNette
    ) {}
}
