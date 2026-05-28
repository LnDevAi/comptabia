package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "echeances_pret")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EcheancePret {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pret_id", nullable = false)
    private Pret pret;

    @Column(nullable = false)
    private int numero;

    @Column(nullable = false)
    private int mois;

    @Column(nullable = false)
    private int annee;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal montant;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.EN_ATTENTE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum Statut { EN_ATTENTE, PRELEVE }
}
