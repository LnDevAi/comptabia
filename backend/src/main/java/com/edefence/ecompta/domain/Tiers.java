package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "tiers",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "code"}))
@FilterDef(name = "tenantFilter", parameters = @ParamDef(name = "entrepriseId", type = UUID.class))
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Tiers {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private TypeTiers type;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 255)
    private String nom;

    private String email;
    private String telephone;

    @Column(columnDefinition = "TEXT")
    private String adresse;

    @Column(name = "compte_numero", length = 20)
    private String compteNumero;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "created_at", updatable = false)
    @CreationTimestamp
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private OffsetDateTime updatedAt;

    public enum TypeTiers { CLIENT, FOURNISSEUR, AUTRE }
}
