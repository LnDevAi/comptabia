package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "import_historique")
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ImportHistorique {

    public enum Format { FEC, EXCEL_CSV, SAGE, EBP, WAVESOFT, SOLDES }
    public enum TypeDonnees { ECRITURES, TIERS, PLAN_COMPTABLE, IMMOBILISATIONS, SOLDES }
    public enum Statut { TERMINE, ERREUR, ANNULE }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id", nullable = false)
    private Utilisateur utilisateur;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Format format;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_donnees", nullable = false)
    private TypeDonnees typeDonnees;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Statut statut;

    @Column(name = "nb_importes", nullable = false)
    private int nbImportes;

    @Column(name = "nb_ignores", nullable = false)
    private int nbIgnores;

    @Column(name = "nb_erreurs", nullable = false)
    private int nbErreurs;

    @Column(name = "nom_fichier")
    private String nomFichier;

    @Column(name = "rapport_json", columnDefinition = "TEXT")
    private String rapportJson;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = Instant.now();
    }
}
