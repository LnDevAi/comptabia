package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "assemblees_generales")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class AssembleeGenerale {

    public enum TypeAssemblee {
        AG_ORDINAIRE, AG_EXTRAORDINAIRE, CONSEIL_ADMINISTRATION, AUTRE
    }

    public enum StatutAssemblee {
        PLANIFIEE, TENUE, CLOTUREE, ANNULEE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_assemblee", nullable = false)
    @Builder.Default
    private TypeAssemblee typeAssemblee = TypeAssemblee.AG_ORDINAIRE;

    @Column(nullable = false)
    private String titre;

    @Column(name = "date_assemblee", nullable = false)
    private LocalDate dateAssemblee;

    private String lieu;

    @Column(name = "exercice_concerne")
    private Integer exerciceConcerne;

    @Column(name = "quorum_requis", precision = 5, scale = 2)
    private BigDecimal quorumRequis;

    @Column(name = "quorum_atteint", precision = 5, scale = 2)
    private BigDecimal quorumAtteint;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private StatutAssemblee statut = StatutAssemblee.PLANIFIEE;

    @Column(name = "ordre_du_jour", columnDefinition = "TEXT")
    private String ordreDuJour;

    @Column(name = "proces_verbal", columnDefinition = "TEXT")
    private String procesVerbal;

    @OneToMany(mappedBy = "assemblee", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("numeroOrdre ASC")
    @Builder.Default
    private List<Resolution> resolutions = new ArrayList<>();

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
