package com.edefence.ecompta.dto.ged;

import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class GedDto {

    private GedDto() {}

    // ─── Requests ─────────────────────────────────────────────────────────────

    public record DocumentRequest(
            @NotBlank @Size(max = 500) String titre,
            String description,
            UUID typeDocumentId,
            String typeEntite,
            UUID entiteId,
            String referenceExterne,
            LocalDate dateDocument,
            List<UUID> tagIds
    ) {}

    public record TypeDocumentRequest(
            @NotBlank @Size(max = 50) String code,
            @NotBlank @Size(max = 255) String libelle,
            String description
    ) {}

    public record TagRequest(
            @NotBlank @Size(max = 100) String libelle,
            @Size(max = 20) String couleur
    ) {}

    public record WorkflowRequest(
            @NotBlank String statut,
            String commentaire
    ) {}

    // ─── Responses ────────────────────────────────────────────────────────────

    public record DocumentSummary(
            UUID id,
            String titre,
            String statut,
            String typeDocumentLibelle,
            String referenceExterne,
            LocalDate dateDocument,
            String typeEntite,
            OffsetDateTime createdAt,
            String createdByNom,
            long nombreVersions,
            long tailleBytes,
            List<String> tags
    ) {}

    public record DocumentDetail(
            UUID id,
            String titre,
            String description,
            String statut,
            String typeDocumentLibelle,
            UUID typeDocumentId,
            String referenceExterne,
            LocalDate dateDocument,
            String typeEntite,
            UUID entiteId,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt,
            String createdByNom,
            List<VersionInfo> versions,
            List<String> tags,
            List<WorkflowEntry> workflow
    ) {}

    public record VersionInfo(
            UUID id,
            int numero,
            String nomFichier,
            String contentType,
            long taille,
            OffsetDateTime createdAt,
            String uploadedByNom
    ) {}

    public record WorkflowEntry(
            String statutAvant,
            String statutApres,
            String commentaire,
            OffsetDateTime faitLe,
            String faitParNom
    ) {}

    public record TypeDocumentResponse(
            UUID id,
            String code,
            String libelle,
            String description,
            boolean actif
    ) {}

    public record TagResponse(
            UUID id,
            String libelle,
            String couleur
    ) {}

    public record Stats(
            long totalDocuments,
            long brouillons,
            long enAttente,
            long approuves,
            long archives,
            long totalVersions,
            long tailleStockageMo
    ) {}

    public record AuditEntry(
            UUID id,
            UUID documentId,
            String action,
            String details,
            String faitParEmail,
            OffsetDateTime createdAt
    ) {}

    public record MoisGed(int mois, String label, long nb) {}

    public record StatsGedMensuel(int exercice, long totalCreations, List<MoisGed> mensuel) {}
}
