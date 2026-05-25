package com.edefence.ecompta.dto.balance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class BalanceAgeeDto {

    public record Buckets(
        BigDecimal j0,    // 0-30 jours
        BigDecimal j30,   // 31-60 jours
        BigDecimal j60,   // 61-90 jours
        BigDecimal j90,   // >90 jours
        BigDecimal total
    ) {}

    public record LigneTiers(
        String nom,
        String code,
        String compteNumero,
        Buckets buckets
    ) {}

    public record Response(
        String type,
        LocalDate dateArrete,
        List<LigneTiers> lignes,
        Buckets totaux
    ) {}
}
