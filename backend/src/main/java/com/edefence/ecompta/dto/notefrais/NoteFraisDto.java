package com.edefence.ecompta.dto.notefrais;

import com.edefence.ecompta.domain.NoteFrais;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class NoteFraisDto {

    public record SaveRequest(
            @NotBlank String titre,
            @NotNull NoteFrais.Categorie categorie,
            String description,
            @NotNull @Positive BigDecimal montant,
            @NotNull LocalDate dateDebut,
            @NotNull LocalDate dateFin
    ) {}

    public record RejeterRequest(String commentaire) {}

    public record Response(
            UUID id,
            String titre,
            NoteFrais.Categorie categorie,
            String description,
            BigDecimal montant,
            String compteCharge,
            LocalDate dateDebut,
            LocalDate dateFin,
            NoteFrais.Statut statut,
            String commentaireRejet,
            UUID collaborateurId,
            String collaborateurNom,
            UUID ecritureApprobationId,
            UUID ecritureRemboursementId,
            OffsetDateTime createdAt
    ) {}

    public record Resume(
            UUID id,
            String titre,
            NoteFrais.Categorie categorie,
            BigDecimal montant,
            LocalDate dateDebut,
            LocalDate dateFin,
            NoteFrais.Statut statut,
            String collaborateurNom,
            OffsetDateTime createdAt
    ) {}
}
