package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "inscriptions_formation")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InscriptionFormation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private SessionFormation session;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Utilisateur collaborateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.INSCRIT;

    @Column(precision = 4, scale = 1)
    private BigDecimal note;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Statut { INSCRIT, PRESENT, ABSENT, CERTIFIE }
}
