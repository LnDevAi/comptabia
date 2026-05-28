package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entreprise_id", nullable = false)
    private UUID entrepriseId;

    @Column(nullable = false, length = 60)
    private String type;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 10)
    private String severity;

    @Column(length = 200)
    private String link;

    @Column(nullable = false)
    private boolean lu = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
