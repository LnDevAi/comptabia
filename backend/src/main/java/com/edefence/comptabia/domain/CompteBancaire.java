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
import java.util.UUID;

@Entity
@Table(name = "comptes_bancaires")
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CompteBancaire {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 255)
    private String libelle;

    @Column(length = 100)
    private String banque;

    @Column(length = 34)
    private String iban;

    @Column(length = 11)
    private String bic;

    @Column(name = "compte_comptable_numero", length = 20)
    private String compteComptableNumero;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_compte", nullable = false, length = 20)
    @Builder.Default
    private TypeCompte typeCompte = TypeCompte.COURANT;

    @Column(name = "solde_reel", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal soldeReel = BigDecimal.ZERO;

    @Column(name = "solde_date")
    private LocalDate soldeDate;

    @Column(name = "seuil_alerte", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal seuilAlerte = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypeCompte { COURANT, EPARGNE, CAISSE, AUTRE }
}
