package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "amortissements",
       uniqueConstraints = @UniqueConstraint(columnNames = {"immobilisation_id", "exercice"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Amortissement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "immobilisation_id", nullable = false)
    private Immobilisation immobilisation;

    @Column(nullable = false)
    private int exercice;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal dotation;

    @Column(name = "cumul_amortissement", nullable = false, precision = 15, scale = 2)
    private BigDecimal cumulAmortissement;

    @Column(name = "valeur_nette", nullable = false, precision = 15, scale = 2)
    private BigDecimal valeurNette;

    @Column(name = "ecriture_id")
    private UUID ecritureId;
}
