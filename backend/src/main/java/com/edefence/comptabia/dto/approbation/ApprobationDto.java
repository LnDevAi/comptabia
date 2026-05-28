package com.edefence.comptabia.dto.approbation;

import com.edefence.comptabia.domain.Approbation;
import com.edefence.comptabia.domain.EcritureComptable;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class ApprobationDto {

    public record DecisionRequest(
            @NotNull Approbation.Decision decision,
            String commentaire
    ) {}

    public record ApprobationResponse(
            UUID id,
            Approbation.Decision decision,
            String commentaire,
            UUID approbateurId,
            String approbateurNom,
            OffsetDateTime createdAt
    ) {}

    public record EcritureEnAttenteResume(
            UUID id,
            String numeroPiece,
            LocalDate dateEcriture,
            String libelle,
            EcritureComptable.Journal journal,
            UUID auteurId,
            String auteurNom,
            OffsetDateTime soumisAt
    ) {}
}
