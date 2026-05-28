package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "academe_inscriptions")
public class AcademeInscription {

    public enum Statut { EN_COURS, TERMINE, ABANDONNE }

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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Statut statut = Statut.EN_COURS;

    @Column(nullable = false)
    private Integer progression = 0;

    @Column(nullable = false)
    private LocalDate dateDebut = LocalDate.now();

    private LocalDate dateFin;

    public UUID getId() { return id; }
    public Utilisateur getUtilisateur() { return utilisateur; }
    public void setUtilisateur(Utilisateur u) { this.utilisateur = u; }
    public AcademeCours getCours() { return cours; }
    public void setCours(AcademeCours c) { this.cours = c; }
    public Entreprise getEntreprise() { return entreprise; }
    public void setEntreprise(Entreprise e) { this.entreprise = e; }
    public Statut getStatut() { return statut; }
    public void setStatut(Statut s) { this.statut = s; }
    public Integer getProgression() { return progression; }
    public void setProgression(Integer p) { this.progression = p; }
    public LocalDate getDateDebut() { return dateDebut; }
    public LocalDate getDateFin() { return dateFin; }
    public void setDateFin(LocalDate d) { this.dateFin = d; }
}
