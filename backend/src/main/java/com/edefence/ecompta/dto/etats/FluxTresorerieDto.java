package com.edefence.ecompta.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public class FluxTresorerieDto {

    public record Ligne(String libelle, BigDecimal montant) {}

    public record Section(String titre, String code, List<Ligne> lignes, BigDecimal total) {}

    public record Response(
        int      exercice,
        Section  operationnel,
        Section  investissement,
        Section  financement,
        BigDecimal variationNette,
        BigDecimal tresorerieOuverture,
        BigDecimal tresorerieCloture
    ) {}
}
