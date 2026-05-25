package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "conges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Conge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Utilisateur collaborateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(name = "nombre_jours", nullable = false)
    private int nombreJours;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @Column(name = "commentaire_rejet", columnDefinition = "TEXT")
    private String commentaireRejet;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Type {
        ANNUEL, MALADIE, SANS_SOLDE, EXCEPTIONNEL, MATERNITE, PATERNITE;

        public String intitule() {
            return switch (this) {
                case ANNUEL       -> "Congé annuel";
                case MALADIE      -> "Congé maladie";
                case SANS_SOLDE   -> "Congé sans solde";
                case EXCEPTIONNEL -> "Congé exceptionnel";
                case MATERNITE    -> "Congé maternité";
                case PATERNITE    -> "Congé paternité";
            };
        }
    }

    public enum Statut { BROUILLON, SOUMISE, APPROUVEE, REJETEE }
}
