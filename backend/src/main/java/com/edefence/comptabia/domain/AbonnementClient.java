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
@Table(name = "abonnements_clients")
@Getter @Setter @NoArgsConstructor
public class AbonnementClient {

    public enum Statut       { ESSAI, ACTIF, SUSPENDU, RESILIE }
    public enum Periodicite  { MENSUEL, ANNUEL }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "nom_entreprise", nullable = false, length = 200)
    private String nomEntreprise;

    @Column(name = "email_contact", length = 200)
    private String emailContact;

    @Column(length = 50)
    private String telephone;

    @Column(length = 100)
    private String pays;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id")
    private PlanTarifaire plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Statut statut = Statut.ESSAI;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Periodicite periodicite = Periodicite.MENSUEL;

    @Column(name = "date_debut", nullable = false)
    private LocalDate dateDebut = LocalDate.now();

    @Column(name = "date_fin")
    private LocalDate dateFin;

    @Column(name = "date_prochain_renouvellement")
    private LocalDate dateProchainRenouvellement;

    @Column(name = "montant_actuel", precision = 10, scale = 2, nullable = false)
    private BigDecimal montantActuel = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;
}
