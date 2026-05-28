package com.edefence.comptabia.dto.lettrage;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class LettrageDto {

    public record LigneLettrage(
            UUID id,
            LocalDate dateEcriture,
            String numeroPiece,
            String libelle,
            BigDecimal debit,
            BigDecimal credit,
            String lettre,
            LocalDate lettreDate
    ) {}

    public record CompteLettrageView(
            String compteNumero,
            String compteIntitule,
            List<LigneLettrage> lignes
    ) {}

    public record LettrerRequest(
            List<UUID> ligneIds
    ) {}

    public record DelettrerRequest(
            String lettre
    ) {}

    public record LettrageResult(
            String lettre,
            int nbLignes
    ) {}
}
