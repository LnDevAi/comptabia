package com.edefence.comptabia.dto.dashboard;

import java.math.BigDecimal;
import java.util.List;

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

    // ─── Comparatif N vs N-1 ─────────────────────────────────────────────────

    public record ComparatifSection(
            BigDecimal valeurN,
            BigDecimal valeurN1,
            BigDecimal variation,
            double variationPourcent
    ) {}

    public record PaiesMensuel(
            int mois,
            BigDecimal masseBrute,
            BigDecimal netAPayer,
            int nbSalaries
    ) {}

    public record ComparatifRh(
            int anneeN,
            int anneeN1,
            ComparatifSection masseSalariale,
            ComparatifSection netAPayer,
            ComparatifSection congesJours,
            ComparatifSection congesNb,
            ComparatifSection notesFraisMontant,
            ComparatifSection notesFraisNb,
            List<PaiesMensuel> paiesMensuellesN,
            List<PaiesMensuel> paiesMensuellesN1
    ) {}
}
