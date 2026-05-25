package com.edefence.ecompta.dto.document;

import java.time.OffsetDateTime;
import java.util.UUID;

public class DocumentDto {

    public record Item(
            UUID           id,
            String         typeEntite,
            UUID           entiteId,
            String         nomFichier,
            String         contentType,
            long           taille,
            String         uploadedBy,
            OffsetDateTime createdAt
    ) {}
}
