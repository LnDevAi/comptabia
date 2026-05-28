package com.edefence.comptabia.dto.analytique;

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
            BigDecimal montantBudget,
            UUID       parentId
    ) {}

    public record AxeRequest(
            String     code,
            String     intitule,
            String     type,
            BigDecimal montantBudget,
            UUID       parentId
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

    // ─── Rapport bailleur hiérarchique ───────────────────────────────────────

    public record LigneBailleur(
            String     compteNumero,
            String     compteIntitule,
            BigDecimal debit,
            BigDecimal credit,
            BigDecimal solde
    ) {}

    public record SousAxe(
            UUID       axeId,
            String     axeCode,
            String     axeIntitule,
            String     axeType,
            BigDecimal montantBudget,
            List<LigneBailleur> lignes,
            BigDecimal totalDebit,
            BigDecimal totalCredit,
            BigDecimal solde,
            Double     tauxExecution
    ) {}

    public record RapportBailleur(
            UUID       bailleurId,
            String     bailleurCode,
            String     bailleurIntitule,
            BigDecimal montantBudget,
            List<SousAxe> sousAxes,
            BigDecimal totalDebit,
            BigDecimal totalCredit,
            BigDecimal solde,
            Double     tauxExecution
    ) {}

    public record RapportBailleurResponse(
            String periodeDebut,
            String periodeFin,
            List<RapportBailleur> bailleurs
    ) {}

    public record VentilerRequest(
            List<UUID> ligneIds,
            UUID       axeId
    ) {}
}
