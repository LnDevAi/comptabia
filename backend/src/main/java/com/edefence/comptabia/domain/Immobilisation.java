package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "immobilisations",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "code"}))
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Immobilisation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 255)
    private String designation;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Categorie categorie;

    @Column(name = "compte_numero", length = 20)
    private String compteNumero;

    @Column(name = "compte_amort_numero", length = 20)
    private String compteAmortNumero;

    @Column(name = "date_acquisition", nullable = false)
    private LocalDate dateAcquisition;

    @Column(name = "valeur_brute", nullable = false, precision = 15, scale = 2)
    private BigDecimal valeurBrute;

    @Column(name = "duree_amortissement", nullable = false)
    private int dureeAmortissement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Methode methode = Methode.LINEAIRE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.ACTIF;

    @Column(name = "date_cession")
    private LocalDate dateCession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @OneToMany(mappedBy = "immobilisation", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Amortissement> amortissements = new ArrayList<>();

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    public enum Categorie   { CORPORELLE, INCORPORELLE, FINANCIERE }
    public enum Methode     { LINEAIRE, DEGRESSIF }
    public enum Statut      { ACTIF, CEDE, RETIRE }
}
