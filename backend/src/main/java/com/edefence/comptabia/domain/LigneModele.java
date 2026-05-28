package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "lignes_modele")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LigneModele {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modele_id", nullable = false)
    private ModeleEcriture modele;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_id", nullable = false)
    private CompteComptable compte;

    @Column(length = 500)
    private String libelle;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal debit = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal credit = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private int ordre = 0;
}
