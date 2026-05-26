package com.edefence.ecompta.dto.etats;

import java.math.BigDecimal;

public record CompteResultatCimaDto(
        int exercice,

        // ── Compte technique Non-Vie ──────────────────────────────────
        BigDecimal primesAcquisesNonVie,
        BigDecimal primesCedeesNonVie,
        BigDecimal primesNettesNonVie,
        BigDecimal produitsPlacementsAlloues,
        BigDecimal autresProduitsTechniquesNonVie,
        BigDecimal sinistresEtFraisNonVie,
        BigDecimal variationProvisionsNonVie,
        BigDecimal fraisAcquisitionNonVie,
        BigDecimal fraisAdministrationNonVie,
        BigDecimal autresChargesTechniquesNonVie,
        BigDecimal resultatTechniqueNonVie,

        // ── Compte technique Vie ──────────────────────────────────────
        BigDecimal primesAcquisesVie,
        BigDecimal primesCedeesVie,
        BigDecimal primesNettesVie,
        BigDecimal produitsPlacementsVie,
        BigDecimal prestationsVie,
        BigDecimal variationProvisionsMathematiques,
        BigDecimal participationsBeneficesVie,
        BigDecimal fraisGestionVie,
        BigDecimal resultatTechniqueVie,

        // ── Compte non-technique ──────────────────────────────────────
        BigDecimal produitsPlacementsNet,
        BigDecimal fraisGestionPlacements,
        BigDecimal autresProduitsNonTechniques,
        BigDecimal chargesNonTechniques,
        BigDecimal resultatAvantIS,
        BigDecimal impotsSurResultats,
        BigDecimal resultatNet
) {}
