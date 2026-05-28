package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "relances")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Relance {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tiers_id", nullable = false)
    private Tiers tiers;

    @Column(name = "montant_relance", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal montantRelance = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private int niveau = 1;

    @Column(columnDefinition = "TEXT")
    private String note;

    @Column(name = "date_relance", nullable = false)
    private LocalDate dateRelance;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
