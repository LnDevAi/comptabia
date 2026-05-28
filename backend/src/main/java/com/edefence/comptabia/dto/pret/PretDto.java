package com.edefence.comptabia.dto.pret;

import com.edefence.comptabia.domain.EcheancePret;
import com.edefence.comptabia.domain.Pret;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class PretDto {

    public record PretRequest(
            @NotNull UUID collaborateurId,
            @NotNull Pret.TypePret typePret,
            @Positive BigDecimal montant,
            @Min(1) int nbEcheances,
            @NotNull LocalDate dateDebut,
            String motif
    ) {}

    public record EcheanceResponse(
            UUID id,
            int numero,
            int mois,
            int annee,
            BigDecimal montant,
            EcheancePret.Statut statut
    ) {}

    public record PretResponse(
            UUID id,
            UUID collaborateurId,
            String collaborateurNom,
            Pret.TypePret typePret,
            BigDecimal montant,
            int nbEcheances,
            BigDecimal montantEcheance,
            LocalDate dateDebut,
            Pret.Statut statut,
            String motif,
            int nbPrelevees,
            List<EcheanceResponse> echeances,
            String createdAt
    ) {}
}
