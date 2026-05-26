package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "academe_cours")
public class AcademeCours {

    public enum Niveau { DEBUTANT, INTERMEDIAIRE, AVANCE }
    public enum Categorie { SYSCOHADA, OHADA, COMPTABILITE, FISCALITE, TRESORERIE, PAIE, AUDIT }

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Niveau niveau = Niveau.DEBUTANT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Categorie categorie;

    @Column(nullable = false)
    private Integer dureeHeures = 1;

    @Column(nullable = false)
    private Boolean actif = true;

    @CreationTimestamp
    private Instant createdAt;

    @OneToMany(mappedBy = "cours", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    private List<AcademeChapitre> chapitres = new ArrayList<>();

    @OneToOne(mappedBy = "cours", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private AcademeQuiz quiz;

    public UUID getId() { return id; }
    public String getTitre() { return titre; }
    public String getDescription() { return description; }
    public Niveau getNiveau() { return niveau; }
    public Categorie getCategorie() { return categorie; }
    public Integer getDureeHeures() { return dureeHeures; }
    public Boolean getActif() { return actif; }
    public Instant getCreatedAt() { return createdAt; }
    public List<AcademeChapitre> getChapitres() { return chapitres; }
    public AcademeQuiz getQuiz() { return quiz; }
}
