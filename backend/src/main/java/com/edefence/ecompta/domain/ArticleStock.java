package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "articles_stock",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "code"}))
@FilterDef(name = "tenantFilterArticle", parameters = @ParamDef(name = "entrepriseId", type = UUID.class))
@Filter(name = "tenantFilterArticle", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ArticleStock {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 255)
    private String designation;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Categorie categorie;

    @Column(name = "unite_mesure", nullable = false, length = 20)
    @Builder.Default
    private String uniteMesure = "UNITE";

    @Column(name = "prix_unitaire", nullable = false, precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal prixUnitaire = BigDecimal.ZERO;

    @Column(name = "cout_moyen", nullable = false, precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal coutMoyen = BigDecimal.ZERO;

    @Column(name = "stock_min", nullable = false, precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal stockMin = BigDecimal.ZERO;

    @Column(name = "stock_max", precision = 15, scale = 4)
    private BigDecimal stockMax;

    @Column(name = "stock_actuel", nullable = false, precision = 15, scale = 4)
    @Builder.Default
    private BigDecimal stockActuel = BigDecimal.ZERO;

    @Column(name = "compte_stock_numero", length = 20)
    private String compteStockNumero;

    @Column(name = "compte_charge_numero", length = 20)
    private String compteChargeNumero;

    @Enumerated(EnumType.STRING)
    @Column(name = "methode_evaluation", nullable = false, length = 10)
    @Builder.Default
    private MethodeEvaluation methodeEvaluation = MethodeEvaluation.CMUP;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    public enum Categorie {
        MATIERE_PREMIERE, PRODUIT_FINI, MARCHANDISE, CONSOMMABLE, EMBALLAGE, AUTRE
    }

    public enum MethodeEvaluation { CMUP, FIFO }
}
