package com.edefence.ecompta.dto.conge;

import com.edefence.ecompta.domain.Conge;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class CongeDto {

    public record SaveRequest(
            @NotNull Conge.Type type,
            @NotNull LocalDate dateDebut,
            @NotNull LocalDate dateFin,
            String motif
    ) {}

    public record RejeterRequest(String commentaire) {}

    public record Response(
            UUID id,
            Conge.Type type,
            String typeIntitule,
            LocalDate dateDebut,
            LocalDate dateFin,
            int nombreJours,
            String motif,
            Conge.Statut statut,
            String commentaireRejet,
            UUID collaborateurId,
            String collaborateurNom,
            OffsetDateTime createdAt
    ) {}

    public record CalendrierItem(
            UUID id,
            String collaborateurNom,
            Conge.Type type,
            String typeIntitule,
            LocalDate dateDebut,
            LocalDate dateFin,
            int nombreJours
    ) {}
}
