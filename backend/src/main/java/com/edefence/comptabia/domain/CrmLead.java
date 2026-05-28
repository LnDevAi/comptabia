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
@Table(name = "crm_leads")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CrmLead {

    public enum Etape {
        NOUVEAU, QUALIFIE, PROPOSITION, NEGOCIATION, GAGNE, PERDU;
        public boolean isTerminal() { return this == GAGNE || this == PERDU; }
    }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private CrmContact contact;

    @Column(nullable = false, length = 255)
    private String titre;

    @Column(precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal valeur = BigDecimal.ZERO;

    @Builder.Default
    private int probabilite = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private Etape etape = Etape.NOUVEAU;

    @Column(name = "date_cloture_prevue")
    private LocalDate dateCloturePrevue;

    @Column(length = 100)
    private String produit;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
