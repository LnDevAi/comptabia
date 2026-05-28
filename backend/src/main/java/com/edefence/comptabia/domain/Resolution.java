package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "resolutions")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Resolution {

    public enum TypeResolution {
        APPROBATION_COMPTES,
        AFFECTATION_RESULTAT,
        NOMINATION_REVOCATION,
        MODIFICATION_STATUTS,
        AUGMENTATION_CAPITAL,
        REDUCTION_CAPITAL,
        DISSOLUTION,
        AUTRE
    }

    public enum StatutResolution {
        EN_ATTENTE, ADOPTEE, REJETEE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assemblee_id", nullable = false)
    private AssembleeGenerale assemblee;

    @Column(name = "numero_ordre", nullable = false)
    @Builder.Default
    private int numeroOrdre = 1;

    @Column(nullable = false, length = 500)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String texte;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_resolution", nullable = false)
    @Builder.Default
    private TypeResolution typeResolution = TypeResolution.AUTRE;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutResolution statut = StatutResolution.EN_ATTENTE;

    @Column(name = "votes_pour")
    @Builder.Default
    private int votesPour = 0;

    @Column(name = "votes_contre")
    @Builder.Default
    private int votesContre = 0;

    @Column(name = "votes_abstention")
    @Builder.Default
    private int votesAbstention = 0;

    @CreationTimestamp
    private OffsetDateTime createdAt;
}
