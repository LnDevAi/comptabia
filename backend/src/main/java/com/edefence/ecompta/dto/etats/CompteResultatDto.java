package com.edefence.ecompta.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public record CompteResultatDto(
        int exercice,
        List<Poste> charges,
        List<Poste> produits,
        BigDecimal totalCharges,
        BigDecimal totalProduits,
        BigDecimal resultat
) {
    public record Poste(String numero, String intitule, BigDecimal montant) {}
}
