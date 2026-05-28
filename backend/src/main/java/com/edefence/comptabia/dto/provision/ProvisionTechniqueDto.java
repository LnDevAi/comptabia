package com.edefence.comptabia.dto.provision;

import com.edefence.comptabia.domain.ProvisionTechnique;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class ProvisionTechniqueDto {

    private ProvisionTechniqueDto() {}

    public record CreateRequest(
            ProvisionTechnique.TypeProvision typeProvision,
            ProvisionTechnique.Branche branche,
            int exercice,
            LocalDate dateCalcul,
            BigDecimal montant,
            String notes
    ) {}

    public record UpdateRequest(
            BigDecimal montant,
            LocalDate dateCalcul,
            String notes
    ) {}

    public record Response(
            UUID id,
            ProvisionTechnique.TypeProvision typeProvision,
            String typeLabel,
            ProvisionTechnique.Branche branche,
            int exercice,
            LocalDate dateCalcul,
            BigDecimal montant,
            String notes,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    public record TotalParType(
            ProvisionTechnique.TypeProvision typeProvision,
            String typeLabel,
            ProvisionTechnique.Branche branche,
            BigDecimal total
    ) {}

    public record DashboardResponse(
            int exercice,
            BigDecimal totalProvisionsTechniques,
            BigDecimal totalPlacements,
            BigDecimal totalFondsPropres,
            BigDecimal primesAcquises,
            BigDecimal sinistresPayes,
            BigDecimal fraisAcquisitionEtAdministration,
            List<TotalParType> totauxParType,
            // Ratios prudentiels CIMA
            BigDecimal ratioCouvertureProvisions,    // placements / provisions (≥ 100%)
            BigDecimal ratioMargeSolvabilite,         // fonds propres / primes nettes (≥ 20% Non-Vie)
            BigDecimal ratioSinistralite,             // sinistres / primes acquises
            BigDecimal ratioFrais,                    // frais / primes acquises
            BigDecimal ratioCombinaison               // sinistralité + frais
    ) {}
}
