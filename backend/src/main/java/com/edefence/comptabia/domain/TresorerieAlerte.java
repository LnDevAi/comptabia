package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tresorerie_alertes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TresorerieAlerte {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "entreprise_id", nullable = false)
    private UUID entrepriseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_id", nullable = false)
    private CompteBancaire compte;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_alerte", nullable = false, length = 30)
    private TypeAlerte typeAlerte;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "solde_constate", precision = 18, scale = 2)
    private BigDecimal soldeConstate;

    @Column(nullable = false)
    @Builder.Default
    private boolean acquittee = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypeAlerte { SOLDE_MINIMUM, SOLDE_NEGATIF }
}
