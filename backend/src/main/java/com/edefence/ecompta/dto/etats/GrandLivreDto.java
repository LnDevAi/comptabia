package com.edefence.ecompta.dto.etats;

import com.edefence.ecompta.domain.EcritureComptable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record GrandLivreDto(
        int exercice,
        String compteNumero,
        String compteIntitule,
        List<Mouvement> mouvements,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal solde
) {
    public record Mouvement(
            LocalDate date,
            String numeroPiece,
            String libelle,
            EcritureComptable.Journal journal,
            BigDecimal debit,
            BigDecimal credit,
            BigDecimal soldeCumule
    ) {}
}
