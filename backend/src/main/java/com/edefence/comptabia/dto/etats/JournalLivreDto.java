package com.edefence.comptabia.dto.etats;

import com.edefence.comptabia.domain.EcritureComptable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record JournalLivreDto(
        int exercice,
        List<EcritureResume> ecritures
) {
    public record EcritureResume(
            UUID id,
            String numeroPiece,
            LocalDate date,
            String libelle,
            EcritureComptable.Journal journal,
            List<LigneResume> lignes,
            BigDecimal totalDebit,
            BigDecimal totalCredit
    ) {}

    public record LigneResume(
            String compteNumero,
            String compteIntitule,
            BigDecimal debit,
            BigDecimal credit
    ) {}
}
