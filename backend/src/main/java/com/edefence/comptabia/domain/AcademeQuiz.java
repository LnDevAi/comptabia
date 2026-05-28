package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "academe_quiz")
public class AcademeQuiz {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cours_id")
    private AcademeCours cours;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private Integer scoreMinimum = 70;

    @OneToMany(mappedBy = "quiz", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("ordre ASC")
    private List<AcademeQuestion> questions = new ArrayList<>();

    public UUID getId() { return id; }
    public AcademeCours getCours() { return cours; }
    public String getTitre() { return titre; }
    public Integer getScoreMinimum() { return scoreMinimum; }
    public List<AcademeQuestion> getQuestions() { return questions; }
}
