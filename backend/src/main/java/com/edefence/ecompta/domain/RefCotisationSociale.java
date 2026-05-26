package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "ref_cotisations_sociales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefCotisationSociale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "code_pays", length = 2, nullable = false)
    private String codePays;

    @Column(name = "code_organisme", length = 30, nullable = false)
    private String codeOrganisme;

    @Column(name = "libelle_organisme", nullable = false, length = 200)
    private String libelleOrganisme;

    @Column(name = "code_cotisation", length = 40, nullable = false)
    private String codeCotisation;

    @Column(name = "libelle_cotisation", nullable = false, length = 200)
    private String libelleCotisation;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String secteur = "PRIVE";

    @Column(name = "taux_salarie", nullable = false, precision = 6, scale = 4)
    private BigDecimal tauxSalarie;

    @Column(name = "taux_patronal", nullable = false, precision = 6, scale = 4)
    private BigDecimal tauxPatronal;

    @Column(name = "plafond_mensuel", precision = 15, scale = 2)
    private BigDecimal plafondMensuel;

    @Column(length = 20, nullable = false)
    @Builder.Default
    private String frequence = "MENSUEL";

    @Column(name = "delai_jours", nullable = false)
    private int delaiJours;

    @Column(nullable = false)
    private int ordre;
}
