package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "prets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Pret {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "collaborateur_id", nullable = false)
    private Utilisateur collaborateur;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_pret", nullable = false, length = 10)
    @Builder.Default
    private TypePret typePret = TypePret.PRET;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Column(name = "nb_echeances", nullable = false)
    private int nbEcheances;

    @Column(name = "montant_echeance", nullable = false, precision = 15, scale = 2)
    private BigDecimal montantEcheance;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE;

    @Column(columnDefinition = "TEXT")
    private String motif;

    @OneToMany(mappedBy = "pret", cascade = CascadeType.ALL, orphanRemoval = true,
               fetch = FetchType.LAZY)
    @OrderBy("numero ASC")
    @Builder.Default
    private List<EcheancePret> echeances = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypePret { PRET, AVANCE }

    public enum Statut { EN_ATTENTE, APPROUVE, EN_COURS, SOLDE, REFUSE }
}
