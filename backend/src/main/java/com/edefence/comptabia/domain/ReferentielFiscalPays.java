package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "referentiel_fiscal_pays")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ReferentielFiscalPays {

    @Id
    @Column(length = 2)
    private String code;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 10)
    private String devise;

    @Column(nullable = false, length = 10)
    private String locale;

    @Column(name = "systeme_comptable", nullable = false, length = 30)
    private String systemeComptable;

    @Column(name = "taux_tva", nullable = false, precision = 5, scale = 2)
    private BigDecimal tauxTva;

    @Column(name = "taux_is", nullable = false, precision = 5, scale = 2)
    private BigDecimal tauxIs;

    @Column(name = "nom_tva", length = 100)
    private String nomTva;

    @Column(name = "nom_is", length = 100)
    private String nomIs;

    @Column(name = "minimum_forfaitaire", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal minimumForfaitaire = BigDecimal.ZERO;

    @Column(name = "periode_declaration_tva", nullable = false, length = 20)
    @Builder.Default
    private String periodeDeclarationTva = "MENSUELLE";
}
