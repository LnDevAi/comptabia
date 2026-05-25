package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "entreprises")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Entreprise {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, length = 100)
    private String pays;

    private String nif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private PlanType plan = PlanType.FREE;

    @Enumerated(EnumType.STRING)
    @Column(name = "systeme_comptable", nullable = false, length = 10)
    @Builder.Default
    private SystemeComptable systemeComptable = SystemeComptable.NORMAL;

    @Column(columnDefinition = "TEXT")
    private String adresse;

    @Column(length = 50)
    private String telephone;

    @Column(length = 255)
    private String email;

    @Column(name = "site_web", length = 255)
    private String siteWeb;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(length = 10)
    @Builder.Default
    private String devise = "XOF";

    @Column(name = "taux_tva_defaut", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tauxTvaDefaut = new BigDecimal("18.00");

    @Column(name = "debut_exercice_mois")
    @Builder.Default
    private int debutExerciceMois = 1;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Utilisateur> utilisateurs = new ArrayList<>();

    @OneToMany(mappedBy = "entreprise", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<CompteComptable> comptes = new ArrayList<>();

    public enum PlanType { FREE, PRO, ENTERPRISE }
    public enum SystemeComptable { NORMAL, SMT }
}
