package com.edefence.ecompta.dto.ratios;

import java.math.BigDecimal;

public class RatiosDto {

    public record Ratio(
        String code,
        String libelle,
        String formule,
        BigDecimal valeur,
        String interpretation,
        String niveau   // "BON" | "MOYEN" | "FAIBLE" | "INFO"
    ) {}

    public record Groupe(
        String titre,
        java.util.List<Ratio> ratios
    ) {}

    public record Response(
        int exercice,
        java.util.List<Groupe> groupes,
        // Données de base utiles pour la lecture
        BigDecimal totalActif,
        BigDecimal chiffreAffaires,
        BigDecimal resultatNet,
        BigDecimal capitauxPropres,
        BigDecimal dettesFinancieres,
        BigDecimal frng,
        BigDecimal bfr,
        BigDecimal tresorerieNette
    ) {}
}
