package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "dossiers_disciplinaires")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DossierDisciplinaire {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Utilisateur collaborateur;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_sanction", nullable = false, length = 30)
    private TypeSanction typeSanction;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String motif;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "date_faits", nullable = false)
    private LocalDate dateFaits;

    @Column(name = "date_convocation")
    private LocalDate dateConvocation;

    @Column(name = "date_entretien")
    private LocalDate dateEntretien;

    @Column(name = "date_notification")
    private LocalDate dateNotification;

    @Column(name = "duree_jours")
    private Integer dureeJours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.EN_COURS;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private Utilisateur createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum TypeSanction {
        AVERTISSEMENT,
        BLAME,
        MISE_A_PIED,
        LICENCIEMENT
    }

    public enum Statut {
        EN_COURS,
        CLOTURE,
        ANNULE
    }
}
