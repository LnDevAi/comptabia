package com.edefence.comptabia.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public record BalanceSixColonnesDto(
        int       exercice,
        String    referentiel,
        int       nbLignes,
        List<Ligne> lignes,
        BigDecimal totalSolAntD,
        BigDecimal totalSolAntC,
        BigDecimal totalMvtD,
        BigDecimal totalMvtC,
        BigDecimal totalSolFinD,
        BigDecimal totalSolFinC,
        BilanDto          bilan,
        CompteResultatDto compteResultat
) {
    public record Ligne(
            String     numero,
            String     intitule,
            BigDecimal solAntD,
            BigDecimal solAntC,
            BigDecimal mvtD,
            BigDecimal mvtC,
            BigDecimal solFinD,
            BigDecimal solFinC
    ) {}
}
