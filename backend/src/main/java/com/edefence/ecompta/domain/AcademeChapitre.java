package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "academe_chapitres")
public class AcademeChapitre {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cours_id")
    private AcademeCours cours;

    @Column(nullable = false)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String contenu;

    @Column(nullable = false)
    private Integer ordre = 0;

    @Column(nullable = false)
    private Integer dureeMinutes = 15;

    public UUID getId() { return id; }
    public AcademeCours getCours() { return cours; }
    public String getTitre() { return titre; }
    public String getContenu() { return contenu; }
    public Integer getOrdre() { return ordre; }
    public Integer getDureeMinutes() { return dureeMinutes; }
}
