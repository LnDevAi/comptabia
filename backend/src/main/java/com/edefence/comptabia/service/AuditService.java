package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.AuditEvent;
import com.edefence.comptabia.dto.audit.AuditDto;
import com.edefence.comptabia.repository.AuditEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository repo;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID entrepriseId, String userEmail,
                    String action, String entityType, String entityRef, String details) {
        repo.save(AuditEvent.builder()
                .entrepriseId(entrepriseId)
                .userEmail(userEmail)
                .action(action)
                .entityType(entityType)
                .entityRef(entityRef)
                .details(details)
                .build());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCurrent(UUID entrepriseId, String action, String entityType, String entityRef) {
        log(entrepriseId, currentEmail(), action, entityType, entityRef, null);
    }

    @Transactional(readOnly = true)
    public Page<AuditDto.Response> lister(UUID entrepriseId,
                                           String action, String entityType, String userEmail,
                                           LocalDate from, LocalDate to,
                                           Pageable pageable) {
        OffsetDateTime dtFrom = from != null ? from.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime dtTo   = to   != null ? to.atTime(23, 59, 59).atOffset(ZoneOffset.UTC) : null;
        return repo.findWithFilters(entrepriseId, action, entityType, userEmail, dtFrom, dtTo, pageable)
                .map(e -> new AuditDto.Response(
                        e.getId(), e.getUserEmail(), e.getAction(),
                        e.getEntityType(), e.getEntityRef(), e.getDetails(), e.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public AuditDto.Stats stats(UUID entrepriseId) {
        OffsetDateTime now    = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime ago7   = now.minusDays(7);
        OffsetDateTime ago30  = now.minusDays(30);
        OffsetDateTime origin = OffsetDateTime.of(2000, 1, 1, 0, 0, 0, 0, ZoneOffset.UTC);

        long total   = repo.countRecent(entrepriseId, origin);
        long last7   = repo.countRecent(entrepriseId, ago7);
        long last30  = repo.countRecent(entrepriseId, ago30);

        List<AuditDto.ActionStat> topActions = repo.countByAction(entrepriseId, ago30)
                .stream().limit(8)
                .map(r -> new AuditDto.ActionStat((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        List<AuditDto.UserStat> topUsers = repo.countByUser(entrepriseId, ago30)
                .stream().limit(5)
                .map(r -> new AuditDto.UserStat((String) r[0], ((Number) r[1]).longValue()))
                .toList();

        return new AuditDto.Stats(total, last7, last30, topActions, topUsers);
    }

    private String currentEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
    }
}
