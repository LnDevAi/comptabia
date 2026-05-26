package com.edefence.ecompta.dto.gouvernance;

import com.edefence.ecompta.domain.AssembleeGenerale;
import com.edefence.ecompta.domain.Resolution;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class AssembleeDto {

    public record ResolutionRequest(
            int numeroOrdre,
            String titre,
            String texte,
            Resolution.TypeResolution typeResolution,
            Resolution.StatutResolution statut,
            int votesPour,
            int votesContre,
            int votesAbstention
    ) {}

    public record ResolutionResponse(
            UUID id,
            int numeroOrdre,
            String titre,
            String texte,
            Resolution.TypeResolution typeResolution,
            String typeResolutionLabel,
            Resolution.StatutResolution statut,
            String statutLabel,
            int votesPour,
            int votesContre,
            int votesAbstention,
            OffsetDateTime createdAt
    ) {}

    public record CreateRequest(
            AssembleeGenerale.TypeAssemblee typeAssemblee,
            String titre,
            LocalDate dateAssemblee,
            String lieu,
            Integer exerciceConcerne,
            BigDecimal quorumRequis,
            String ordreDuJour,
            List<ResolutionRequest> resolutions
    ) {}

    public record UpdateRequest(
            String titre,
            LocalDate dateAssemblee,
            String lieu,
            Integer exerciceConcerne,
            BigDecimal quorumRequis,
            BigDecimal quorumAtteint,
            AssembleeGenerale.StatutAssemblee statut,
            String ordreDuJour,
            String procesVerbal,
            List<ResolutionRequest> resolutions
    ) {}

    public record Response(
            UUID id,
            AssembleeGenerale.TypeAssemblee typeAssemblee,
            String typeAssembleeLabel,
            String titre,
            LocalDate dateAssemblee,
            String lieu,
            Integer exerciceConcerne,
            BigDecimal quorumRequis,
            BigDecimal quorumAtteint,
            AssembleeGenerale.StatutAssemblee statut,
            String statutLabel,
            String ordreDuJour,
            String procesVerbal,
            List<ResolutionResponse> resolutions,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt
    ) {}

    // Portail associé — données accessibles sans auth complète
    public record PortailResponse(
            String nomEntreprise,
            String nomAssocie,
            String typeAssocie,
            java.math.BigDecimal pourcentage,
            List<Response> assemblees,
            // Tableau de bord financier
            PortailDashboard dashboard
    ) {}

    public record PortailDashboard(
            // KPIs comptables (derniers exercices)
            java.math.BigDecimal totalActif,
            java.math.BigDecimal fondsPropres,
            java.math.BigDecimal resultatNet,
            java.math.BigDecimal chiffreAffaires,
            int exercice,
            // Évolution 3 ans
            List<EvolutionAnnuelle> evolution
    ) {}

    public record EvolutionAnnuelle(
            int exercice,
            java.math.BigDecimal totalActif,
            java.math.BigDecimal fondsPropres,
            java.math.BigDecimal resultatNet,
            java.math.BigDecimal chiffreAffaires
    ) {}
}
