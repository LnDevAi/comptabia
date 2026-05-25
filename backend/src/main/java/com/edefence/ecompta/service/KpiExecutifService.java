package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Budget;
import com.edefence.ecompta.dto.kpi.KpiExecutifDto;
import com.edefence.ecompta.repository.BudgetRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class KpiExecutifService {

    private final LigneEcritureRepository ligneRepo;
    private final BudgetRepository        budgetRepo;

    private static final LocalDate EPOCH = LocalDate.of(1900, 1, 1);

    @Transactional(readOnly = true)
    public KpiExecutifDto.Response get(UUID eid, int exercice) {
        LocalDate debutN  = LocalDate.of(exercice,     1, 1);
        LocalDate finN    = LocalDate.of(exercice,    12, 31);
        LocalDate debutN1 = LocalDate.of(exercice - 1, 1, 1);
        LocalDate finN1   = LocalDate.of(exercice - 1,12, 31);
        LocalDate today   = LocalDate.now();

        List<Object[]> balN   = ligneRepo.balanceParCompte(eid, debutN,  finN);
        List<Object[]> balN1  = ligneRepo.balanceParCompte(eid, debutN1, finN1);
        List<Object[]> balAll = ligneRepo.balanceParCompte(eid, EPOCH,   today);

        // ── CA (class 7) ──────────────────────────────────────────────────────
        BigDecimal caN  = sumClasse(balN,  "7", false);
        BigDecimal caN1 = sumClasse(balN1, "7", false);

        // ── Charges (class 6) ─────────────────────────────────────────────────
        BigDecimal chargesN  = sumClasse(balN,  "6", true);
        BigDecimal chargesN1 = sumClasse(balN1, "6", true);

        // ── Résultat net ──────────────────────────────────────────────────────
        BigDecimal resultatN  = caN.subtract(chargesN);
        BigDecimal resultatN1 = caN1.subtract(chargesN1);

        // ── Trésorerie courante (class 5, cumulé) ─────────────────────────────
        BigDecimal tresorerie = BigDecimal.ZERO;
        for (Object[] r : balAll) {
            String num = (String) r[0];
            if (num.startsWith("5")) {
                tresorerie = tresorerie.add((BigDecimal) r[3]).subtract((BigDecimal) r[4]);
            }
        }

        // ── Encours clients (411 débiteur, cumulé) ────────────────────────────
        BigDecimal encours = BigDecimal.ZERO;
        for (Object[] r : balAll) {
            String num = (String) r[0];
            if (num.startsWith("411")) {
                BigDecimal solde = ((BigDecimal) r[3]).subtract((BigDecimal) r[4]);
                if (solde.compareTo(BigDecimal.ZERO) > 0) encours = encours.add(solde);
            }
        }

        // ── Budget ────────────────────────────────────────────────────────────
        KpiExecutifDto.BudgetSynthese budget = computeBudget(eid, exercice, balN);

        // ── Tendance mensuelle ─────────────────────────────────────────────────
        List<KpiExecutifDto.MoisData> tendance = computeTendance(eid, debutN, finN);

        return new KpiExecutifDto.Response(
                exercice,
                card("Chiffre d'affaires",  caN,       caN1,       "XOF"),
                card("Charges totales",      chargesN,  chargesN1,  "XOF"),
                card("Résultat net",         resultatN, resultatN1, "XOF"),
                card("Trésorerie",           tresorerie, null,       "XOF"),
                card("Encours clients",      encours,    null,       "XOF"),
                budget,
                tendance);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private BigDecimal sumClasse(List<Object[]> bal, String prefix, boolean debitSide) {
        BigDecimal total = BigDecimal.ZERO;
        for (Object[] r : bal) {
            String num = (String) r[0];
            if (num.startsWith(prefix)) {
                BigDecimal debit  = (BigDecimal) r[3];
                BigDecimal credit = (BigDecimal) r[4];
                BigDecimal solde  = debitSide
                        ? debit.subtract(credit)
                        : credit.subtract(debit);
                if (solde.compareTo(BigDecimal.ZERO) > 0) total = total.add(solde);
            }
        }
        return total;
    }

    private KpiExecutifDto.KpiCard card(String label, BigDecimal val, BigDecimal prev, String unite) {
        double evo = 0;
        String tendance = "STABLE";
        if (prev != null && prev.compareTo(BigDecimal.ZERO) != 0) {
            evo = val.subtract(prev)
                     .divide(prev.abs(), 4, RoundingMode.HALF_UP)
                     .multiply(BigDecimal.valueOf(100))
                     .doubleValue();
            tendance = evo > 0.5 ? "UP" : evo < -0.5 ? "DOWN" : "STABLE";
        }
        return new KpiExecutifDto.KpiCard(label, val, prev, evo, tendance, unite);
    }

    private KpiExecutifDto.BudgetSynthese computeBudget(UUID eid, int exercice, List<Object[]> balN) {
        List<Budget> lignes = budgetRepo.findByEntrepriseIdAndExerciceOrderByCompteNumeroAsc(eid, exercice);
        if (lignes.isEmpty()) return new KpiExecutifDto.BudgetSynthese(
                BigDecimal.ZERO, BigDecimal.ZERO, 0, 0);

        // Index balance by account number
        Map<String, BigDecimal[]> balIdx = new HashMap<>();
        for (Object[] r : balN) {
            balIdx.put((String) r[0], new BigDecimal[]{(BigDecimal) r[3], (BigDecimal) r[4]});
        }

        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalReel   = BigDecimal.ZERO;
        int depassements = 0;

        for (Budget b : lignes) {
            totalBudget = totalBudget.add(b.getMontant());
            BigDecimal[] bd = balIdx.get(b.getCompteNumero());
            if (bd != null) {
                BigDecimal reel = b.getSens() == Budget.Sens.DEBIT
                        ? bd[0].subtract(bd[1])
                        : bd[1].subtract(bd[0]);
                if (reel.compareTo(BigDecimal.ZERO) > 0) {
                    totalReel = totalReel.add(reel);
                    if (reel.compareTo(b.getMontant()) > 0) depassements++;
                }
            }
        }

        double taux = totalBudget.compareTo(BigDecimal.ZERO) == 0 ? 0
                : totalReel.divide(totalBudget, 4, RoundingMode.HALF_UP)
                           .multiply(BigDecimal.valueOf(100)).doubleValue();

        return new KpiExecutifDto.BudgetSynthese(totalBudget, totalReel, taux, depassements);
    }

    private List<KpiExecutifDto.MoisData> computeTendance(UUID eid, LocalDate from, LocalDate to) {
        List<Object[]> rows = ligneRepo.tendanceMensuelle(eid, from, to);
        Map<Integer, KpiExecutifDto.MoisData> map = new HashMap<>();

        for (Object[] r : rows) {
            int mois          = ((Number) r[0]).intValue();
            BigDecimal caC    = (BigDecimal) r[1];
            BigDecimal caD    = (BigDecimal) r[2];
            BigDecimal chD    = (BigDecimal) r[3];
            BigDecimal chC    = (BigDecimal) r[4];
            BigDecimal ca     = caC.subtract(caD);
            BigDecimal ch     = chD.subtract(chC);
            String label = Month.of(mois).getDisplayName(TextStyle.SHORT, Locale.FRENCH);
            map.put(mois, new KpiExecutifDto.MoisData(mois, label, ca, ch, ca.subtract(ch)));
        }

        // Fill missing months with zeros
        List<KpiExecutifDto.MoisData> result = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            result.add(map.getOrDefault(m, new KpiExecutifDto.MoisData(
                    m, Month.of(m).getDisplayName(TextStyle.SHORT, Locale.FRENCH),
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO)));
        }
        return result;
    }
}
