package com.edefence.ecompta.dto.etats;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class NoteAnnexeDto {

    private NoteAnnexeDto() {}

    public record Response(
            UUID id,
            int exercice,
            String titre,
            String contenu,
            int ordre,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record CreateRequest(
            @NotNull int exercice,
            @NotBlank String titre,
            String contenu,
            int ordre
    ) {}

    public record UpdateRequest(
            String titre,
            String contenu,
            Integer ordre
    ) {}
}
