package com.edefence.comptabia.dto.facture;

import com.edefence.comptabia.domain.Facture;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class FactureDto {

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

    public record CreateRequest(
            @NotNull LocalDate dateFacture,
            LocalDate dateEcheance,
            UUID tiersId,
            String nomTiers,
            String adresseTiers,
            String ifuClient,
            String notes,
            @NotEmpty List<LigneRequest> lignes
    ) {}

    public record UpdateRequest(
            @NotNull LocalDate dateFacture,
            LocalDate dateEcheance,
            UUID tiersId,
            String nomTiers,
            String adresseTiers,
            String ifuClient,
            String notes,
            @NotEmpty List<LigneRequest> lignes
    ) {}

    public record PayerRequest(
            @NotNull LocalDate dateReglement,
            String compteReglement
    ) {}

    public record NormalisationRequest(
            @NotBlank String nfn,
            @NotBlank String codeControle
    ) {}

    public record Response(
            UUID id,
            String numero,
            LocalDate dateFacture,
            LocalDate dateEcheance,
            UUID tiersId,
            String nomTiers,
            String adresseTiers,
            String ifuClient,
            Facture.Statut statut,
            BigDecimal montantHt,
            BigDecimal montantTva,
            BigDecimal montantTtc,
            String notes,
            List<LigneResponse> lignes,
            boolean enRetard,
            String nfn,
            String codeControle,
            Facture.StatutNormalisation statutNormalisation,
            boolean estNormalisee
    ) {}

    public record Resume(
            UUID id,
            String numero,
            LocalDate dateFacture,
            LocalDate dateEcheance,
            UUID tiersId,
            String nomTiers,
            Facture.Statut statut,
            BigDecimal montantHt,
            BigDecimal montantTva,
            BigDecimal montantTtc,
            boolean enRetard,
            Facture.StatutNormalisation statutNormalisation,
            boolean estNormalisee
    ) {}

    public record MoisCA(
            int mois, String label,
            BigDecimal payees, BigDecimal emises, BigDecimal total
    ) {}

    public record StatFacturation(
            int exercice,
            long totalFactures,
            BigDecimal caTotalTtc,
            BigDecimal caPayee,
            BigDecimal caEmise,
            double tauxRecouvrement,
            long nbPayees,
            long nbEmises,
            long nbBrouillons,
            long nbAnnulees,
            List<MoisCA> mensuel
    ) {}
}
