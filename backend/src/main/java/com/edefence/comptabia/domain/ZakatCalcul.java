package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "zakat_calculs", uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id","exercice"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ZakatCalcul {

    public enum StatutZakat { CALCULE, VERSE_PARTIELLEMENT, VERSE_INTEGRALEMENT }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false)
    private int exercice;

    @Column(name = "date_calcul", nullable = false)
    private LocalDate dateCalcul;

    @Column(name = "base_zakatable", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal baseZakatable = BigDecimal.ZERO;

    @Column(name = "taux_zakat", nullable = false, precision = 7, scale = 4)
    @Builder.Default
    private BigDecimal tauxZakat = new BigDecimal("2.5000");

    @Column(name = "montant_zakat", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal montantZakat = BigDecimal.ZERO;

    @Column(name = "montant_verse", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal montantVerse = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutZakat statut = StatutZakat.CALCULE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
