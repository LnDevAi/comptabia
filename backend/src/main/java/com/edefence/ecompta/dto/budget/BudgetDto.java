package com.edefence.ecompta.dto.budget;

import com.edefence.ecompta.domain.Budget.Sens;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public final class BudgetDto {

    private BudgetDto() {}

    public record UpsertRequest(
            @NotBlank @Size(max = 20) String compteNumero,
            @NotNull @DecimalMin("0") BigDecimal montant,
            @NotNull                  Sens sens
    ) {}

    public record LigneComparatif(
            String     compteNumero,
            String     intitule,
            String     sens,
            BigDecimal budget,
            BigDecimal realise,
            BigDecimal ecart,
            double     pctConsomme,
            UUID       budgetId
    ) {}

    public record MoisRealise(
            int        mois,
            String     label,
            BigDecimal realise,
            BigDecimal cibleMois
    ) {}

    public record Comparatif(
            int                   exercice,
            BigDecimal            totalBudget,
            BigDecimal            totalRealise,
            BigDecimal            totalEcart,
            double                tauxConsommation,
            int                   nbDepassements,
            List<LigneComparatif> lignes,
            List<MoisRealise>     tendanceMensuelle
    ) {}
}
