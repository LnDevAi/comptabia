package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "pointages",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "collaborateur_id", "date_pointage"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Pointage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Utilisateur collaborateur;

    @Column(name = "date_pointage", nullable = false)
    private LocalDate datePointage;

    @Column(name = "heure_arrivee", nullable = false)
    private LocalTime heureArrivee;

    @Column(name = "heure_depart")
    private LocalTime heureDepart;

    @Column(name = "heures_travaillees", precision = 4, scale = 2)
    private BigDecimal heuresTravaillees;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Type type = Type.NORMAL;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Type { NORMAL, RETARD, DEMI_JOURNEE }
}
