package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "lignes_devis")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LigneDevis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devis_id", nullable = false)
    private Devis devis;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, precision = 10, scale = 3)
    @Builder.Default
    private BigDecimal quantite = BigDecimal.ONE;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal prixUnitaire = BigDecimal.ZERO;

    @Column(name = "taux_tva", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tauxTva = BigDecimal.valueOf(18);

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal montantHt = BigDecimal.ZERO;

    @Column(name = "montant_tva", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal montantTva = BigDecimal.ZERO;

    @Column(name = "montant_ttc", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal montantTtc = BigDecimal.ZERO;

    @Column(name = "compte_produit", length = 20)
    @Builder.Default
    private String compteProduit = "706";

    @Column
    @Builder.Default
    private int ordre = 0;
}
