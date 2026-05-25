package com.edefence.ecompta.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardStatsDto(
        BigDecimal soldeTresorerie,
        BigDecimal totalChargesYtd,
        BigDecimal totalProduitsYtd,
        BigDecimal resultatNet,
        long       notesFraisEnAttente,
        BigDecimal notesFraisMontantEnAttente,
        long       facturesImpayees,
        BigDecimal facturesMontantImpayees,
        List<MoisEvolution> evolution6Mois
) {
    public record MoisEvolution(String mois, BigDecimal charges, BigDecimal produits) {}
}
