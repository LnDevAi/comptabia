package com.edefence.ecompta.dto.dashboard;

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

    public record Alerte(
            String type,
            String message,
            String niveau
    ) {}

    public record Response(
            int              exercice,
            KpiFinancier     financier,
            ExecBudget       budgetComptable,
            ExecBudget       budgetRh,
            List<TopAxe>     topAxes,
            List<MoisTendance> tendance,
            List<Alerte>     alertes
    ) {}
}
