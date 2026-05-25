package com.edefence.ecompta.dto.is;

import java.math.BigDecimal;
import java.util.UUID;

public class DeclarationIsDto {

    public record Response(
            UUID id,
            int exercice,
            BigDecimal resultatComptable,
            BigDecimal reintagrations,
            BigDecimal deductions,
            BigDecimal resultatFiscal,
            BigDecimal tauxIs,
            BigDecimal isTheorique,
            BigDecimal minimumForfaitaire,
            BigDecimal isDu,
            String statut,
            UUID ecritureId
    ) {}

    public record SaveRequest(
            BigDecimal reintagrations,
            BigDecimal deductions,
            BigDecimal tauxIs,
            BigDecimal minimumForfaitaire
    ) {}
}
