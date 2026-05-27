package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "feuilles_paie",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "exercice", "mois"}))
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FeuillePaie {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false)
    private int exercice;

    @Column(nullable = false)
    private int mois;

    @Column(name = "nb_salaries", nullable = false)
    @Builder.Default
    private int nbSalaries = 0;

    @Column(name = "masse_salariale_brute", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal masseSalarialeBrute = BigDecimal.ZERO;

    @Column(name = "cotisations_salariales", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cotisationsSalariales = BigDecimal.ZERO;

    @Column(name = "cotisations_patronales", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal cotisationsPatronales = BigDecimal.ZERO;

    @Column(name = "impot_retenu", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal impotRetenu = BigDecimal.ZERO;

    @Column(name = "net_a_payer", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal netAPayer = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_id")
    private EcritureComptable ecriture;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    public enum Statut { BROUILLON, COMPTABILISEE }
}
