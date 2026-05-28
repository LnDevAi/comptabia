package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "formations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Formation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(nullable = false, length = 100)
    private String domaine;

    @Column(columnDefinition = "TEXT")
    private String objectif;

    @Column(nullable = false)
    private int annee;

    @Column(name = "budget_prevu", precision = 15, scale = 2)
    private BigDecimal budgetPrevu;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.PLANIFIE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Statut { PLANIFIE, EN_COURS, REALISE, ANNULE }
}
