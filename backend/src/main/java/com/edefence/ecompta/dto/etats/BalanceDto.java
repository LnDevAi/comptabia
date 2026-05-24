package com.edefence.ecompta.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public record BalanceDto(
        int exercice,
        List<Ligne> lignes,
        BigDecimal totalDebit,
        BigDecimal totalCredit
) {
    public record Ligne(
            String numero,
            String intitule,
            int classe,
            BigDecimal totalDebit,
            BigDecimal totalCredit,
            BigDecimal soldeDebiteur,
            BigDecimal soldeCrediteur
    ) {}
}
