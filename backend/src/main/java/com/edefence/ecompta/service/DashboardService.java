package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.EcritureComptable;
import com.edefence.ecompta.domain.LigneEcriture;
import com.edefence.ecompta.dto.DashboardDto;
import com.edefence.ecompta.repository.CompteComptableRepository;
import com.edefence.ecompta.repository.EcritureComptableRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository   compteRepo;

    private static final DateTimeFormatter MOIS_FMT = DateTimeFormatter.ofPattern("MMM yyyy", Locale.FRENCH);

    @Transactional(readOnly = true)
    public DashboardDto get(UUID entrepriseId) {
        long total    = ecritureRepo.countByEntrepriseId(entrepriseId);
        long brouil   = ecritureRepo.countBrouillonsByEntrepriseId(entrepriseId);
        long validees = ecritureRepo.countValideesByEntrepriseId(entrepriseId);
        long cloturees = total - brouil - validees;
        long totalC   = compteRepo.countByEntrepriseId(entrepriseId);
        long actifs   = compteRepo.findByEntrepriseIdOrderByNumeroAsc(entrepriseId)
                                   .stream().filter(c -> c.isActif()).count();

        BigDecimal totalDebit  = ecritureRepo.totalDebitValide(entrepriseId);
        BigDecimal totalCredit = ecritureRepo.totalCreditValide(entrepriseId);

        List<DashboardDto.JournalStat> parJournal = buildJournalStats(entrepriseId);
        List<DashboardDto.MoisStat>    mois        = buildMoisStats(entrepriseId);
        List<DashboardDto.EcritureResume> recentes = buildRecentes(entrepriseId);

        return new DashboardDto(totalC, actifs, total, brouil, validees, cloturees,
                totalDebit, totalCredit, parJournal, mois, recentes);
    }

    private List<DashboardDto.JournalStat> buildJournalStats(UUID id) {
        List<Object[]> rows = ecritureRepo.statsParJournal(id);
        Map<EcritureComptable.Journal, long[]> map = new EnumMap<>(EcritureComptable.Journal.class);
        for (Object[] row : rows) {
            EcritureComptable.Journal j = (EcritureComptable.Journal) row[0];
            long count = ((Number) row[1]).longValue();
            BigDecimal debit = (BigDecimal) row[2];
            map.put(j, new long[]{count, debit.longValue()});
        }
        return Arrays.stream(EcritureComptable.Journal.values())
                .map(j -> {
                    long[] v = map.getOrDefault(j, new long[]{0, 0});
                    return new DashboardDto.JournalStat(j.name(), v[0], BigDecimal.valueOf(v[1]));
                })
                .toList();
    }

    private List<DashboardDto.MoisStat> buildMoisStats(UUID id) {
        LocalDate since = LocalDate.now().minusMonths(5).withDayOfMonth(1);
        List<EcritureComptable> ecritures = ecritureRepo.findSince(id, since);

        // Build a map mois → {count, totalDebit}
        record Acc(long count, BigDecimal debit) {}
        Map<YearMonth, Acc> map = new LinkedHashMap<>();
        // Pre-fill 6 months with zeros
        for (int i = 5; i >= 0; i--) {
            map.put(YearMonth.now().minusMonths(i), new Acc(0, BigDecimal.ZERO));
        }
        for (EcritureComptable e : ecritures) {
            YearMonth ym = YearMonth.from(e.getDateEcriture());
            if (map.containsKey(ym)) {
                BigDecimal d = e.getLignes().stream()
                        .map(LigneEcriture::getDebit).reduce(BigDecimal.ZERO, BigDecimal::add);
                Acc cur = map.get(ym);
                map.put(ym, new Acc(cur.count() + 1, cur.debit().add(d)));
            }
        }
        return map.entrySet().stream()
                .map(entry -> new DashboardDto.MoisStat(
                        entry.getKey().format(MOIS_FMT),
                        entry.getValue().count(),
                        entry.getValue().debit()))
                .toList();
    }

    private List<DashboardDto.EcritureResume> buildRecentes(UUID id) {
        return ecritureRepo.findRecent(id).stream()
                .map(e -> {
                    BigDecimal d = e.getLignes().stream().map(LigneEcriture::getDebit).reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal c = e.getLignes().stream().map(LigneEcriture::getCredit).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new DashboardDto.EcritureResume(
                            e.getId(), e.getNumeroPiece(), e.getDateEcriture(),
                            e.getLibelle(), e.getJournal(), e.getStatut(), d, c);
                })
                .toList();
    }
}
