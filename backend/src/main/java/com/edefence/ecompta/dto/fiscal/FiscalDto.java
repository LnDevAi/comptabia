package com.edefence.ecompta.dto.fiscal;

import com.edefence.ecompta.domain.DeclarationFiscale;
import com.edefence.ecompta.domain.RefObligationFiscale;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class FiscalDto {

    public record ObligationRefResponse(
            UUID id,
            String codePays,
            String codeImpot,
            String libelle,
            String description,
            BigDecimal taux,
            String baseCalcul,
            RefObligationFiscale.Frequence frequence,
            int delaiJours,
            int ordre
    ) {}

    public record DeclarationResponse(
            UUID id,
            String codeImpot,
            String libelle,
            String periode,
            LocalDate dateEcheance,
            DeclarationFiscale.Statut statut,
            BigDecimal montantBase,
            BigDecimal montantImpot,
            String referencePaiement,
            String notes,
            OffsetDateTime createdAt
    ) {}

    public record DeclarationSaveRequest(
            @NotBlank String codeImpot,
            @NotBlank String libelle,
            @NotBlank String periode,
            @NotNull LocalDate dateEcheance,
            BigDecimal montantBase,
            BigDecimal montantImpot,
            String notes
    ) {}

    public record DeclarationUpdateRequest(
            DeclarationFiscale.Statut statut,
            BigDecimal montantBase,
            BigDecimal montantImpot,
            String referencePaiement,
            String notes
    ) {}

    public record CalendrierItem(
            String codeImpot,
            String libelle,
            String periode,
            LocalDate dateEcheance,
            DeclarationFiscale.Statut statut,
            BigDecimal montantImpot,
            UUID declarationId
    ) {}
}
