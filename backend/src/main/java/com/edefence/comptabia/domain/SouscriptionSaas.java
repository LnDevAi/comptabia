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
@Table(name = "souscriptions_saas")
@Getter @Setter @NoArgsConstructor
public class SouscriptionSaas {

    public enum ModePaiement { CINETPAY, STRIPE, VIREMENT }
    public enum Statut { EN_ATTENTE, CONFIRME, ECHEC, EXPIRE }
    public enum Periodicite { MENSUEL, ANNUEL }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "plan_code", nullable = false, length = 50)
    private String planCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Periodicite periodicite = Periodicite.MENSUEL;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(name = "mode_paiement", nullable = false, length = 30)
    private ModePaiement modePaiement;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Statut statut = Statut.EN_ATTENTE;

    @Column(name = "transaction_id", length = 200)
    private String transactionId;

    @Column(name = "payment_url", columnDefinition = "TEXT")
    private String paymentUrl;

    @Column(name = "reference_virement", length = 200)
    private String referenceVirement;

    @Column(name = "stripe_session_id", length = 300)
    private String stripeSessionId;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(name = "customer_email", length = 200)
    private String customerEmail;

    @Column(name = "date_debut")
    private LocalDate dateDebut;

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    @Column(name = "confirmed_at")
    private ZonedDateTime confirmedAt;
}
