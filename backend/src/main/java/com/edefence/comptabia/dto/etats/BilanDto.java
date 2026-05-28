package com.edefence.comptabia.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public record BilanDto(
        int exercice,
        List<Poste> actif,
        List<Poste> passif,
        BigDecimal totalActif,
        BigDecimal totalPassif
) {
    public record Poste(
            String categorie,
            String numero,
            String intitule,
            BigDecimal montant
    ) {}
}
