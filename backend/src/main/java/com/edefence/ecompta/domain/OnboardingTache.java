package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "onboarding_taches")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OnboardingTache {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private OnboardingPlan plan;

    @Column(nullable = false, length = 255)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Categorie categorie = Categorie.ADMIN;

    @Column(nullable = false)
    @Builder.Default
    private int ordre = 0;

    @Column(nullable = false)
    @Builder.Default
    private boolean terminee = false;

    @Column(name = "date_limite")
    private LocalDate dateLimite;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Categorie { ADMIN, IT, RH, METIER }
}
