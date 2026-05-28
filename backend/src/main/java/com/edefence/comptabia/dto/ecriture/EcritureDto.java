package com.edefence.comptabia.dto.ecriture;

import com.edefence.comptabia.domain.EcritureComptable;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class EcritureDto {

    public record Request(
            @NotBlank String numeroPiece,
            @NotNull LocalDate dateEcriture,
            @NotBlank String libelle,
            @NotNull EcritureComptable.Journal journal,
            @NotEmpty @Valid List<LigneDto.Request> lignes
    ) {}

    public record Response(
            UUID id,
            String numeroPiece,
            LocalDate dateEcriture,
            String libelle,
            EcritureComptable.Journal journal,
            EcritureComptable.Statut statut,
            List<LigneDto.Response> lignes,
            BigDecimal totalDebit,
            BigDecimal totalCredit,
            OffsetDateTime createdAt
    ) {}

    public record Stats(
            long totalEcritures,
            long brouillons,
            long validees
    ) {}
}
