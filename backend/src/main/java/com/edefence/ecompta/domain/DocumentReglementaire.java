package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents_reglementaires")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentReglementaire {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private Categorie categorie;

    @Column(nullable = false, length = 255)
    private String nom;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_depot")
    private LocalDate dateDepot;

    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @Column(name = "chemin_fichier", length = 500)
    private String cheminFichier;

    @Column(name = "nom_fichier_original", length = 255)
    private String nomFichierOriginal;

    @Column(name = "taille_fichier")
    private Long tailleFichier;

    @Column(name = "type_mime", length = 100)
    private String typeMime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public boolean hasFichier() {
        return cheminFichier != null && !cheminFichier.isBlank();
    }

    public enum Statut { EN_ATTENTE, DEPOSE, VALIDE, EXPIRE }

    public enum Categorie {
        DECLARATION_EXISTENCE,
        RECEPISSE,
        PUBLICATION_JO,
        STATUTS,
        REGLEMENT_INTERIEUR,
        PV_AG_ORDINAIRE,
        PV_AG_EXTRAORDINAIRE,
        RAPPORT_ACTIVITES,
        RAPPORT_FINANCIER,
        BUDGET_PREVISIONNEL,
        REGISTRE_MEMBRES,
        REGISTRE_COMPTABLE,
        REGISTRE_ACTIFS,
        MODIFICATION_STATUTS,
        CHANGEMENT_DIRIGEANTS,
        RENOUVELLEMENT_RECEPISSE,
        CONVENTION_ETAT,
        AUTRE
    }
}
