package com.edefence.ecompta.dto.formation;

import com.edefence.ecompta.domain.Formation;
import com.edefence.ecompta.domain.InscriptionFormation;
import com.edefence.ecompta.domain.SessionFormation;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class FormationDto {

    // ── Formations ────────────────────────────────────────────────────────────

    public record FormationResponse(
            UUID id,
            String titre,
            String domaine,
            String objectif,
            int annee,
            BigDecimal budgetPrevu,
            Formation.Statut statut,
            int nbSessions,
            OffsetDateTime createdAt
    ) {}

    public record FormationSaveRequest(
            @NotBlank String titre,
            @NotBlank String domaine,
            String objectif,
            @NotNull Integer annee,
            BigDecimal budgetPrevu
    ) {}

    public record FormationUpdateRequest(
            String titre,
            String domaine,
            String objectif,
            BigDecimal budgetPrevu,
            Formation.Statut statut
    ) {}

    // ── Sessions ──────────────────────────────────────────────────────────────

    public record SessionResponse(
            UUID id,
            UUID formationId,
            String formationTitre,
            LocalDate dateDebut,
            LocalDate dateFin,
            String lieu,
            String formateur,
            int nbPlaces,
            long nbInscrits,
            BigDecimal coutReel,
            SessionFormation.Statut statut,
            OffsetDateTime createdAt
    ) {}

    public record SessionSaveRequest(
            @NotNull UUID formationId,
            @NotNull LocalDate dateDebut,
            @NotNull LocalDate dateFin,
            String lieu,
            String formateur,
            int nbPlaces,
            BigDecimal coutReel
    ) {}

    public record SessionUpdateRequest(
            LocalDate dateDebut,
            LocalDate dateFin,
            String lieu,
            String formateur,
            Integer nbPlaces,
            BigDecimal coutReel,
            SessionFormation.Statut statut
    ) {}

    // ── Inscriptions ──────────────────────────────────────────────────────────

    public record InscriptionResponse(
            UUID id,
            UUID sessionId,
            UUID collaborateurId,
            String collaborateurNom,
            InscriptionFormation.Statut statut,
            BigDecimal note,
            String commentaire,
            OffsetDateTime createdAt
    ) {}

    public record InscriptionSaveRequest(
            @NotNull UUID collaborateurId
    ) {}

    public record InscriptionUpdateRequest(
            InscriptionFormation.Statut statut,
            BigDecimal note,
            String commentaire
    ) {}

    // ── Bilan collaborateur ───────────────────────────────────────────────────

    public record BilanCollaborateur(
            UUID collaborateurId,
            String collaborateurNom,
            int nbFormations,
            int nbCertifications,
            List<String> domainesFormes,
            BigDecimal noteMoyenne
    ) {}
}
