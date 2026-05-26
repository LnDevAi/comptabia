package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "academe_progression_chapitres",
       uniqueConstraints = @UniqueConstraint(columnNames = {"inscription_id", "chapitre_id"}))
public class AcademeProgressionChapitre {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "inscription_id")
    private AcademeInscription inscription;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "chapitre_id")
    private AcademeChapitre chapitre;

    @Column(nullable = false)
    private Instant dateCompletion = Instant.now();

    public UUID getId() { return id; }
    public AcademeInscription getInscription() { return inscription; }
    public void setInscription(AcademeInscription i) { this.inscription = i; }
    public AcademeChapitre getChapitre() { return chapitre; }
    public void setChapitre(AcademeChapitre c) { this.chapitre = c; }
    public Instant getDateCompletion() { return dateCompletion; }
}
