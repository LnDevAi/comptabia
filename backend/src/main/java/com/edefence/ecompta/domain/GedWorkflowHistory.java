package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "ged_workflow_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GedWorkflowHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private GedDocument document;

    @Column(name = "statut_avant", length = 20)
    private String statutAvant;

    @Column(name = "statut_apres", nullable = false, length = 20)
    private String statutApres;

    @Column(columnDefinition = "TEXT")
    private String commentaire;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fait_par")
    private Utilisateur faitPar;

    @Column(name = "fait_le", nullable = false)
    private OffsetDateTime faitLe;
}
