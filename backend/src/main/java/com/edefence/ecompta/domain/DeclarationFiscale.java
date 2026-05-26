package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "declarations_fiscales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeclarationFiscale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "code_impot", length = 30, nullable = false)
    private String codeImpot;

    @Column(nullable = false, length = 200)
    private String libelle;

    @Column(nullable = false, length = 10)
    private String periode;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.A_FAIRE;

    @Column(name = "montant_base", precision = 15, scale = 2)
    private BigDecimal montantBase;

    @Column(name = "montant_impot", precision = 15, scale = 2)
    private BigDecimal montantImpot;

    @Column(name = "reference_paiement", length = 100)
    private String referencePaiement;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Statut { A_FAIRE, EN_COURS, DECLAREE, PAYEE }
}
