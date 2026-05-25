package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "lignes_ecriture")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LigneEcriture {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_id", nullable = false)
    private EcritureComptable ecriture;

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

    @Column(length = 5)
    private String lettre;

    private LocalDate lettreDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "axe_analytique_id")
    private AxeAnalytique axeAnalytique;

    @Column(length = 3)
    private String devise;

    @Column(name = "montant_devise", precision = 15, scale = 2)
    private BigDecimal montantDevise;

    @Column(name = "taux_saisi", precision = 15, scale = 6)
    private BigDecimal tauxSaisi;
}
