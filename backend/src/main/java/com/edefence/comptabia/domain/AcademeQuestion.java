package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "academe_questions")
public class AcademeQuestion {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_id")
    private AcademeQuiz quiz;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    @Column(name = "option_a", nullable = false)
    private String optionA;

    @Column(name = "option_b", nullable = false)
    private String optionB;

    @Column(name = "option_c")
    private String optionC;

    @Column(name = "option_d")
    private String optionD;

    @Column(name = "bonne_reponse", nullable = false, columnDefinition = "bpchar")
    private String bonneReponse;

    @Column(nullable = false)
    private Integer ordre = 0;

    public UUID getId() { return id; }
    public AcademeQuiz getQuiz() { return quiz; }
    public String getQuestion() { return question; }
    public String getOptionA() { return optionA; }
    public String getOptionB() { return optionB; }
    public String getOptionC() { return optionC; }
    public String getOptionD() { return optionD; }
    public String getBonneReponse() { return bonneReponse; }
    public Integer getOrdre() { return ordre; }
}
