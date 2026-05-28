package com.edefence.comptabia.dto.affectation;

import java.math.BigDecimal;
import java.util.List;

public class AffectationDto {

    public record InfoResultat(
            int exercice,
            String statut,
            BigDecimal resultatNet,
            boolean dejAffecte
    ) {}

    public record LigneAffectation(
            String compteNumero,
            String libelle,
            BigDecimal montant
    ) {}

    public record AffectationRequest(
            List<LigneAffectation> lignes
    ) {}

    public record AffectationResponse(
            String numeroPiece,
            int exercice,
            BigDecimal resultatNet,
            List<LigneAffectation> lignes
    ) {}
}
