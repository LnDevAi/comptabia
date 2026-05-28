package com.edefence.comptabia.dto.devis;

import com.edefence.comptabia.domain.Devis;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class DevisDto {

    public record LigneRequest(
            @NotBlank String description,
            @NotNull @Positive BigDecimal quantite,
            @NotNull BigDecimal prixUnitaire,
            @NotNull BigDecimal tauxTva,
            String compteProduit,
            int ordre
    ) {}

    public record LigneResponse(
            UUID id,
            String description,
            BigDecimal quantite,
            BigDecimal prixUnitaire,
            BigDecimal tauxTva,
            BigDecimal montantHt,
            BigDecimal montantTva,
            BigDecimal montantTtc,
            String compteProduit,
            int ordre
    ) {}

    public record SaveRequest(
            @NotNull LocalDate dateDevis,
            LocalDate dateValidite,
            UUID tiersId,
            String nomTiers,
            String adresseTiers,
            String objet,
            String conditions,
            @NotEmpty List<LigneRequest> lignes
    ) {}

    public record Response(
            UUID id,
            String numero,
            LocalDate dateDevis,
            LocalDate dateValidite,
            UUID tiersId,
            String nomTiers,
            String adresseTiers,
            String objet,
            Devis.Statut statut,
            BigDecimal montantHt,
            BigDecimal montantTva,
            BigDecimal montantTtc,
            String conditions,
            List<LigneResponse> lignes,
            UUID factureId,
            boolean expire
    ) {}

    public record Resume(
            UUID id,
            String numero,
            LocalDate dateDevis,
            LocalDate dateValidite,
            UUID tiersId,
            String nomTiers,
            Devis.Statut statut,
            BigDecimal montantHt,
            BigDecimal montantTva,
            BigDecimal montantTtc,
            UUID factureId,
            boolean expire
    ) {}
}
