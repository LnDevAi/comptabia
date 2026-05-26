package com.edefence.ecompta.dto.analytique;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class AnalytiqueDto {

    public record AxeResponse(
            UUID       id,
            String     code,
            String     intitule,
            boolean    actif,
            String     type,
            BigDecimal montantBudget
    ) {}

    public record AxeRequest(
            String     code,
            String     intitule,
            String     type,
            BigDecimal montantBudget
    ) {}

    public record LigneRapport(
            String     compteNumero,
            String     compteIntitule,
            BigDecimal debit,
            BigDecimal credit,
            BigDecimal solde
    ) {}

    public record RapportAxe(
            UUID       axeId,
            String     axeCode,
            String     axeIntitule,
            String     axeType,
            List<LigneRapport> lignes,
            BigDecimal totalDebit,
            BigDecimal totalCredit,
            BigDecimal solde,
            BigDecimal montantBudget,
            Double     tauxExecution
    ) {}

    public record RapportResponse(
            String periodeDebut,
            String periodeFin,
            List<RapportAxe> axes
    ) {}

    public record VentilerRequest(
            List<UUID> ligneIds,
            UUID       axeId
    ) {}
}
