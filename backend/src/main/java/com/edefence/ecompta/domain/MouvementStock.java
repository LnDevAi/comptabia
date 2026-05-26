package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "mouvements_stock")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MouvementStock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "article_id", nullable = false)
    private ArticleStock article;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "depot_id")
    private DepotStock depot;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mouvement", nullable = false, length = 20)
    private TypeMouvement typeMouvement;

    @Column(nullable = false, precision = 15, scale = 4)
    private BigDecimal quantite;

    @Column(name = "prix_unitaire", nullable = false, precision = 15, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(name = "cout_moyen_apres", precision = 15, scale = 4)
    private BigDecimal coutMoyenApres;

    @Column(length = 100)
    private String reference;

    @Column(length = 255)
    private String libelle;

    @Column(name = "date_mouvement", nullable = false)
    private LocalDate dateMouvement;

    @Column(name = "ecriture_id")
    private UUID ecritureId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    public enum TypeMouvement {
        ENTREE,           // Achat / réception fournisseur
        SORTIE,           // Consommation / vente / production
        AJUSTEMENT_POS,   // Inventaire positif
        AJUSTEMENT_NEG,   // Inventaire négatif
        TRANSFERT_ENTREE, // Réception depuis autre dépôt
        TRANSFERT_SORTIE  // Envoi vers autre dépôt
    }
}
