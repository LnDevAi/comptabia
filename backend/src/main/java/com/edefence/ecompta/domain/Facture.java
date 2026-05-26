package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "factures")
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "entrepriseId", type = UUID.class))
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Facture {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 50)
    private String numero;

    @Column(name = "date_facture", nullable = false)
    private LocalDate dateFacture;

    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tiers_id")
    private Tiers tiers;

    @Column(name = "nom_tiers", length = 255)
    private String nomTiers;

    @Column(name = "adresse_tiers", columnDefinition = "TEXT")
    private String adresseTiers;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.BROUILLON;

    @Column(name = "montant_ht", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal montantHt = BigDecimal.ZERO;

    @Column(name = "montant_tva", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal montantTva = BigDecimal.ZERO;

    @Column(name = "montant_ttc", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal montantTtc = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_vente_id")
    private EcritureComptable ecritureVente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ecriture_reglement_id")
    private EcritureComptable ecritureReglement;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 50)
    private String nfn;

    @Column(name = "code_controle", length = 100)
    private String codeControle;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut_normalisation", length = 30, nullable = false)
    @Builder.Default
    private StatutNormalisation statutNormalisation = StatutNormalisation.NON_NORMALISEE;

    @Column(name = "est_normalisee", nullable = false)
    @Builder.Default
    private boolean estNormalisee = false;

    @Column(name = "ifu_client", length = 20)
    private String ifuClient;

    @OneToMany(mappedBy = "facture", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("ordre ASC")
    @Builder.Default
    private List<LigneFacture> lignes = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public enum Statut { BROUILLON, EMISE, PAYEE, ANNULEE }
    public enum StatutNormalisation { NON_NORMALISEE, EN_ATTENTE, NORMALISEE }
}
