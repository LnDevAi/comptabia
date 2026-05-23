package com.edefence.ecompta.dto.ecriture;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class LigneDto {

    public record Request(
            @NotNull UUID compteId,
            String libelle,
            @NotNull @DecimalMin("0.00") BigDecimal debit,
            @NotNull @DecimalMin("0.00") BigDecimal credit
    ) {}

    public record Response(
            UUID id,
            UUID compteId,
            String compteNumero,
            String compteIntitule,
            String libelle,
            BigDecimal debit,
            BigDecimal credit
    ) {}
}
