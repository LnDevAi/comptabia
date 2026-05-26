package com.edefence.ecompta.dto.islamique;

import com.edefence.ecompta.domain.ProduitIslamique;
import com.edefence.ecompta.domain.ZakatCalcul;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ProduitIslamiqueDto {

    public record CreateRequest(
            String reference,
            String nomClient,
            ProduitIslamique.TypeProduit typeProduit,
            BigDecimal montantFinancement,
            BigDecimal montantEncours,
            BigDecimal margeBeneficiaire,
            BigDecimal tauxMarge,
            LocalDate dateContrat,
            LocalDate dateEcheance,
            int joursRetard,
            String objetFinancement,
            String notes
    ) {}

    public record UpdateRequest(
            BigDecimal montantEncours,
            int joursRetard,
            ProduitIslamique.Statut statut,
            BigDecimal margeBeneficiaire,
            LocalDate dateEcheance,
            String notes
    ) {}

    public record Response(
            UUID id,
            String reference,
            String nomClient,
            ProduitIslamique.TypeProduit typeProduit,
            String typeProduitLabel,
            BigDecimal montantFinancement,
            BigDecimal montantEncours,
            BigDecimal margeBeneficiaire,
            BigDecimal tauxMarge,
            LocalDate dateContrat,
            LocalDate dateEcheance,
            int joursRetard,
            ProduitIslamique.Statut statut,
            String statutLabel,
            String objetFinancement,
            String notes,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record RepartitionType(
            ProduitIslamique.TypeProduit typeProduit,
            String typeProduitLabel,
            int nbContrats,
            BigDecimal encours,
            BigDecimal marges,
            BigDecimal pourcentage
    ) {}

    public record ZakatResponse(
            UUID id,
            int exercice,
            LocalDate dateCalcul,
            BigDecimal baseZakatable,
            BigDecimal tauxZakat,
            BigDecimal montantZakat,
            BigDecimal montantVerse,
            BigDecimal resteAVerser,
            ZakatCalcul.StatutZakat statut,
            String statutLabel,
            String notes,
            OffsetDateTime createdAt
    ) {}

    public record ZakatCreateRequest(
            int exercice,
            LocalDate dateCalcul,
            BigDecimal baseZakatable,
            BigDecimal tauxZakat,
            String notes
    ) {}

    public record ZakatUpdateRequest(
            BigDecimal montantVerse,
            ZakatCalcul.StatutZakat statut,
            String notes
    ) {}

    public record DashboardResponse(
            // Portefeuille islamique
            int nbContrats,
            BigDecimal encoursTotalActif,
            BigDecimal encoursPAR30,
            BigDecimal margeTotale,
            BigDecimal ratioPAR30,
            // Ratios de conformité Charia
            BigDecimal pourcentageParticipatifsVsTotal,   // Moudaraba+Moucharaka / total
            BigDecimal rendementMoyen,                     // Marge totale / encours total
            // Bilans comptables
            BigDecimal totalActif,
            BigDecimal fondsPropres,
            BigDecimal totalDepots,
            BigDecimal produitNetIslamique,
            BigDecimal resultat,
            // Zakat exercice courant
            BigDecimal zakatDue,
            BigDecimal zakatVersee,
            // Répartition
            List<RepartitionType> repartitionParType
    ) {}

    public record EtatResultatIslamiqueResponse(
            int exercice,
            // Produit Net Islamique (PNI)
            BigDecimal margesMourabaha,           // 71x
            BigDecimal loyersIjara,               // 72x
            BigDecimal quotesPartsMoudarabaMoucharaka, // 73x
            BigDecimal profitsSukuk,              // 74x
            BigDecimal produitsInterbanc,         // 70x
            BigDecimal chargesRessources,         // 60x
            BigDecimal chargesDepots,             // 61x
            BigDecimal produitNetIslamique,       // PNI
            // Charges d'exploitation
            BigDecimal chargesGenerales,          // 64x
            BigDecimal dotationsAmortProv,        // 65x
            BigDecimal pertesIrrecouvr,           // 66x
            BigDecimal chargesDiverses,           // 63x
            BigDecimal reprises,                  // 75x + 78x
            BigDecimal resultatExploitation,
            // Zakat et IS
            BigDecimal zakatDue,                  // 67x
            BigDecimal produitsExceptionnels,     // 76x + 77x
            BigDecimal chargesExceptionnelles,    // —
            BigDecimal impots,                    // 68x
            BigDecimal resultatNet,
            // Ratios
            BigDecimal ratioChargesPni,           // Charges / PNI ≤ 70%
            BigDecimal ratioZakatResultat         // Zakat / Résultat brut
    ) {}
}
