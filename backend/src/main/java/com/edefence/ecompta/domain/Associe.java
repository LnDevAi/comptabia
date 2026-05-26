package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "associes")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Associe {

    public enum TypeAssocie {
        ASSOCIE, GERANT, ADMINISTRATEUR, COMMISSAIRE_AUX_COMPTES, OBSERVATEUR
    }

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false)
    private String nom;

    private String prenom;
    private String email;
    private String telephone;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_associe", nullable = false)
    @Builder.Default
    private TypeAssocie typeAssocie = TypeAssocie.ASSOCIE;

    @Column(nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal apport = BigDecimal.ZERO;

    @Column(nullable = false, precision = 7, scale = 4)
    @Builder.Default
    private BigDecimal pourcentage = BigDecimal.ZERO;

    private LocalDate dateEntree;
    private LocalDate dateSortie;

    @Builder.Default
    private boolean actif = true;

    @Column(name = "token_portail", unique = true)
    @Builder.Default
    private UUID tokenPortail = UUID.randomUUID();

    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    private OffsetDateTime updatedAt;
}
