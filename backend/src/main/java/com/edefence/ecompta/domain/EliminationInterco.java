package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "eliminations_interco")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EliminationInterco {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "groupe_id", nullable = false)
    private GroupeSociete groupe;

    @Column(name = "compte_debit", nullable = false, length = 20)
    private String compteDebit;

    @Column(name = "compte_credit", nullable = false, length = 20)
    private String compteCredit;

    @Column(length = 200)
    private String libelle;

    @Column(nullable = false)
    private int exercice;

    @Column(precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal montant = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
