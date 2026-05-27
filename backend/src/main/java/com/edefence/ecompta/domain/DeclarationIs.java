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
@Table(name = "declarations_is",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "exercice"}))
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeclarationIs {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false)
    private int exercice;

    @Column(name = "resultat_comptable", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal resultatComptable = BigDecimal.ZERO;

    @Column(name = "reintagrations", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal reintagrations = BigDecimal.ZERO;

    @Column(name = "deductions", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal deductions = BigDecimal.ZERO;

    @Column(name = "resultat_fiscal", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal resultatFiscal = BigDecimal.ZERO;

    @Column(name = "taux_is", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tauxIs = new BigDecimal("25.00");

    @Column(name = "is_theorique", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal isTheorique = BigDecimal.ZERO;

    @Column(name = "minimum_forfaitaire", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal minimumForfaitaire = BigDecimal.ZERO;

    @Column(name = "is_du", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal isDu = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @Column(name = "ecriture_id")
    private UUID ecritureId;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Statut { BROUILLON, VALIDEE }
}
