package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "absences")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Absence {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Utilisateur collaborateur;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_absence", nullable = false, length = 30)
    @Builder.Default
    private TypeAbsence typeAbsence = TypeAbsence.AUTRE;

    @Column(nullable = false)
    @Builder.Default
    private boolean justificatif = false;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypeAbsence { MALADIE, ACCIDENT_TRAVAIL, SANS_SOLDE, AUTRE }
    public enum Statut { EN_ATTENTE, APPROUVEE, REJETEE }
}
