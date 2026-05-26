package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Budget;
import com.edefence.ecompta.domain.BudgetRh;
import com.edefence.ecompta.domain.FeuillePaie;
import com.edefence.ecompta.dto.dashboard.DashboardGlobalDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardGlobalService {

    private final LigneEcritureRepository    ligneRepo;
    private final BudgetRepository           budgetRepo;
    private final BudgetRhRepository         budgetRhRepo;
    private final FeuillePaieRepository      paieRepo;
    private final AxeAnalytiqueRepository    axeRepo;
    private final EcritureComptableRepository ecritureRepo;

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal CENT = BigDecimal.valueOf(100);

    @Transactional(readOnly = true)
    public DashboardGlobalDto.Response get(UUID eid, int exercice) {
        LocalDate debut = LocalDate.of(exercice, 1, 1);
        LocalDate fin   = LocalDate.of(exercice, 12, 31);

        List<Object[]> balance = ligneRepo.balanceParCompte(eid, debut, fin);

        return new DashboardGlobalDto.Response(
                exercice,
                computeFinancier(eid, balance),
                computeBudgetComptable(eid, exercice, balance),
                computeBudgetRh(eid, exercice),
                computeTopAxes(eid, debut, fin),
                computeTendance(eid, debut, fin),
                computeAlertes(eid, exercice, balance)
        );
    }

    // ─── Financier ───────────────────────────────────────────────────────────

    private DashboardGlobalDto.KpiFinancier computeFinancier(UUID eid, List<Object[]> balance) {
        BigDecimal ca = ZERO, charges = ZERO, tresorerie = ZERO;

        for (Object[] r : balance) {
            String     num = (String) r[0];
            BigDecimal d   = (BigDecimal) r[3];
            BigDecimal c   = (BigDecimal) r[4];

            if (num.startsWith("7"))
                ca = ca.add(c.subtract(d).max(ZERO));
            else if (num.startsWith("6"))
                charges = charges.add(d.subtract(c).max(ZERO));
            else if (num.startsWith("5"))
                tresorerie = tresorerie.add(d.subtract(c));
        }

        BigDecimal resultat = ca.subtract(charges);
        double marge = ca.compareTo(ZERO) > 0
                ? resultat.divide(ca, 4, RoundingMode.HALF_UP).multiply(CENT).doubleValue()
                : 0.0;

        return new DashboardGlobalDto.KpiFinancier(ca, charges, resultat, tresorerie, marge);
    }

    // ─── Budget comptable ─────────────────────────────────────────────────────

    private DashboardGlobalDto.ExecBudget computeBudgetComptable(UUID eid, int exercice,
                                                                  List<Object[]> balance) {
        List<Budget> budgets = budgetRepo.findByEntrepriseIdAndExerciceOrderByCompteNumeroAsc(eid, exercice);
        if (budgets.isEmpty()) return emptyBudget();

        Map<String, BigDecimal[]> actuals = balance.stream().collect(Collectors.toMap(
                r -> (String) r[0],
                r -> new BigDecimal[]{(BigDecimal) r[3], (BigDecimal) r[4]},
                (a, b) -> a
        ));

        BigDecimal totalBudget = ZERO, totalRealise = ZERO;
        int nbDepassees = 0;

        for (Budget b : budgets) {
            BigDecimal[] mv  = actuals.getOrDefault(b.getCompteNumero(), new BigDecimal[]{ZERO, ZERO});
            BigDecimal real  = b.getSens() == Budget.Sens.DEBIT ? mv[0] : mv[1];
            totalBudget  = totalBudget.add(b.getMontant());
            totalRealise = totalRealise.add(real);
            if (real.compareTo(b.getMontant()) > 0) nbDepassees++;
        }

        double pct = pct(totalRealise, totalBudget);
        return new DashboardGlobalDto.ExecBudget(
                totalBudget, totalRealise, totalBudget.subtract(totalRealise),
                pct, budgets.size(), nbDepassees);
    }

    // ─── Budget RH ────────────────────────────────────────────────────────────

    private DashboardGlobalDto.ExecBudget computeBudgetRh(UUID eid, int exercice) {
        // Only annual lines (mois=0) as the reference budget
        List<BudgetRh> budgets = budgetRhRepo
                .findByEntrepriseIdAndExerciceOrderByCategorieAscMoisAsc(eid, exercice)
                .stream().filter(b -> b.getMois() == 0).toList();

        if (budgets.isEmpty()) return emptyBudget();

        List<FeuillePaie> paies = paieRepo.findByEntrepriseIdAndExerciceOrderByMoisAsc(eid, exercice);

        BigDecimal totalBudget = ZERO, totalRealise = ZERO;
        int nbDepassees = 0;

        for (BudgetRh b : budgets) {
            BigDecimal real = paies.stream()
                    .map(p -> fieldOf(p, b.getCategorie()))
                    .reduce(ZERO, BigDecimal::add);
            totalBudget  = totalBudget.add(b.getMontant());
            totalRealise = totalRealise.add(real);
            if (real.compareTo(b.getMontant()) > 0) nbDepassees++;
        }

        double pct = pct(totalRealise, totalBudget);
        return new DashboardGlobalDto.ExecBudget(
                totalBudget, totalRealise, totalBudget.subtract(totalRealise),
                pct, budgets.size(), nbDepassees);
    }

    // ─── Top 5 axes ───────────────────────────────────────────────────────────

    private List<DashboardGlobalDto.TopAxe> computeTopAxes(UUID eid, LocalDate debut, LocalDate fin) {
        List<Object[]> rows = axeRepo.rapportParAxe(eid, debut, fin);

        // Aggregate by axe
        Map<UUID, BigDecimal>  debitMap  = new LinkedHashMap<>();
        Map<UUID, String[]>    metaMap   = new LinkedHashMap<>();

        for (Object[] r : rows) {
            UUID       axeId  = (UUID)       r[0];
            String     code   = (String)     r[1];
            String     intit  = (String)     r[2];
            String     type   = (String)     r[3];
            BigDecimal budget = (BigDecimal) r[4];
            BigDecimal dbt    = (BigDecimal) r[7];

            debitMap.merge(axeId, dbt, BigDecimal::add);
            metaMap.putIfAbsent(axeId, new String[]{
                    code, intit, type,
                    budget != null ? budget.toPlainString() : null});
        }

        return debitMap.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(e -> {
                    String[]   meta   = metaMap.get(e.getKey());
                    BigDecimal budget = meta[3] != null ? new BigDecimal(meta[3]) : null;
                    Double     taux   = (budget != null && budget.compareTo(ZERO) > 0)
                            ? e.getValue().multiply(CENT).divide(budget, 1, RoundingMode.HALF_UP).doubleValue()
                            : null;
                    return new DashboardGlobalDto.TopAxe(meta[0], meta[1], meta[2],
                            e.getValue(), budget, taux);
                })
                .toList();
    }

    // ─── Tendance mensuelle ───────────────────────────────────────────────────

    private List<DashboardGlobalDto.MoisTendance> computeTendance(UUID eid, LocalDate debut, LocalDate fin) {
        List<Object[]> rows = ligneRepo.tendanceMensuelle(eid, debut, fin);
        Map<Integer, BigDecimal[]> map = new TreeMap<>();
        for (Object[] r : rows) {
            int mois = ((Number) r[0]).intValue();
            BigDecimal prodCredit = (BigDecimal) r[1];
            BigDecimal prodDebit  = (BigDecimal) r[2];
            BigDecimal chgDebit   = (BigDecimal) r[3];
            BigDecimal chgCredit  = (BigDecimal) r[4];
            BigDecimal ca      = prodCredit.subtract(prodDebit).max(ZERO);
            BigDecimal charges = chgDebit.subtract(chgCredit).max(ZERO);
            map.put(mois, new BigDecimal[]{ca, charges});
        }
        return map.entrySet().stream()
                .map(e -> new DashboardGlobalDto.MoisTendance(
                        e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();
    }

    // ─── Alertes ─────────────────────────────────────────────────────────────

    private List<DashboardGlobalDto.Alerte> computeAlertes(UUID eid, int exercice,
                                                            List<Object[]> balance) {
        List<DashboardGlobalDto.Alerte> alertes = new ArrayList<>();

        // Budgets comptables dépassés
        int nbBudgetDepasses = budgetRepo.findBudgetsDépasses(eid, exercice).size();
        if (nbBudgetDepasses > 0) {
            alertes.add(new DashboardGlobalDto.Alerte(
                    "BUDGET_DEPASSE",
                    nbBudgetDepasses + " ligne(s) de budget comptable dépassée(s)",
                    "DANGER"));
        }

        // Budget RH dépassé
        List<BudgetRh> rhBudgets = budgetRhRepo
                .findByEntrepriseIdAndExerciceOrderByCategorieAscMoisAsc(eid, exercice)
                .stream().filter(b -> b.getMois() == 0).toList();
        List<FeuillePaie> paies = paieRepo.findByEntrepriseIdAndExerciceOrderByMoisAsc(eid, exercice);
        long rhDepassees = rhBudgets.stream().filter(b -> {
            BigDecimal real = paies.stream()
                    .map(p -> fieldOf(p, b.getCategorie()))
                    .reduce(ZERO, BigDecimal::add);
            return real.compareTo(b.getMontant()) > 0;
        }).count();
        if (rhDepassees > 0) {
            alertes.add(new DashboardGlobalDto.Alerte(
                    "BUDGET_RH_DEPASSE",
                    rhDepassees + " catégorie(s) de budget RH dépassée(s)",
                    "DANGER"));
        }

        // Fiches de paie non comptabilisées
        long paiesBrouillon = paies.stream()
                .filter(p -> p.getStatut() == FeuillePaie.Statut.BROUILLON).count();
        if (paiesBrouillon > 0) {
            alertes.add(new DashboardGlobalDto.Alerte(
                    "PAIE_BROUILLON",
                    paiesBrouillon + " fiche(s) de paie non comptabilisée(s) pour " + exercice,
                    "WARNING"));
        }

        // Résultat négatif
        BigDecimal ca = ZERO, charges = ZERO;
        for (Object[] r : balance) {
            String num = (String) r[0];
            BigDecimal d = (BigDecimal) r[3], c = (BigDecimal) r[4];
            if (num.startsWith("7")) ca      = ca.add(c.subtract(d).max(ZERO));
            if (num.startsWith("6")) charges = charges.add(d.subtract(c).max(ZERO));
        }
        if (charges.compareTo(ca) > 0 && ca.compareTo(ZERO) > 0) {
            alertes.add(new DashboardGlobalDto.Alerte(
                    "RESULTAT_NEGATIF",
                    "Le résultat de l'exercice est déficitaire",
                    "WARNING"));
        }

        return alertes;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private DashboardGlobalDto.ExecBudget emptyBudget() {
        return new DashboardGlobalDto.ExecBudget(ZERO, ZERO, ZERO, 0.0, 0, 0);
    }

    private double pct(BigDecimal realise, BigDecimal budget) {
        if (budget.compareTo(ZERO) == 0) return 0.0;
        return realise.multiply(CENT).divide(budget, 1, RoundingMode.HALF_UP).doubleValue();
    }

    private BigDecimal fieldOf(FeuillePaie p, BudgetRh.Categorie cat) {
        return switch (cat) {
            case MASSE_BRUTE            -> p.getMasseSalarialeBrute();
            case COTISATIONS_PATRONALES -> p.getCotisationsPatronales();
            case COTISATIONS_SALARIALES -> p.getCotisationsSalariales();
            case IMPOT_RETENU           -> p.getImpotRetenu();
            case NET_A_PAYER            -> p.getNetAPayer();
        };
    }
}
