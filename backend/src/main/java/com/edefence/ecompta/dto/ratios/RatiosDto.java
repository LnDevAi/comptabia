package com.edefence.ecompta.dto.ratios;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class RatiosDto {

    public record Ratio(
        String     code,
        String     libelle,
        String     formule,
        BigDecimal valeur,
        String     interpretation,
        String     niveau,          // "BON" | "MOYEN" | "FAIBLE" | "INFO"
        BigDecimal valeurN1,        // null si N-1 non disponible
        double     evolutionPct     // variation N vs N-1 en %
    ) {}

    public record Groupe(
        String      titre,
        List<Ratio> ratios
    ) {}

    public record Response(
        int                exercice,
        List<Groupe>       groupes,
        BigDecimal         totalActif,
        BigDecimal         chiffreAffaires,
        BigDecimal         resultatNet,
        BigDecimal         capitauxPropres,
        BigDecimal         dettesFinancieres,
        BigDecimal         frng,
        BigDecimal         bfr,
        BigDecimal         tresorerieNette,
        int                scoreGlobal,         // 0-100 pondéré par groupe
        Map<String,Integer> scoresGroupes,      // titre groupe -> score N
        Map<String,Integer> scoresGroupesN1     // titre groupe -> score N-1
    ) {}
}
