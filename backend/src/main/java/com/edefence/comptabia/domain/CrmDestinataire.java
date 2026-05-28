package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "crm_destinataires")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CrmDestinataire {

    public enum Statut { EN_ATTENTE, ENVOYE, OUVERT, CLIQUE, ECHEC }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "campagne_id", nullable = false)
    private CrmCampagne campagne;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id")
    private CrmContact contact;

    @Column(length = 255)
    private String nom;

    @Column(length = 255)
    private String email;

    @Column(length = 50)
    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String erreur;

    @Column(name = "sent_at")
    private OffsetDateTime sentAt;

    @Column(name = "opened_at")
    private OffsetDateTime openedAt;

    @CreationTimestamp @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
