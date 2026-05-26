package com.edefence.ecompta.dto.dashboard;

import java.math.BigDecimal;

public class DashboardRhDto {

    public record KpiEffectifs(long nbActifs) {}

    public record KpiPaie(
            boolean disponible,
            int mois,
            int exercice,
            int nbSalaries,
            BigDecimal masseSalarialeBrute,
            BigDecimal netAPayer,
            BigDecimal cotisationsPatronales
    ) {}

    public record KpiConges(long enAttente, long enCours) {}

    public record KpiDiscipline(long dossiersEnCours) {}

    public record KpiFormation(long sessionsEnCours, long inscriptionsActives) {}

    public record KpiEvaluations(long enAttente) {}

    public record KpiNotesFrais(long enAttente, BigDecimal montantEnAttente) {}

    public record DashboardRh(
            KpiEffectifs effectifs,
            KpiPaie paie,
            KpiConges conges,
            KpiDiscipline discipline,
            KpiFormation formation,
            KpiEvaluations evaluations,
            KpiNotesFrais notesFrais
    ) {}
}
