package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "academe_certificats")
public class AcademeCertificat {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "utilisateur_id")
    private Utilisateur utilisateur;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cours_id")
    private AcademeCours cours;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @Column(nullable = false, unique = true)
    private String numeroCertificat;

    @Column(nullable = false)
    private Integer scoreObtenu;

    @Column(nullable = false)
    private String nomBeneficiaire;

    @Column(nullable = false)
    private LocalDate dateObtention = LocalDate.now();

    @CreationTimestamp
    private Instant createdAt;

    public UUID getId() { return id; }
    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur u) { this.utilisateur = u; }
    public AcademeCours getCours() { return cours; }
    public void setCours(AcademeCours c) { this.cours = c; }
    public Entreprise getEntreprise() { return entreprise; }
    public void setEntreprise(Entreprise e) { this.entreprise = e; }
    public String getNumeroCertificat() { return numeroCertificat; }
    public void setNumeroCertificat(String n) { this.numeroCertificat = n; }
    public Integer getScoreObtenu() { return scoreObtenu; }
    public void setScoreObtenu(Integer s) { this.scoreObtenu = s; }
    public String getNomBeneficiaire() { return nomBeneficiaire; }
    public void setNomBeneficiaire(String n) { this.nomBeneficiaire = n; }
    public LocalDate getDateObtention() { return dateObtention; }
    public Instant getCreatedAt() { return createdAt; }
}
