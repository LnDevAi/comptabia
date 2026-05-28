package com.edefence.comptabia.dto.ia;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record InvoiceAnalysisDto(
        String typeDocument,
        String fournisseur,
        String client,
        String numeroDocument,
        LocalDate dateDocument,
        String description,
        BigDecimal montantHt,
        BigDecimal tauxTva,
        BigDecimal montantTva,
        BigDecimal montantTtc,
        String devise,
        ImputationSuggeree imputation,
        String rawTextExtracted
) {
    public record ImputationSuggeree(
            String libelleEcriture,
            String journalSuggere,
            List<LigneSuggeree> lignes
    ) {}

    public record LigneSuggeree(
            UUID compteId,
            String numeroCompte,
            String libelleCompte,
            String libelle,
            String sens,
            BigDecimal montant
    ) {}
}
