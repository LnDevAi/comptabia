package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "etapes_procedure")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EtapeProcedure {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dossier_id", nullable = false)
    private DossierDisciplinaire dossier;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_etape", nullable = false, length = 30)
    private TypeEtape typeEtape;

    @Column(name = "date_etape", nullable = false)
    private LocalDate dateEtape;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public enum TypeEtape {
        CONVOCATION,
        ENTRETIEN,
        DECISION,
        CLOTURE
    }
}
