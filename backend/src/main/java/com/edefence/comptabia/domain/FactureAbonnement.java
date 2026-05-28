package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

@Entity
@Table(name = "factures_abonnements")
@Getter @Setter @NoArgsConstructor
public class FactureAbonnement {

    public enum Statut { BROUILLON, EN_ATTENTE, PAYEE, EN_RETARD, ANNULEE }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 50, unique = true)
    private String numero;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "abonnement_id", nullable = false)
    private AbonnementClient abonnement;

    @Column(name = "periode_debut", nullable = false)
    private LocalDate periodeDebut;

    @Column(name = "periode_fin", nullable = false)
    private LocalDate periodeFin;

    @Column(name = "montant_ht", precision = 10, scale = 2, nullable = false)
    private BigDecimal montantHt;

    @Column(name = "taux_tva", precision = 5, scale = 2, nullable = false)
    private BigDecimal tauxTva = BigDecimal.ZERO;

    @Column(name = "montant_ttc", precision = 10, scale = 2, nullable = false)
    private BigDecimal montantTtc;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Statut statut = Statut.EN_ATTENTE;

    @Column(name = "date_echeance", nullable = false)
    private LocalDate dateEcheance;

    @Column(name = "date_paiement")
    private LocalDate datePaiement;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
