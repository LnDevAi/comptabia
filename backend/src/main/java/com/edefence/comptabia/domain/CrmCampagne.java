package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_campagnes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CrmCampagne {

    public enum Type   { EMAIL, SMS }
    public enum Statut { BROUILLON, EN_COURS, TERMINE, ANNULE }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private CrmTemplate template;

    @Column(nullable = false, length = 255)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Type type;

    @Column(length = 255)
    private String sujet;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenu;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @Column(name = "date_envoi_planifie")
    private OffsetDateTime dateEnvoiPlanifie;

    @Column(name = "date_envoi_reel")
    private OffsetDateTime dateEnvoiReel;

    @Builder.Default private int nbDestinataires = 0;
    @Builder.Default private int nbEnvoyes       = 0;
    @Builder.Default private int nbOuverts       = 0;
    @Builder.Default private int nbCliques       = 0;
    @Builder.Default private int nbEchecs        = 0;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
