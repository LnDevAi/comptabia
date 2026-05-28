package com.edefence.comptabia.dto.relance;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class RelanceDto {

    public record TiersImpaye(
            UUID tiersId,
            String tiersCode,
            String tiersNom,
            String tiersEmail,
            String compteNumero,
            BigDecimal montantImpaye,
            int nbJours,
            int nbRelances,
            LocalDate derniereRelance
    ) {}

    public record ListeImpayes(
            List<TiersImpaye> clients,
            BigDecimal totalImpaye,
            int nbClientsImpaye
    ) {}

    public record RelanceRecord(
            UUID id,
            UUID tiersId,
            String tiersNom,
            BigDecimal montantRelance,
            int niveau,
            String note,
            LocalDate dateRelance
    ) {}

    public record CreerRelanceRequest(
            UUID tiersId,
            BigDecimal montantRelance,
            int niveau,
            String note
    ) {}
}
