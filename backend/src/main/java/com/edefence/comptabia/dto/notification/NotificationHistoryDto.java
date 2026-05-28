package com.edefence.comptabia.dto.notification;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public class NotificationHistoryDto {

    public record Item(
            UUID          id,
            String        type,
            String        message,
            String        severity,
            String        link,
            boolean       lu,
            OffsetDateTime createdAt
    ) {}

    public record RuleDto(
            UUID          id,
            String        type,
            String        libelle,
            BigDecimal    seuil,
            boolean       enabled
    ) {}

    public record RuleUpdateRequest(
            boolean    enabled,
            BigDecimal seuil
    ) {}
}
