package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "evaluations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Evaluation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Utilisateur collaborateur;

    @Column(nullable = false)
    private int annee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private Periode periode = Periode.ANNUEL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @Column(name = "commentaire_global", columnDefinition = "TEXT")
    private String commentaireGlobal;

    @Column(name = "score_global", precision = 4, scale = 2)
    private BigDecimal scoreGlobal;

    @OneToMany(mappedBy = "evaluation", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LigneEvaluation> lignes = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Periode { ANNUEL, S1, S2, T1, T2, T3, T4 }
    public enum Statut  { BROUILLON, SOUMISE, VALIDEE }
}
