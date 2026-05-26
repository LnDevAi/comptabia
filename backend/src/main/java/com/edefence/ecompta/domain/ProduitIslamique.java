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
@Table(name = "produits_islamiques")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ProduitIslamique {

    public enum TypeProduit {
        MOURABAHA,        // Vente avec marge bénéficiaire
        IJARA,            // Crédit-bail islamique
        IJARA_IMB,        // Ijara Muntahia Bittamlik (avec option d'achat)
        MOUDARABA,        // Partenariat capital / travail
        MOUCHARAKA,       // Participation aux bénéfices et pertes
        SALAM,            // Vente à terme (agriculture)
        ISTISNAA,         // Fabrication sur commande
        QARD_HASSAN,      // Prêt bienveillant sans marge
        SUKUK             // Obligations islamiques
    }

    public enum Statut {
        ACTIF, EN_RETARD, DOUTEUX, CLOTURE, PASSE_EN_PERTES
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    private String reference;

    @Column(name = "nom_client", nullable = false)
    private String nomClient;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_produit", nullable = false)
    @Builder.Default
    private TypeProduit typeProduit = TypeProduit.MOURABAHA;

    @Column(name = "montant_financement", nullable = false, precision = 19, scale = 4)
    private BigDecimal montantFinancement;

    @Column(name = "montant_encours", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal montantEncours = BigDecimal.ZERO;

    @Column(name = "marge_beneficiaire", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal margeBeneficiaire = BigDecimal.ZERO;

    @Column(name = "taux_marge", nullable = false, precision = 7, scale = 4)
    @Builder.Default
    private BigDecimal tauxMarge = BigDecimal.ZERO;

    @Column(name = "date_contrat", nullable = false)
    private LocalDate dateContrat;

    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @Column(name = "jours_retard", nullable = false)
    @Builder.Default
    private int joursRetard = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private Statut statut = Statut.ACTIF;

    @Column(name = "objet_financement", columnDefinition = "TEXT")
    private String objetFinancement;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
