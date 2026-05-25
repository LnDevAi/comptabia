package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "taux_change",
       uniqueConstraints = @UniqueConstraint(columnNames = {"entreprise_id", "devise", "date_taux"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TauxChange {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false, length = 3)
    private String devise;

    @Column(name = "date_taux", nullable = false)
    private LocalDate dateTaux;

    @Column(nullable = false, precision = 15, scale = 6)
    private BigDecimal taux;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;
}
