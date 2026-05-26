package com.edefence.ecompta.dto.gouvernance;

import com.edefence.ecompta.domain.Associe;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class AssocieDto {

    public record CreateRequest(
            String nom,
            String prenom,
            String email,
            String telephone,
            Associe.TypeAssocie typeAssocie,
            BigDecimal apport,
            BigDecimal pourcentage,
            LocalDate dateEntree,
            String notes
    ) {}

    public record UpdateRequest(
            String nom,
            String prenom,
            String email,
            String telephone,
            Associe.TypeAssocie typeAssocie,
            BigDecimal apport,
            BigDecimal pourcentage,
            LocalDate dateSortie,
            Boolean actif,
            String notes
    ) {}

    public record Response(
            UUID id,
            String nom,
            String prenom,
            String email,
            String telephone,
            Associe.TypeAssocie typeAssocie,
            String typeAssocieLabel,
            BigDecimal apport,
            BigDecimal pourcentage,
            LocalDate dateEntree,
            LocalDate dateSortie,
            boolean actif,
            UUID tokenPortail,
            String urlPortail,
            String notes,
            OffsetDateTime createdAt
    ) {}
}
