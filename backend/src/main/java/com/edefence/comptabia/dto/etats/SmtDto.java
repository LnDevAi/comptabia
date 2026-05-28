package com.edefence.comptabia.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public final class SmtDto {

    private SmtDto() {}

    public record EtatSituationPatrimoine(
            int exercice,
            List<PosteEsp> actif,
            List<PosteEsp> passif,
            java.math.BigDecimal totalActif,
            java.math.BigDecimal totalPassif
    ) {
        public record PosteEsp(String categorie, String numero, String intitule, java.math.BigDecimal montant) {}
    }

    public record EtatRecettesDepenses(
            int exercice,
            List<Poste> recettes,
            List<Poste> depenses,
            BigDecimal totalRecettes,
            BigDecimal totalDepenses,
            BigDecimal solde
    ) {
        public record Poste(String numero, String intitule, BigDecimal montant) {}
    }

    public record EtatTresorerie(
            int exercice,
            List<MouvementCompte> comptes,
            BigDecimal totalEntrees,
            BigDecimal totalSorties,
            BigDecimal solde
    ) {
        public record MouvementCompte(
                String numero,
                String intitule,
                BigDecimal entrees,
                BigDecimal sorties,
                BigDecimal solde
        ) {}
    }
}
