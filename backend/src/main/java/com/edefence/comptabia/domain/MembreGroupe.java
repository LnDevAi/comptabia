package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "groupes_societes_membres")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MembreGroupe {

    public enum MethodeConsolidation {
        INTEGRATION_GLOBALE,
        INTEGRATION_PROPORTIONNELLE,
        MISE_EN_EQUIVALENCE
    }

    @EmbeddedId
    private MembreGroupeId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("groupeId")
    @JoinColumn(name = "groupe_id")
    private GroupeSociete groupe;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("entrepriseId")
    @JoinColumn(name = "entreprise_id")
    private Entreprise entreprise;

    @Column(name = "taux_detention", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tauxDetention = BigDecimal.valueOf(100);

    @Column(name = "methode_consolidation", length = 30)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private MethodeConsolidation methodeConsolidation = MethodeConsolidation.INTEGRATION_GLOBALE;
}
