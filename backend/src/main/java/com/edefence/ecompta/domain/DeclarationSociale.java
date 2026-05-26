package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "declarations_sociales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeclarationSociale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "code_organisme", length = 30, nullable = false)
    private String codeOrganisme;

    @Column(name = "libelle_organisme", nullable = false, length = 200)
    private String libelleOrganisme;

    @Column(nullable = false, length = 7)
    private String periode;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Column(name = "nb_employes", nullable = false)
    @Builder.Default
    private int nbEmployes = 0;

    @Column(name = "masse_salariale", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal masseSalariale = BigDecimal.ZERO;

    @Column(name = "montant_salarie", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal montantSalarie = BigDecimal.ZERO;

    @Column(name = "montant_patronal", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal montantPatronal = BigDecimal.ZERO;

    @Column(name = "montant_total", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal montantTotal = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.A_FAIRE;

    @Column(name = "reference_paiement", length = 100)
    private String referencePaiement;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Statut { A_FAIRE, DECLAREE, PAYEE }
}
