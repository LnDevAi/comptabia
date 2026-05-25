package com.edefence.ecompta.dto.consolidation;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ConsolidationDto {

    public record MembreInfo(UUID entrepriseId, String nom, String pays) {}

    public record GroupeRequest(String nom, String description, List<UUID> membreIds) {}

    public record GroupeResponse(
            UUID           id,
            String         nom,
            String         description,
            List<MembreInfo> membres,
            OffsetDateTime createdAt
    ) {}

    public record PosteConsolide(
            String     categorie,
            String     numero,
            String     intitule,
            BigDecimal montant
    ) {}

    public record BilanConsolide(
            String            groupeNom,
            int               exercice,
            List<PosteConsolide> actif,
            List<PosteConsolide> passif,
            BigDecimal        totalActif,
            BigDecimal        totalPassif,
            int               nbSocietes,
            String            note
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
}
