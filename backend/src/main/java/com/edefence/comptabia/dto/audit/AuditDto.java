package com.edefence.comptabia.dto.audit;

import java.time.OffsetDateTime;
import java.util.List;
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

    public record ActionStat(String action, long count) {}
    public record UserStat(String userEmail, long count) {}

    public record Stats(
            long totalEvents,
            long eventsLast7Days,
            long eventsLast30Days,
            List<ActionStat> topActions,
            List<UserStat>   topUsers
    ) {}
}
