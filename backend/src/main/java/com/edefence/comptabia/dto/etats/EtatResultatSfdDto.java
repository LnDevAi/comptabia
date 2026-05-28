package com.edefence.comptabia.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public record EtatResultatSfdDto(
        int exercice,

        // ── Produit Net Bancaire (PNB) ─────────────────────────────────
        BigDecimal interetsCreditClientele,      // 71x
        BigDecimal produitsInterbanc,            // 70x
        BigDecimal produitsDiversBancaires,      // 73x + 74x
        BigDecimal interetsSurDepots,            // 61x (charge)
        BigDecimal chargesInterbanc,             // 60x (charge)
        BigDecimal produitNetBancaire,           // PNB = produits - charges intérêts

        // ── Charges d'exploitation ────────────────────────────────────
        BigDecimal chargesGeneralesExploitation, // 64x
        BigDecimal dotationsAmortProv,           // 65x
        BigDecimal pertesCreancesIrrecouvr,      // 66x
        BigDecimal autresChargesDiverses,        // 63x
        BigDecimal reprisesProvisions,           // 75x + 78x

        // ── Résultat d'exploitation ───────────────────────────────────
        BigDecimal resultatExploitation,

        // ── Éléments exceptionnels + IS ───────────────────────────────
        BigDecimal produitsExceptionnels,        // 76x
        BigDecimal subventionsExploitation,      // 77x
        BigDecimal chargesExceptionnelles,       // 67x
        BigDecimal impotsSurResultats,           // 68x

        // ── Résultat net ──────────────────────────────────────────────
        BigDecimal resultatNet,

        // ── Ratios synthèse ───────────────────────────────────────────
        BigDecimal ratioChargesPnb,             // Charges exploitation / PNB (≤ 70%)
        BigDecimal ratioProvisionsPnb           // Dotations provisions / PNB
) {}
