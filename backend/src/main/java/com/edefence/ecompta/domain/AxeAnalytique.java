package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "axes_analytiques")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AxeAnalytique {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 255)
    private String intitule;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String type = "AUTRE";

    @Column(name = "montant_budget", precision = 15, scale = 2)
    private java.math.BigDecimal montantBudget;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private AxeAnalytique parent;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
