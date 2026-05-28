package com.edefence.comptabia.dto.pilotage;

import java.math.BigDecimal;
import java.util.List;

public class PilotageDto {

    public record KpiAnnuel(
            int exercice,
            BigDecimal ca,
            BigDecimal charges,
            BigDecimal resultatNet,
            BigDecimal margeNette,
            BigDecimal frng,
            BigDecimal bfr,
            BigDecimal tn
    ) {}

    public record ChargePoste(
            String code,
            String libelle,
            BigDecimal montant,
            double pourcentage
    ) {}

    public record RatioCle(
            String code,
            String libelle,
            double valeur,
            String niveau
    ) {}

    public record Response(
            int exercice,
            List<KpiAnnuel> evolution,
            List<ChargePoste> charges,
            List<RatioCle> ratiosCles,
            BigDecimal ca,
            BigDecimal resultatNet,
            BigDecimal frng,
            BigDecimal bfr,
            BigDecimal tresorerieNette
    ) {}
}
