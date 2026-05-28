package com.edefence.comptabia.dto.notesannexes;

import java.math.BigDecimal;
import java.util.List;

public class NotesAnnexesDto {

    public record Document(
            String entrepriseNom,
            String pays,
            String referentiel,
            String devise,
            int exercice,
            String dateGeneration,
            List<Section> sections
    ) {}

    public record Section(
            int numero,
            String titre,
            String type,
            String texteIntro,
            List<TableauLigne> tableau,
            List<String> colonnes,
            String texteConclusif
    ) {}

    public record TableauLigne(List<String> cellules) {}

    // Ligne immobilisation
    public record LigneImmobilisation(
            String code,
            String designation,
            String categorie,
            String dateAcquisition,
            BigDecimal valeurBrute,
            BigDecimal cumulAmortissement,
            BigDecimal valeurNette,
            int dureeAns
    ) {}

    // Résumé TVA annuel
    public record TvaAnnuelle(
            int annee,
            BigDecimal totalCollectee,
            BigDecimal totalDeductible,
            BigDecimal totalDecaissee
    ) {}

    // Résumé IS
    public record IsAnnuel(
            int exercice,
            BigDecimal resultatComptable,
            BigDecimal reintegrations,
            BigDecimal deductions,
            BigDecimal resultatFiscal,
            BigDecimal tauxIs,
            BigDecimal isTheoriquePct,
            BigDecimal isDu,
            String statut
    ) {}

    // Résumé paie annuel
    public record PaieAnnuelle(
            int annee,
            BigDecimal masseSalarialeBrute,
            BigDecimal cotisationsSalariales,
            BigDecimal cotisationsPatronales,
            BigDecimal iutsRetenu,
            BigDecimal coutTotalEmployeur,
            int nbMoisDeclaresAvecPaie
    ) {}
}
