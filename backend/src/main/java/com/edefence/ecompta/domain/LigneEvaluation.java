package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "lignes_evaluation")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LigneEvaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "evaluation_id", nullable = false)
    private Evaluation evaluation;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "objectif_id", nullable = false)
    private Objectif objectif;

    @Column(nullable = false, precision = 3, scale = 1)
    @Builder.Default
    private BigDecimal note = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String commentaire;
}
