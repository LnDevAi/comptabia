package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "flux_tresorerie_previsions")
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FluxTresoreriePrevision {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "date_flux", nullable = false)
    private LocalDate dateFlux;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_flux", nullable = false, length = 20)
    private TypeFlux typeFlux;

    @Column(nullable = false, length = 500)
    private String libelle;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal montant;

    @Column(nullable = false)
    @Builder.Default
    private boolean recurrent = false;

    @Column(length = 20)
    private String periodicite;

    @Column(length = 100)
    private String categorie;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypeFlux { ENCAISSEMENT, DECAISSEMENT }
}
