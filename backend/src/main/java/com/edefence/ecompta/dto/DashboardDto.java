package com.edefence.ecompta.dto;

import com.edefence.ecompta.domain.EcritureComptable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DashboardDto(
        long totalComptes,
        long comptesActifs,
        long totalEcritures,
        long brouillons,
        long validees,
        long cloturees,
        BigDecimal totalDebitValide,
        BigDecimal totalCreditValide,
        List<JournalStat>  parJournal,
        List<MoisStat>     derniersMois,
        List<EcritureResume> dernieresEcritures
) {
    public record JournalStat(String journal, long count, BigDecimal totalDebit) {}

    public record MoisStat(String mois, long count, BigDecimal totalDebit) {}

    public record EcritureResume(
            UUID id,
            String numeroPiece,
            LocalDate dateEcriture,
            String libelle,
            EcritureComptable.Journal journal,
            EcritureComptable.Statut statut,
            BigDecimal totalDebit,
            BigDecimal totalCredit
    ) {}
}
