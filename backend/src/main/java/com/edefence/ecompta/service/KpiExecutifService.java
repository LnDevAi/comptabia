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
import java.util.*;

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

        // ── Trésorerie (class 5, cumulé) ──────────────────────────────────────
        BigDecimal tresorerie = BigDecimal.ZERO;
        for (Object[] r : balAll) {
            if (((String) r[0]).startsWith("5")) {
                tresorerie = tresorerie.add((BigDecimal) r[3]).subtract((BigDecimal) r[4]);
            }
        }

        // ── Encours clients (411 débiteur, cumulé) ────────────────────────────
        BigDecimal encours = BigDecimal.ZERO;
        for (Object[] r : balAll) {
            if (((String) r[0]).startsWith("411")) {
                BigDecimal solde = ((BigDecimal) r[3]).subtract((BigDecimal) r[4]);
                if (solde.compareTo(BigDecimal.ZERO) > 0) encours = encours.add(solde);
            }
        }

        // ── Budget ────────────────────────────────────────────────────────────
        KpiExecutifDto.BudgetSynthese budget = computeBudget(eid, exercice, balN);

        // ── Tendance mensuelle N + N-1 ────────────────────────────────────────
        List<KpiExecutifDto.MoisData> tendance = computeTendance(eid, debutN, finN, debutN1, finN1);

        // ── Top charges ───────────────────────────────────────────────────────
        List<KpiExecutifDto.CompteCharge> topCharges = computeTopCharges(balN, chargesN);

        // ── Ratios ────────────────────────────────────────────────────────────
        KpiExecutifDto.Ratios ratios = computeRatios(caN, caN1, chargesN, resultatN, encours);

        // ── Alertes ───────────────────────────────────────────────────────────
        List<KpiExecutifDto.Alerte> alertes = buildAlertes(
                resultatN, caN, budget, tresorerie, encours, ratios);

        return new KpiExecutifDto.Response(
                exercice,
                card("Chiffre d'affaires",  caN,       caN1,       "XOF"),
                card("Charges totales",      chargesN,  chargesN1,  "XOF"),
                card("Résultat net",         resultatN, resultatN1, "XOF"),
                card("Trésorerie",           tresorerie, null,       "XOF"),
                card("Encours clients",      encours,    null,       "XOF"),
                budget,
                tendance,
                topCharges,
                ratios,
                alertes);
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

    private List<KpiExecutifDto.MoisData> computeTendance(
            UUID eid, LocalDate fromN, LocalDate toN, LocalDate fromN1, LocalDate toN1) {

        List<Object[]> rowsN  = ligneRepo.tendanceMensuelle(eid, fromN,  toN);
        List<Object[]> rowsN1 = ligneRepo.tendanceMensuelle(eid, fromN1, toN1);

        Map<Integer, BigDecimal[]> mapN  = buildMonthMap(rowsN);
        Map<Integer, BigDecimal[]> mapN1 = buildMonthMap(rowsN1);

        List<KpiExecutifDto.MoisData> result = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            BigDecimal[] n  = mapN.getOrDefault(m,  new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            BigDecimal[] n1 = mapN1.getOrDefault(m, new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            String label = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.FRENCH);
            result.add(new KpiExecutifDto.MoisData(
                    m, label, n[0], n[1], n[0].subtract(n[1]), n1[0], n1[1]));
        }
        return result;
    }

    private Map<Integer, BigDecimal[]> buildMonthMap(List<Object[]> rows) {
        Map<Integer, BigDecimal[]> map = new HashMap<>();
        for (Object[] r : rows) {
            int mois       = ((Number) r[0]).intValue();
            BigDecimal ca  = ((BigDecimal) r[1]).subtract((BigDecimal) r[2]);
            BigDecimal ch  = ((BigDecimal) r[3]).subtract((BigDecimal) r[4]);
            map.put(mois, new BigDecimal[]{ca, ch});
        }
        return map;
    }

    private List<KpiExecutifDto.CompteCharge> computeTopCharges(
            List<Object[]> balN, BigDecimal totalCharges) {

        List<KpiExecutifDto.CompteCharge> list = new ArrayList<>();
        for (Object[] r : balN) {
            String num = (String) r[0];
            if (num.startsWith("6")) {
                BigDecimal montant = ((BigDecimal) r[3]).subtract((BigDecimal) r[4]);
                if (montant.compareTo(BigDecimal.ZERO) > 0) {
                    String libelle = r[1] != null ? (String) r[1] : num;
                    double part = totalCharges.compareTo(BigDecimal.ZERO) == 0 ? 0
                            : montant.divide(totalCharges, 4, RoundingMode.HALF_UP)
                                     .multiply(BigDecimal.valueOf(100)).doubleValue();
                    list.add(new KpiExecutifDto.CompteCharge(num, libelle, montant, part));
                }
            }
        }
        list.sort(Comparator.comparing(KpiExecutifDto.CompteCharge::montant).reversed());
        return list.stream().limit(5).toList();
    }

    private KpiExecutifDto.Ratios computeRatios(
            BigDecimal ca, BigDecimal caN1, BigDecimal charges,
            BigDecimal resultat, BigDecimal encours) {

        double margeNette = ca.compareTo(BigDecimal.ZERO) == 0 ? 0
                : resultat.divide(ca, 4, RoundingMode.HALF_UP)
                          .multiply(BigDecimal.valueOf(100)).doubleValue();

        double tauxCharges = ca.compareTo(BigDecimal.ZERO) == 0 ? 0
                : charges.divide(ca, 4, RoundingMode.HALF_UP)
                         .multiply(BigDecimal.valueOf(100)).doubleValue();

        double dso = ca.compareTo(BigDecimal.ZERO) == 0 ? 0
                : encours.divide(ca, 4, RoundingMode.HALF_UP)
                         .multiply(BigDecimal.valueOf(365)).doubleValue();

        double varCa = (caN1 != null && caN1.compareTo(BigDecimal.ZERO) != 0)
                ? ca.subtract(caN1).divide(caN1.abs(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0;

        return new KpiExecutifDto.Ratios(margeNette, tauxCharges, dso, varCa);
    }

    private List<KpiExecutifDto.Alerte> buildAlertes(
            BigDecimal resultat, BigDecimal ca,
            KpiExecutifDto.BudgetSynthese budget, BigDecimal tresorerie,
            BigDecimal encours, KpiExecutifDto.Ratios ratios) {

        List<KpiExecutifDto.Alerte> alertes = new ArrayList<>();

        if (resultat.compareTo(BigDecimal.ZERO) < 0)
            alertes.add(new KpiExecutifDto.Alerte("DANGER",
                "Résultat net déficitaire — l'entreprise enregistre une perte sur l'exercice."));

        if (tresorerie.compareTo(BigDecimal.ZERO) < 0)
            alertes.add(new KpiExecutifDto.Alerte("DANGER",
                "Trésorerie négative — position de trésorerie critique."));

        if (budget.nbDepassements() > 0)
            alertes.add(new KpiExecutifDto.Alerte("WARNING",
                budget.nbDepassements() + " ligne(s) budgétaire(s) dépassée(s)."));

        if (budget.tauxConsommation() > 90 && budget.totalBudget().compareTo(BigDecimal.ZERO) > 0)
            alertes.add(new KpiExecutifDto.Alerte("WARNING",
                "Budget consommé à " + String.format("%.0f", budget.tauxConsommation())
                + "% — risque de dépassement."));

        if (ratios.dso() > 60)
            alertes.add(new KpiExecutifDto.Alerte("WARNING",
                "DSO élevé : " + String.format("%.0f", ratios.dso())
                + " jours — délai moyen de recouvrement à surveiller."));

        if (ratios.margeNettePct() > 0 && ratios.margeNettePct() < 5)
            alertes.add(new KpiExecutifDto.Alerte("INFO",
                "Marge nette faible : " + String.format("%.1f", ratios.margeNettePct()) + "%."));

        return alertes;
    }
}
