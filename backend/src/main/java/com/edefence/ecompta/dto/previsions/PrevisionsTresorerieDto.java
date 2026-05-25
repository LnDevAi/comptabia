package com.edefence.ecompta.dto.previsions;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class PrevisionsTresorerieDto {

    public record SemaineProjection(
            LocalDate debutSemaine,
            LocalDate finSemaine,
            String    label,
            BigDecimal entrees,
            BigDecimal sorties,
            BigDecimal soldeFin,
            boolean   alerte
    ) {}

    public record FluxItem(
            UUID       id,
            LocalDate  date,
            String     type,
            String     libelle,
            BigDecimal montant,
            String     source,
            String     categorie
    ) {}

    public record Response(
            LocalDate              dateCalcul,
            BigDecimal             soldeCourant,
            BigDecimal             totalCreances,
            List<SemaineProjection> semaines,
            List<FluxItem>         fluxDetails,
            BigDecimal             seuilAlerte
    ) {}

    public record FluxRequest(
            LocalDate  dateFlux,
            String     typeFlux,
            String     libelle,
            BigDecimal montant,
            boolean    recurrent,
            String     periodicite,
            String     categorie
    ) {}

    public record FluxResponse(
            UUID       id,
            LocalDate  dateFlux,
            String     typeFlux,
            String     libelle,
            BigDecimal montant,
            boolean    recurrent,
            String     periodicite,
            String     categorie,
            boolean    actif
    ) {}
}
