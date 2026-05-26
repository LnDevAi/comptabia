package com.edefence.ecompta.dto.document;

import com.edefence.ecompta.domain.DocumentReglementaire;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class DocumentReglementaireDto {

    private DocumentReglementaireDto() {}

    public record CreateRequest(
            DocumentReglementaire.Categorie categorie,
            String nom,
            String description,
            LocalDate dateDepot,
            LocalDate dateEcheance,
            String notes
    ) {}

    public record UpdateRequest(
            String nom,
            String description,
            LocalDate dateDepot,
            LocalDate dateEcheance,
            DocumentReglementaire.Statut statut,
            String notes
    ) {}

    public record Response(
            UUID id,
            DocumentReglementaire.Categorie categorie,
            String categorieLabel,
            String nom,
            String description,
            LocalDate dateDepot,
            LocalDate dateEcheance,
            DocumentReglementaire.Statut statut,
            boolean hasFichier,
            String nomFichierOriginal,
            Long tailleFichier,
            String typeMime,
            String notes,
            int joursRestants,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}
}
