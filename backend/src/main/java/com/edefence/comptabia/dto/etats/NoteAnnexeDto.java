package com.edefence.comptabia.dto.etats;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public final class NoteAnnexeDto {

    private NoteAnnexeDto() {}

    public record Response(
            UUID id,
            int exercice,
            Integer numeroNote,
            String titre,
            String contenu,
            int ordre,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record CreateRequest(
            @NotNull int exercice,
            Integer numeroNote,
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
