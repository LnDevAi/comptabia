package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_activites")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CrmActivite {

    public enum Type { APPEL, EMAIL_ENVOYE, REUNION, NOTE, TACHE }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lead_id")
    private CrmLead lead;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private CrmContact contact;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Type type;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Column(name = "date_activite")
    @Builder.Default
    private OffsetDateTime dateActivite = OffsetDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auteur_id")
    private Utilisateur auteur;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
