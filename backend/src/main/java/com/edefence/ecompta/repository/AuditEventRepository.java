package com.edefence.ecompta.repository;

import com.edefence.ecompta.domain.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.UUID;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

    @Query("""
            SELECT a FROM AuditEvent a
            WHERE a.entrepriseId = :eid
            AND (:action IS NULL OR a.action = :action)
            AND (:userEmail IS NULL OR a.userEmail = :userEmail)
            AND (:from IS NULL OR a.createdAt >= :from)
            AND (:to IS NULL OR a.createdAt <= :to)
            ORDER BY a.createdAt DESC
            """)
    Page<AuditEvent> findWithFilters(
            @Param("eid") UUID entrepriseId,
            @Param("action") String action,
            @Param("userEmail") String userEmail,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            Pageable pageable);
}
