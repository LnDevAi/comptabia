package com.edefence.ecompta.dto.audit;

import java.time.OffsetDateTime;
import java.util.UUID;

public class AuditDto {

    public record Response(
            UUID id,
            String userEmail,
            String action,
            String entityType,
            String entityRef,
            String details,
            OffsetDateTime createdAt
    ) {}
}
