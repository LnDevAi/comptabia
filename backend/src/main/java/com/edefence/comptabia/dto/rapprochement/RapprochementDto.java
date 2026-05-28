package com.edefence.comptabia.dto.rapprochement;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class RapprochementDto {

    private RapprochementDto() {}

    public record LigneReleve(
            UUID        id,
            LocalDate   dateReleve,
            String      reference,
            String      libelle,
            BigDecimal  montant,
            String      sens,
            String      statut,
            UUID        ligneEcritureId
    ) {}

    public record LigneEcriture(
            UUID        id,
            LocalDate   dateEcriture,
            String      numeroPiece,
            String      libelle,
            BigDecimal  debit,
            BigDecimal  credit,
            boolean     rapprochee
    ) {}

    public record EtatRapprochement(
            String              compteNumero,
            BigDecimal          soldeComptable,
            BigDecimal          soldeReleve,
            BigDecimal          ecart,
            long                nonRapprochesReleve,
            long                nonRapprochesEcriture,
            List<LigneReleve>   lignesReleve,
            List<LigneEcriture> lignesEcriture
    ) {}

    public record RapprocherRequest(
            UUID releveLigneId,
            UUID ecritureLigneId
    ) {}

    public record ImportResult(
            int imported,
            int skipped
    ) {}

    public record CompteAvecReleve(@NotBlank String compteNumero) {}
}
