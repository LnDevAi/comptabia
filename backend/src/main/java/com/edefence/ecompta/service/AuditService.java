package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.AuditEvent;
import com.edefence.ecompta.dto.audit.AuditDto;
import com.edefence.ecompta.repository.AuditEventRepository;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditEventRepository repo;

    // Called with explicit user context (from service methods that already have it)
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

    // Called when Spring Security context holds the current user
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCurrent(UUID entrepriseId, String action, String entityType, String entityRef) {
        String email = currentEmail();
        log(entrepriseId, email, action, entityType, entityRef, null);
    }

    @Transactional(readOnly = true)
    public Page<AuditDto.Response> lister(UUID entrepriseId,
                                           String action, String userEmail,
                                           LocalDate from, LocalDate to,
                                           Pageable pageable) {
        OffsetDateTime dtFrom = from != null ? from.atStartOfDay().atOffset(ZoneOffset.UTC) : null;
        OffsetDateTime dtTo   = to   != null ? to.atTime(23, 59, 59).atOffset(ZoneOffset.UTC) : null;
        return repo.findWithFilters(entrepriseId, action, userEmail, dtFrom, dtTo, pageable)
                .map(e -> new AuditDto.Response(
                        e.getId(), e.getUserEmail(), e.getAction(),
                        e.getEntityType(), e.getEntityRef(), e.getDetails(), e.getCreatedAt()));
    }

    private String currentEmail() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated()) ? auth.getName() : "system";
    }
}
