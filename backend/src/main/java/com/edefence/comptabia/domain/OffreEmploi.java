package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "offres_emploi")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OffreEmploi {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 200)
    private String titre;

    @Column(length = 100)
    private String departement;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_contrat", nullable = false, length = 20)
    @Builder.Default
    private TypeContrat typeContrat = TypeContrat.CDI;

    @Column(name = "nb_postes", nullable = false)
    @Builder.Default
    private int nbPostes = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.OUVERTE;

    @Column(name = "date_ouverture")
    private LocalDate dateOuverture;

    @Column(name = "date_cloture")
    private LocalDate dateCloture;

    @OneToMany(mappedBy = "offre", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Candidature> candidatures = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypeContrat { CDI, CDD, STAGE, FREELANCE }
    public enum Statut { OUVERTE, EN_PAUSE, FERMEE }
}
