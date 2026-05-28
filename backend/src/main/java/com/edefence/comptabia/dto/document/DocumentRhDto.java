package com.edefence.comptabia.dto.document;

import com.edefence.comptabia.domain.DocumentRh;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public class DocumentRhDto {

    public record SaveRequest(
            UUID collaborateurId,
            @NotNull DocumentRh.TypeDocument typeDocument,
            @NotBlank String titre,
            String description,
            String reference,
            LocalDate dateDocument,
            LocalDate dateExpiration
    ) {}

    public record Response(
            UUID id,
            UUID collaborateurId,
            String collaborateurNom,
            DocumentRh.TypeDocument typeDocument,
            String titre,
            String description,
            String reference,
            LocalDate dateDocument,
            LocalDate dateExpiration,
            DocumentRh.Statut statut,
            long joursAvantExpiration,
            String createdAt
    ) {}
}
