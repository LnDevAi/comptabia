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
@Table(name = "provisions_techniques")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProvisionTechnique {

    public enum TypeProvision {
        PPNA, PRC, PSAP, RISQUES_CROISSANTS, PM_VIE, PPB, EGALISATION, CATASTROPHES, AUTRES
    }

    public enum Branche {
        VIE, NON_VIE, MIXTE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_provision", nullable = false, length = 30)
    private TypeProvision typeProvision;

    @Enumerated(EnumType.STRING)
    @Column(name = "branche", nullable = false, length = 20)
    @Builder.Default
    private Branche branche = Branche.NON_VIE;

    @Column(name = "exercice", nullable = false)
    private int exercice;

    @Column(name = "date_calcul", nullable = false)
    private LocalDate dateCalcul;

    @Column(name = "montant", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal montant = BigDecimal.ZERO;

    @Column(name = "notes")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
