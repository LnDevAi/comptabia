package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "declarations_tva",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "periode_debut", "periode_fin"}))
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeclarationTva {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "periode_debut", nullable = false)
    private LocalDate periodeDebut;

    @Column(name = "periode_fin", nullable = false)
    private LocalDate periodeFin;

    @Column(name = "tva_collectee", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal tvaCollectee = BigDecimal.ZERO;

    @Column(name = "tva_deductible", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal tvaDeductible = BigDecimal.ZERO;

    @Column(name = "tva_a_decaisser", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal tvaADecaisser = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @Column(name = "ecriture_id")
    private UUID ecritureId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    public enum Statut { BROUILLON, VALIDEE }
}
