package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_contacts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CrmContact {

    public enum Source { MANUEL, IMPORT, FORMULAIRE, LINKEDIN, REFERRAL, AUTRE }
    public enum Statut { ACTIF, INACTIF, DESABONNE }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 255)
    private String nom;

    @Column(length = 255)
    private String email;

    @Column(length = 50)
    private String telephone;

    @Column(length = 255)
    private String societe;

    @Column(length = 100)
    private String poste;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    @Builder.Default
    private Source source = Source.MANUEL;

    @Column(columnDefinition = "TEXT")
    private String tags;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.ACTIF;

    @Builder.Default
    private int score = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tiers_id")
    private Tiers tiers;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp @Column(name = "updated_at")
    private OffsetDateTime updatedAt;
}
