package com.edefence.comptabia.dto.notefrais;

import com.edefence.comptabia.domain.NoteFrais;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
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

    public record ParCategorie(String categorie, long nb, BigDecimal montant) {}

    public record MoisFrais(int mois, String label, long nb, BigDecimal montant) {}

    public record Stats(
            int exercice,
            long totalNotes,
            long brouillons, long soumises, long approuvees, long rejetees, long remboursees,
            BigDecimal montantSoumis, BigDecimal montantApprouve, BigDecimal montantRembourse,
            List<ParCategorie> parCategorie,
            List<MoisFrais> mensuel
    ) {}
}
