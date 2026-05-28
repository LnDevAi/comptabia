package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "approbations")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Approbation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_id", nullable = false)
    private EcritureComptable ecriture;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approbateur_id", nullable = false)
    private Utilisateur approbateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Decision decision;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Decision { APPROUVEE, REJETEE }
}
