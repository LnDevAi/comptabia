package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.EcritureComptable;
import com.edefence.comptabia.domain.LigneEcriture;
import com.edefence.comptabia.dto.DashboardDto;
import com.edefence.comptabia.dto.DashboardStatsDto;
import com.edefence.comptabia.repository.CompteComptableRepository;
import com.edefence.comptabia.repository.EcritureComptableRepository;
import com.edefence.comptabia.repository.FactureRepository;
import com.edefence.comptabia.repository.LigneEcritureRepository;
import com.edefence.comptabia.repository.NoteFraisRepository;
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
    private final LigneEcritureRepository     ligneRepo;
    private final NoteFraisRepository         noteFraisRepo;
    private final FactureRepository           factureRepo;

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

    @Transactional(readOnly = true)
    public DashboardStatsDto stats(UUID eid) {
        LocalDate jan1  = LocalDate.now().withDayOfYear(1);
        LocalDate today = LocalDate.now();

        BigDecimal tresorerie = ligneRepo.soldeTresorerie(eid);
        BigDecimal charges    = ligneRepo.totalChargesYtd(eid, jan1, today);
        BigDecimal produits   = ligneRepo.totalProduitsYtd(eid, jan1, today);
        BigDecimal resultat   = produits.subtract(charges);

        long       nfCount    = noteFraisRepo.countSoumises(eid);
        BigDecimal nfMontant  = noteFraisRepo.sumMontantSoumises(eid);

        long       fCount     = factureRepo.countByStatut(eid, com.edefence.comptabia.domain.Facture.Statut.EMISE);
        BigDecimal fMontant   = factureRepo.sumMontantTtcEmises(eid);

        List<DashboardStatsDto.MoisEvolution> evolution = buildEvolution6Mois(eid);

        return new DashboardStatsDto(tresorerie, charges, produits, resultat,
                nfCount, nfMontant, fCount, fMontant, evolution);
    }

    private List<DashboardStatsDto.MoisEvolution> buildEvolution6Mois(UUID eid) {
        LocalDate from = LocalDate.now().minusMonths(5).withDayOfMonth(1);
        LocalDate to   = LocalDate.now();

        List<Object[]> rows = ligneRepo.tendanceMensuelle(eid, from, to);
        // row: [month, credit7, debit7, debit6, credit6]
        Map<Integer, Object[]> byMonth = new HashMap<>();
        for (Object[] row : rows) {
            byMonth.put(((Number) row[0]).intValue(), row);
        }

        List<DashboardStatsDto.MoisEvolution> result = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.now().minusMonths(i);
            Object[] row = byMonth.get(ym.getMonthValue());
            BigDecimal ch = BigDecimal.ZERO;
            BigDecimal pr = BigDecimal.ZERO;
            if (row != null) {
                BigDecimal credit7 = toBd(row[1]);
                BigDecimal debit7  = toBd(row[2]);
                BigDecimal debit6  = toBd(row[3]);
                BigDecimal credit6 = toBd(row[4]);
                pr = credit7.subtract(debit7).max(BigDecimal.ZERO);
                ch = debit6.subtract(credit6).max(BigDecimal.ZERO);
            }
            result.add(new DashboardStatsDto.MoisEvolution(ym.format(MOIS_FMT), ch, pr));
        }
        return result;
    }

    private BigDecimal toBd(Object v) {
        if (v instanceof BigDecimal bd) return bd;
        if (v instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        return BigDecimal.ZERO;
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
