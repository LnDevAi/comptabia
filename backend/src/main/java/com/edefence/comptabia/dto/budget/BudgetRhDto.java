package com.edefence.comptabia.dto.budget;

import com.edefence.comptabia.domain.BudgetRh.Categorie;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class BudgetRhDto {

    private BudgetRhDto() {}

    public record UpsertRequest(
            @NotNull Categorie categorie,
            int mois,
            @NotNull @DecimalMin("0") BigDecimal montant
    ) {}

    public record LigneBudget(
            String     categorie,
            String     libelleCategorie,
            int        mois,
            BigDecimal budget,
            BigDecimal realise,
            BigDecimal ecart,
            double     pctConsomme,
            UUID       id
    ) {}

    public record ComparatifRh(
            int    exercice,
            List<LigneBudget> lignes,
            BigDecimal totalBudget,
            BigDecimal totalRealise,
            BigDecimal totalEcart
    ) {}
}
