package com.edefence.comptabia.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;

public final class DashboardGlobalDto {

    private DashboardGlobalDto() {}

    public record KpiFinancier(
            BigDecimal ca,
            BigDecimal charges,
            BigDecimal resultatNet,
            BigDecimal tresorerie,
            double     margeNette
    ) {}

    public record ExecBudget(
            BigDecimal previsionnel,
            BigDecimal realise,
            BigDecimal ecart,
            double     pct,
            int        nbLignes,
            int        nbDepassees
    ) {}

    public record TopAxe(
            String     code,
            String     intitule,
            String     type,
            BigDecimal depenses,
            BigDecimal montantBudget,
            Double     tauxExecution
    ) {}

    public record MoisTendance(
            int        mois,
            BigDecimal ca,
            BigDecimal charges
    ) {}

    /** Monthly cash balance (classe 5) */
    public record TresorerieMois(
            int        mois,
            BigDecimal solde
    ) {}

    /** Charges breakdown by account root (61x, 62x, … 68x) */
    public record RepartitionCharges(
            String     classeCompte,
            String     libelle,
            BigDecimal montant
    ) {}

    public record Alerte(
            String type,
            String message,
            String niveau
    ) {}

    public record Response(
            int                      exercice,
            KpiFinancier             financier,
            KpiFinancier             financierN1,
            ExecBudget               budgetComptable,
            ExecBudget               budgetRh,
            List<TopAxe>             topAxes,
            List<MoisTendance>       tendance,
            List<MoisTendance>       tendanceN1,
            List<TresorerieMois>     tresorerieEvol,
            List<RepartitionCharges> repartitionCharges,
            List<Alerte>             alertes
    ) {}
}
