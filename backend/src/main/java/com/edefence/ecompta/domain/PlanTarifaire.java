package com.edefence.ecompta.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "plans_tarifaires")
@Getter @Setter @NoArgsConstructor
public class PlanTarifaire {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 100)
    private String nom;

    @Column(nullable = false, length = 50, unique = true)
    private String code;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "prix_mensuel", precision = 10, scale = 2, nullable = false)
    private BigDecimal prixMensuel = BigDecimal.ZERO;

    @Column(name = "prix_annuel", precision = 10, scale = 2, nullable = false)
    private BigDecimal prixAnnuel = BigDecimal.ZERO;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String modules = "";

    @Column(name = "max_utilisateurs", nullable = false)
    private int maxUtilisateurs = 5;

    @Column(nullable = false)
    private boolean actif = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private ZonedDateTime createdAt;

    public List<String> getModulesList() {
        if (modules == null || modules.isBlank()) return List.of();
        return Arrays.asList(modules.split(","));
    }
}
