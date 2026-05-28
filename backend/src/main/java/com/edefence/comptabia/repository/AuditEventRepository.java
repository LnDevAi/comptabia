package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.AuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public interface AuditEventRepository extends JpaRepository<AuditEvent, UUID> {

    @Query("""
            SELECT a FROM AuditEvent a
            WHERE a.entrepriseId = :eid
            AND (:action IS NULL OR a.action = :action)
            AND (:entityType IS NULL OR a.entityType = :entityType)
            AND (:userEmail IS NULL OR a.userEmail = :userEmail)
            AND (:from IS NULL OR a.createdAt >= :from)
            AND (:to IS NULL OR a.createdAt <= :to)
            ORDER BY a.createdAt DESC
            """)
    Page<AuditEvent> findWithFilters(
            @Param("eid") UUID entrepriseId,
            @Param("action") String action,
            @Param("entityType") String entityType,
            @Param("userEmail") String userEmail,
            @Param("from") OffsetDateTime from,
            @Param("to") OffsetDateTime to,
            Pageable pageable);

    @Query("SELECT COUNT(a) FROM AuditEvent a WHERE a.entrepriseId = :eid AND a.createdAt >= :from")
    long countRecent(@Param("eid") UUID eid, @Param("from") OffsetDateTime from);

    @Query("""
            SELECT a.action, COUNT(a)
            FROM AuditEvent a
            WHERE a.entrepriseId = :eid
            AND (:from IS NULL OR a.createdAt >= :from)
            GROUP BY a.action
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByAction(@Param("eid") UUID eid, @Param("from") OffsetDateTime from);

    @Query("""
            SELECT a.userEmail, COUNT(a)
            FROM AuditEvent a
            WHERE a.entrepriseId = :eid
            AND (:from IS NULL OR a.createdAt >= :from)
            GROUP BY a.userEmail
            ORDER BY COUNT(a) DESC
            """)
    List<Object[]> countByUser(@Param("eid") UUID eid, @Param("from") OffsetDateTime from);
}
