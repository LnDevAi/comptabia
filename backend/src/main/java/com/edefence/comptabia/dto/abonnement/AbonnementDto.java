package com.edefence.comptabia.dto.abonnement;

import com.edefence.comptabia.domain.Abonnement;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class AbonnementDto {

    public record SaveRequest(
            @NotBlank String nom,
            String description,
            @NotNull Abonnement.Periodicite periodicite,
            @NotNull @Positive BigDecimal montantHt,
            @NotNull BigDecimal tauxTva,
            String compteProduit,
            UUID tiersId,
            @NotNull LocalDate dateDebut,
            LocalDate dateFin,
            @NotNull LocalDate prochaineEcheance
    ) {}

    public record Response(
            UUID id,
            String nom,
            String description,
            Abonnement.Periodicite periodicite,
            BigDecimal montantHt,
            BigDecimal tauxTva,
            BigDecimal montantTtc,
            String compteProduit,
            UUID tiersId,
            String nomTiers,
            LocalDate dateDebut,
            LocalDate dateFin,
            boolean actif,
            LocalDate prochaineEcheance
    ) {}

    public record Resume(
            UUID id,
            String nom,
            Abonnement.Periodicite periodicite,
            BigDecimal montantTtc,
            UUID tiersId,
            String nomTiers,
            boolean actif,
            LocalDate prochaineEcheance
    ) {}
}
