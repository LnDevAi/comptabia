package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "regularisations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Regularisation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TypeRegularisation type;

    @Column(nullable = false, length = 255)
    private String libelle;

    @Column(name = "compte_contrepartie", nullable = false, length = 20)
    private String compteContrepartie;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(nullable = false)
    private int exercice;

    @Column(name = "date_regularisation", nullable = false)
    private LocalDate dateRegularisation;

    @Column(name = "date_extourne", nullable = false)
    private LocalDate dateExtourne;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_id")
    private EcritureComptable ecriture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_extourne_id")
    private EcritureComptable ecritureExtourne;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypeRegularisation { CCA, PCA, CAP, PAR }
    public enum Statut { EN_ATTENTE, COMPTABILISEE, EXTOURNEE }
}
