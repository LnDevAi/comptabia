package com.edefence.ecompta.domain;

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
@Table(name = "paiements_abonnements")
@Getter @Setter @NoArgsConstructor
public class PaiementAbonnement {

    public enum ModePaiement { VIREMENT, MOBILE_MONEY, CARTE, CHEQUE }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "facture_id", nullable = false)
    private FactureAbonnement facture;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_paiement", nullable = false, length = 30)
    private ModePaiement modePaiement = ModePaiement.VIREMENT;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal montant;

    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    @Column(length = 200)
    private String reference;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
