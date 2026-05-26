package com.edefence.ecompta.domain;

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
@Table(name = "tresorerie_mouvements")
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "entrepriseId", type = UUID.class))
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TresorerieMouvement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_id", nullable = false)
    private CompteBancaire compte;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "compte_dest_id")
    private CompteBancaire compteDest;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_mouvement", nullable = false, length = 30)
    private TypeMouvement typeMouvement;

    @Column(nullable = false, length = 500)
    private String libelle;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal montant;

    @Column(name = "date_operation", nullable = false)
    private LocalDate dateOperation;

    @Column(length = 100)
    private String reference;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypeMouvement {
        VIREMENT_INTERNE, REMISE_CHEQUES, DEPOT_ESPECES, RETRAIT_ESPECES,
        FRAIS_BANCAIRES, ENCAISSEMENT, DECAISSEMENT, AUTRE
    }
}
