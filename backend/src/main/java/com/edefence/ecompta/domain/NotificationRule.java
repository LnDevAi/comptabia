package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notification_rules",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "type"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationRule {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entreprise_id", nullable = false)
    private UUID entrepriseId;

    @Column(nullable = false, length = 60)
    private String type;

    @Column(nullable = false, length = 150)
    private String libelle;

    @Column(precision = 18, scale = 2)
    private BigDecimal seuil;

    @Column(nullable = false)
    private boolean enabled = true;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
