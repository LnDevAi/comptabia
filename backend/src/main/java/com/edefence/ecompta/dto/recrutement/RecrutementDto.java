package com.edefence.ecompta.dto.recrutement;

import com.edefence.ecompta.domain.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class RecrutementDto {

    // ── Offres ────────────────────────────────────────────────────────────

    public record OffreRequest(
            @NotBlank String titre,
            String departement,
            String description,
            @NotNull OffreEmploi.TypeContrat typeContrat,
            int nbPostes,
            LocalDate dateOuverture,
            LocalDate dateCloture
    ) {}

    public record OffreResponse(
            UUID id,
            String titre,
            String departement,
            String description,
            OffreEmploi.TypeContrat typeContrat,
            int nbPostes,
            OffreEmploi.Statut statut,
            LocalDate dateOuverture,
            LocalDate dateCloture,
            long nbCandidatures,
            String createdAt
    ) {}

    // ── Candidatures ──────────────────────────────────────────────────────

    public record CandidatureRequest(
            UUID offreId,
            @NotBlank String nomCandidat,
            String emailCandidat,
            String telephone,
            String notes
    ) {}

    public record CandidatureResponse(
            UUID id,
            UUID offreId,
            String offreTitre,
            String nomCandidat,
            String emailCandidat,
            String telephone,
            Candidature.Statut statut,
            String notes,
            String createdAt
    ) {}

    // ── Onboarding ────────────────────────────────────────────────────────

    public record PlanRequest(
            @NotNull UUID collaborateurId,
            String titre,
            LocalDate dateEmbauche
    ) {}

    public record TacheRequest(
            @NotBlank String titre,
            String description,
            @NotNull OnboardingTache.Categorie categorie,
            int ordre,
            LocalDate dateLimite
    ) {}

    public record TacheResponse(
            UUID id,
            String titre,
            String description,
            OnboardingTache.Categorie categorie,
            int ordre,
            boolean terminee,
            LocalDate dateLimite
    ) {}

    public record PlanResponse(
            UUID id,
            UUID collaborateurId,
            String collaborateurNom,
            String titre,
            LocalDate dateEmbauche,
            OnboardingPlan.Statut statut,
            int nbTaches,
            int nbTerminees,
            List<TacheResponse> taches,
            String createdAt
    ) {}
}
