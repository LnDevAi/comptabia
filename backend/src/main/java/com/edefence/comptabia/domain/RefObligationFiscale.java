package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "ref_obligations_fiscales")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RefObligationFiscale {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "code_pays", length = 2, nullable = false)
    private String codePays;

    @Column(name = "code_impot", length = 30, nullable = false)
    private String codeImpot;

    @Column(nullable = false, length = 200)
    private String libelle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 7, scale = 4)
    private BigDecimal taux;

    @Column(name = "base_calcul", length = 150)
    private String baseCalcul;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Frequence frequence;

    @Column(name = "delai_jours", nullable = false)
    private int delaiJours;

    @Column(name = "compte_debit", length = 20)
    private String compteDebit;

    @Column(name = "compte_credit", length = 20)
    private String compteCredit;

    @Column(nullable = false)
    private int ordre;

    public enum Frequence { MENSUEL, TRIMESTRIEL, SEMESTRIEL, ANNUEL }
}
