package com.edefence.ecompta.dto.social;

import com.edefence.ecompta.domain.DeclarationSociale;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class SocialDto {

    public record CotisationRefResponse(
            UUID id,
            String codePays,
            String codeOrganisme,
            String libelleOrganisme,
            String codeCotisation,
            String libelleCotisation,
            String secteur,
            BigDecimal tauxSalarie,
            BigDecimal tauxPatronal,
            BigDecimal plafondMensuel,
            String frequence,
            int delaiJours
    ) {}

    public record OrganismeResume(
            String codeOrganisme,
            String libelleOrganisme,
            BigDecimal tauxSalarieTotal,
            BigDecimal tauxPatronalTotal,
            BigDecimal plafondMensuel
    ) {}

    public record DeclarationResponse(
            UUID id,
            String codeOrganisme,
            String libelleOrganisme,
            String periode,
            LocalDate dateEcheance,
            int nbEmployes,
            BigDecimal masseSalariale,
            BigDecimal montantSalarie,
            BigDecimal montantPatronal,
            BigDecimal montantTotal,
            DeclarationSociale.Statut statut,
            String referencePaiement,
            String notes,
            OffsetDateTime createdAt
    ) {}

    public record DeclarationSaveRequest(
            @NotBlank String codeOrganisme,
            @NotBlank String libelleOrganisme,
            @NotBlank String periode,
            @NotNull LocalDate dateEcheance,
            int nbEmployes,
            @NotNull BigDecimal masseSalariale,
            @NotNull BigDecimal montantSalarie,
            @NotNull BigDecimal montantPatronal,
            String notes
    ) {}

    public record DeclarationUpdateRequest(
            DeclarationSociale.Statut statut,
            String referencePaiement,
            String notes
    ) {}

    public record CalculRequest(
            @NotBlank String codeOrganisme,
            int nbEmployes,
            @NotNull BigDecimal masseSalariale
    ) {}

    public record CalculResult(
            String codeOrganisme,
            String libelleOrganisme,
            BigDecimal masseSalarialeBase,
            BigDecimal masseSalarialeOuvrantDroit,
            BigDecimal montantSalarie,
            BigDecimal montantPatronal,
            BigDecimal montantTotal,
            boolean plafonneApplique
    ) {}
}
