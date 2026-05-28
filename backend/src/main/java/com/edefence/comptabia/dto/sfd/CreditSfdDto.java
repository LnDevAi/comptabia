package com.edefence.comptabia.dto.sfd;

import com.edefence.comptabia.domain.CreditSfd;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class CreditSfdDto {

    private CreditSfdDto() {}

    public record CreateRequest(
            String numeroCredit,
            String nomClient,
            BigDecimal montantAccorde,
            BigDecimal montantEncours,
            LocalDate dateDeblocage,
            LocalDate dateEcheance,
            int joursRetard,
            CreditSfd.TypeCredit typeCredit,
            String notes
    ) {}

    public record UpdateRequest(
            BigDecimal montantEncours,
            int joursRetard,
            CreditSfd.Statut statut,
            LocalDate dateEcheance,
            String notes
    ) {}

    public record Response(
            UUID id,
            String numeroCredit,
            String nomClient,
            BigDecimal montantAccorde,
            BigDecimal montantEncours,
            LocalDate dateDeblocage,
            LocalDate dateEcheance,
            int joursRetard,
            CreditSfd.Statut statut,
            String statutLabel,
            CreditSfd.TypeCredit typeCredit,
            String typeCreditLabel,
            String notes,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record DashboardResponse(
            // Portefeuille
            int nombreCreditsActifs,
            BigDecimal encoursTotalActif,
            BigDecimal encoursPAR30,          // encours avec joursRetard > 30
            BigDecimal encoursPAR90,          // encours avec joursRetard > 90
            BigDecimal encoursEnSouffrance,
            BigDecimal encoursDouteux,
            // Indicateurs PAR
            BigDecimal ratioPAR30,            // PAR30 / total encours (≤ 5%)
            BigDecimal ratioPAR90,            // PAR90 / total encours
            // Ratios financiers (depuis balance écritures)
            BigDecimal totalActif,
            BigDecimal totalFondsPropres,
            BigDecimal totalDepots,
            BigDecimal produitNetBancaire,
            BigDecimal resultatNet,
            BigDecimal ratioCAR,              // fonds propres / total actif (≥ 10%)
            BigDecimal ratioROA,              // résultat net / total actif
            BigDecimal ratioROE,              // résultat net / fonds propres
            BigDecimal ratioCreditDeposit,    // total crédits / total dépôts
            BigDecimal ratioExploitation,     // charges exploitation / PNB (≤ 70%)
            List<RepartitionType> repartitionParType
    ) {}

    public record RepartitionType(
            CreditSfd.TypeCredit typeCredit,
            String label,
            int nombreCredits,
            BigDecimal encours,
            BigDecimal pourcentage
    ) {}
}
