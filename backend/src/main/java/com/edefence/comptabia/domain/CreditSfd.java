package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "credits_sfd")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class CreditSfd {

    public enum Statut {
        ACTIF, EN_SOUFFRANCE, DOUTEUX, REMBOURSE, PASSE_EN_PERTES
    }

    public enum TypeCredit {
        COURT_TERME, MOYEN_TERME, LONG_TERME, MICRO_CREDIT
    }

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(name = "numero_credit", length = 50)
    private String numeroCredit;

    @Column(name = "nom_client", nullable = false, length = 255)
    private String nomClient;

    @Column(name = "montant_accorde", nullable = false, precision = 19, scale = 4)
    private BigDecimal montantAccorde;

    @Column(name = "montant_encours", nullable = false, precision = 19, scale = 4)
    @Builder.Default
    private BigDecimal montantEncours = BigDecimal.ZERO;

    @Column(name = "date_deblocage", nullable = false)
    private LocalDate dateDeblocage;

    @Column(name = "date_echeance")
    private LocalDate dateEcheance;

    @Column(name = "jours_retard", nullable = false)
    @Builder.Default
    private int joursRetard = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false, length = 20)
    @Builder.Default
    private Statut statut = Statut.ACTIF;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_credit", nullable = false, length = 20)
    @Builder.Default
    private TypeCredit typeCredit = TypeCredit.MICRO_CREDIT;

    @Column(name = "notes")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;
}
