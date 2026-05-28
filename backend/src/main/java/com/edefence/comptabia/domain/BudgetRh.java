package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "budgets_rh",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id","exercice","mois","categorie"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class BudgetRh {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false)
    private int exercice;

    @Column(nullable = false)
    @Builder.Default
    private int mois = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Categorie categorie;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal montant = BigDecimal.ZERO;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Categorie {
        MASSE_BRUTE, COTISATIONS_PATRONALES, COTISATIONS_SALARIALES, IMPOT_RETENU, NET_A_PAYER
    }
}
