package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "documents_rh")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DocumentRh {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "collaborateur_id")
    private Utilisateur collaborateur;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_document", nullable = false, length = 30)
    @Builder.Default
    private TypeDocument typeDocument = TypeDocument.AUTRE;

    @Column(nullable = false, length = 255)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String reference;

    @Column(name = "date_document")
    private LocalDate dateDocument;

    @Column(name = "date_expiration")
    private LocalDate dateExpiration;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.VALIDE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum TypeDocument {
        CONTRAT, AVENANT, ATTESTATION, DIPLOME, CNI, PASSEPORT,
        PERMIS_TRAVAIL, CERTIFICAT_MEDICAL, EVALUATION, AUTRE
    }

    public enum Statut { VALIDE, EXPIRE, ARCHIVE }
}
