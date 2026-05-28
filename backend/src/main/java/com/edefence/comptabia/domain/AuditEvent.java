package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "audit_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuditEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entreprise_id", nullable = false)
    private UUID entrepriseId;

    @Column(name = "user_email", nullable = false, length = 255)
    private String userEmail;

    @Column(nullable = false, length = 60)
    private String action;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_ref", length = 100)
    private String entityRef;

    @Column(columnDefinition = "TEXT")
    private String details;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
