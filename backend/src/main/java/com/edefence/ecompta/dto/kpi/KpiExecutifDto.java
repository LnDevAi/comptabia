package com.edefence.ecompta.dto.kpi;

import java.math.BigDecimal;
import java.util.List;

public class KpiExecutifDto {

    public record KpiCard(
            String     label,
            BigDecimal valeur,
            BigDecimal precedent,
            double     evolutionPct,
            String     tendance,   // UP | DOWN | STABLE
            String     unite
    ) {}

    public record MoisData(
            int        mois,
            String     label,
            BigDecimal ca,
            BigDecimal charges,
            BigDecimal resultat
    ) {}

    public record BudgetSynthese(
            BigDecimal totalBudget,
            BigDecimal totalReel,
            double     tauxConsommation,
            int        nbDepassements
    ) {}

    public record Response(
            int              exercice,
            KpiCard          ca,
            KpiCard          charges,
            KpiCard          resultatNet,
            KpiCard          tresorerie,
            KpiCard          encoursClients,
            BudgetSynthese   budget,
            List<MoisData>   tendanceMensuelle
    ) {}
}
