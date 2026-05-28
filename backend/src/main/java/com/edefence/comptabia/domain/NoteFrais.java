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
@Table(name = "notes_frais")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NoteFrais {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Utilisateur collaborateur;

    @Column(nullable = false, length = 255)
    private String titre;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Categorie categorie;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(name = "compte_charge", nullable = false, length = 20)
    private String compteCharge;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @Column(name = "commentaire_rejet", columnDefinition = "TEXT")
    private String commentaireRejet;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_approbation_id")
    private EcritureComptable ecritureApprobation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_remboursement_id")
    private EcritureComptable ecritureRemboursement;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Categorie {
        TRANSPORT, HEBERGEMENT, REPAS, COMMUNICATION, AUTRE;

        public String compteCharge() {
            return switch (this) {
                case TRANSPORT     -> "6252";
                case HEBERGEMENT   -> "6251";
                case REPAS         -> "6254";
                case COMMUNICATION -> "626";
                case AUTRE         -> "628";
            };
        }

        public String intitule() {
            return switch (this) {
                case TRANSPORT     -> "Transports";
                case HEBERGEMENT   -> "Voyages et déplacements";
                case REPAS         -> "Réceptions et frais de repas";
                case COMMUNICATION -> "Frais de télécommunication";
                case AUTRE         -> "Frais divers";
            };
        }
    }

    public enum Statut { BROUILLON, SOUMISE, APPROUVEE, REJETEE, REMBOURSEE }
}
