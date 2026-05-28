package com.edefence.comptabia.dto.kpi;

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
            BigDecimal resultat,
            BigDecimal caN1,
            BigDecimal chargesN1
    ) {}

    public record BudgetSynthese(
            BigDecimal totalBudget,
            BigDecimal totalReel,
            double     tauxConsommation,
            int        nbDepassements
    ) {}

    public record CompteCharge(
            String     numero,
            String     libelle,
            BigDecimal montant,
            double     partPct
    ) {}

    public record Ratios(
            double margeNettePct,
            double tauxChargesPct,
            double dso,            // Days Sales Outstanding (jours)
            double tauxVariationCa // variation CA vs N-1
    ) {}

    public record Alerte(
            String niveau,  // DANGER | WARNING | INFO
            String message
    ) {}

    public record Response(
            int              exercice,
            KpiCard          ca,
            KpiCard          charges,
            KpiCard          resultatNet,
            KpiCard          tresorerie,
            KpiCard          encoursClients,
            BudgetSynthese   budget,
            List<MoisData>   tendanceMensuelle,
            List<CompteCharge> topCharges,
            Ratios           ratios,
            List<Alerte>     alertes
    ) {}
}
