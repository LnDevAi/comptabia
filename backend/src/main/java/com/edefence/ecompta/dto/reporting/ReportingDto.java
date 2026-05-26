package com.edefence.ecompta.dto.reporting;

import java.math.BigDecimal;
import java.util.List;

public class ReportingDto {

    public record SyntheseRh(
            long nbCollaborateurs,
            long congesEnAttente,
            long absencesEnAttente,
            long notesFraisEnAttente,
            BigDecimal montantNotesFraisEnAttente,
            long pretsEnCours,
            BigDecimal encoursPrets,
            long documentsExpirant30j,
            long recrutementOuvert,
            long onboardingEnCours
    ) {}

    public record LigneConge(
            String collaborateur,
            String type,
            String dateDebut,
            String dateFin,
            int nombreJours,
            String statut
    ) {}

    public record LignePresence(
            String collaborateur,
            int nbJoursTravailles,
            int nbRetards,
            int nbAbsences,
            double totalHeures
    ) {}

    public record LigneNoteFrais(
            String collaborateur,
            String categorie,
            String titre,
            BigDecimal montant,
            String dateDebut,
            String statut
    ) {}

    public record LignePret(
            String collaborateur,
            String type,
            BigDecimal montant,
            int nbEcheances,
            int nbPrelevees,
            BigDecimal restantDu,
            String statut
    ) {}

    public record RapportConges(int annee, int nbTotal, int nbApprouves, int totalJours, List<LigneConge> lignes) {}
    public record RapportPresences(int mois, int annee, List<LignePresence> lignes) {}
    public record RapportNotesFrais(int annee, int nbTotal, BigDecimal montantTotal, List<LigneNoteFrais> lignes) {}
    public record RapportPrets(List<LignePret> lignes, BigDecimal totalEncours) {}
}
