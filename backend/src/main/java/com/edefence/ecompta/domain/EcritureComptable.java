package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "ecritures_comptables",
       uniqueConstraints = @UniqueConstraint(columnNames = {"numero_piece", "entreprise_id"}))
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "entrepriseId", type = UUID.class))
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EcritureComptable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "numero_piece", nullable = false, length = 50)
    private String numeroPiece;

    @Column(name = "date_ecriture", nullable = false)
    private LocalDate dateEcriture;

    @Column(nullable = false, length = 500)
    private String libelle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Journal journal;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private Utilisateur createdBy;

    @OneToMany(mappedBy = "ecriture", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LigneEcriture> lignes = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Journal { AC, BQ, OD, VT }
    public enum Statut  { BROUILLON, VALIDEE, CLOTUREE }
}
