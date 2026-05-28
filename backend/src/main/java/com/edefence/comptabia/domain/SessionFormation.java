package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "sessions_formation")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SessionFormation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "formation_id", nullable = false)
    private Formation formation;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Column(name = "date_fin", nullable = false)
    private LocalDate dateFin;

    @Column(length = 200)
    private String lieu;

    @Column(length = 200)
    private String formateur;

    @Column(name = "nb_places", nullable = false)
    @Builder.Default
    private int nbPlaces = 10;

    @Column(name = "cout_reel", precision = 15, scale = 2)
    private BigDecimal coutReel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.PLANIFIEE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Statut { PLANIFIEE, EN_COURS, TERMINEE, ANNULEE }
}
