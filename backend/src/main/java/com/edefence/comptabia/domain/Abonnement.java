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
@Table(name = "abonnements")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Abonnement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tiers_id")
    private Tiers tiers;

    @Column(nullable = false, length = 255)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Periodicite periodicite;

    @Column(name = "montant_ht", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantHt;

    @Column(name = "taux_tva", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tauxTva = new BigDecimal("18");

    @Column(name = "compte_produit", length = 20)
    private String compteProduit;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @Column(name = "prochaine_echeance", nullable = false)
    private LocalDate prochaineEcheance;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    public enum Periodicite { MENSUEL, TRIMESTRIEL, ANNUEL }

    public LocalDate nextEcheance() {
        return switch (periodicite) {
            case MENSUEL      -> prochaineEcheance.plusMonths(1);
            case TRIMESTRIEL  -> prochaineEcheance.plusMonths(3);
            case ANNUEL       -> prochaineEcheance.plusYears(1);
        };
    }
}
