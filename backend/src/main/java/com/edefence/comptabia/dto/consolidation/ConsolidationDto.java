package com.edefence.comptabia.dto.consolidation;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ConsolidationDto {

    public record MembreInfo(
            UUID       entrepriseId,
            String     nom,
            String     pays,
            BigDecimal tauxDetention,
            String     methodeConsolidation
    ) {}

    public record MembreRequest(
            UUID       entrepriseId,
            BigDecimal tauxDetention,
            String     methodeConsolidation
    ) {}

    public record GroupeRequest(
            String             nom,
            String             description,
            List<MembreRequest> membres
    ) {}

    public record GroupeResponse(
            UUID             id,
            String           nom,
            String           description,
            List<MembreInfo> membres,
            OffsetDateTime   createdAt
    ) {}

    public record PosteConsolide(
            String     categorie,
            String     numero,
            String     intitule,
            BigDecimal montant
    ) {}

    public record BilanConsolide(
            String               groupeNom,
            int                  exercice,
            List<PosteConsolide> actif,
            List<PosteConsolide> passif,
            BigDecimal           totalActif,
            BigDecimal           totalPassif,
            int                  nbSocietes,
            String               note,
            List<EliminationAppliquee> eliminationsAppliquees
    ) {}

    public record PosteResultat(
            String     numero,
            String     intitule,
            BigDecimal montant
    ) {}

    public record CompteResultatConsolide(
            String              groupeNom,
            int                 exercice,
            List<PosteResultat> charges,
            List<PosteResultat> produits,
            BigDecimal          totalCharges,
            BigDecimal          totalProduits,
            BigDecimal          resultat,
            int                 nbSocietes,
            String              note
    ) {}

    // ─── TFT ─────────────────────────────────────────────────────────────────

    public record PosteTFT(String libelle, BigDecimal montant) {}

    public record TFTConsolide(
            String          groupeNom,
            int             exercice,
            List<PosteTFT>  fluxExploitation,
            BigDecimal      totalFluxExploitation,
            List<PosteTFT>  fluxInvestissement,
            BigDecimal      totalFluxInvestissement,
            List<PosteTFT>  fluxFinancement,
            BigDecimal      totalFluxFinancement,
            BigDecimal      variationTresorerie,
            BigDecimal      tresorerieOuverture,
            BigDecimal      tresorerieCloture,
            int             nbSocietes,
            String          note
    ) {}

    // ─── Éliminations interco ─────────────────────────────────────────────────

    public record EliminationRequest(
            String     compteDebit,
            String     compteCredit,
            String     libelle,
            int        exercice,
            BigDecimal montant
    ) {}

    public record EliminationResponse(
            UUID       id,
            String     compteDebit,
            String     compteCredit,
            String     libelle,
            int        exercice,
            BigDecimal montant
    ) {}

    public record EliminationAppliquee(
            String     compteDebit,
            String     compteCredit,
            String     libelle,
            BigDecimal montant
    ) {}
}
