package com.edefence.comptabia.repository;

import com.edefence.comptabia.domain.GedAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface GedAuditLogRepository extends JpaRepository<GedAuditLog, UUID> {

    Page<GedAuditLog> findByEntrepriseIdOrderByCreatedAtDesc(UUID entrepriseId, Pageable pageable);
}
