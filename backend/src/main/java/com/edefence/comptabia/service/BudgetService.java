package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Budget;
import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.dto.budget.BudgetDto;
import com.edefence.comptabia.repository.BudgetRepository;
import com.edefence.comptabia.repository.CompteComptableRepository;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository          budgetRepo;
    private final EntrepriseRepository      entrepriseRepo;
    private final CompteComptableRepository compteRepo;
    private final LigneEcritureRepository   ligneRepo;
    private final AuditService              auditSvc;

    // ─── Comparatif ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BudgetDto.Comparatif getComparatif(UUID entrepriseId, int exercice) {
        List<Budget> budgets = budgetRepo
                .findByEntrepriseIdAndExerciceOrderByCompteNumeroAsc(entrepriseId, exercice);

        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);

        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);
        Map<String, BigDecimal[]> actuals = balance.stream().collect(Collectors.toMap(
                row -> (String) row[0],
                row -> new BigDecimal[]{(BigDecimal) row[3], (BigDecimal) row[4]}
        ));

        Map<String, String> intitules = compteRepo
                .findByEntrepriseIdOrderByNumeroAsc(entrepriseId).stream()
                .collect(Collectors.toMap(c -> c.getNumero(), c -> c.getIntitule()));

        List<BudgetDto.LigneComparatif> lignes = new ArrayList<>();
        BigDecimal totalBudget  = BigDecimal.ZERO;
        BigDecimal totalRealise = BigDecimal.ZERO;

        for (Budget b : budgets) {
            BigDecimal[] mv = actuals.getOrDefault(b.getCompteNumero(),
                    new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            BigDecimal realise = b.getSens() == Budget.Sens.DEBIT ? mv[0] : mv[1];
            BigDecimal ecart   = b.getMontant().subtract(realise);
            double pct = b.getMontant().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                    : realise.multiply(BigDecimal.valueOf(100))
                             .divide(b.getMontant(), 1, RoundingMode.HALF_UP)
                             .doubleValue();

            lignes.add(new BudgetDto.LigneComparatif(
                    b.getCompteNumero(),
                    intitules.getOrDefault(b.getCompteNumero(), b.getCompteNumero()),
                    b.getSens().name(),
                    b.getMontant(), realise, ecart, pct, b.getId()
            ));
            totalBudget  = totalBudget.add(b.getMontant());
            totalRealise = totalRealise.add(realise);
        }

        double tauxConsommation = totalBudget.compareTo(BigDecimal.ZERO) == 0 ? 0
                : totalRealise.multiply(BigDecimal.valueOf(100))
                              .divide(totalBudget, 1, RoundingMode.HALF_UP)
                              .doubleValue();
        int nbDepassements = (int) lignes.stream().filter(l -> l.pctConsomme() > 100).count();

        List<BudgetDto.MoisRealise> tendanceMensuelle = computeTendanceMensuelle(
                entrepriseId, budgets, from, to, totalBudget);

        return new BudgetDto.Comparatif(
                exercice, totalBudget, totalRealise,
                totalBudget.subtract(totalRealise),
                tauxConsommation, nbDepassements,
                lignes, tendanceMensuelle);
    }

    private List<BudgetDto.MoisRealise> computeTendanceMensuelle(
            UUID entrepriseId, List<Budget> budgets,
            LocalDate from, LocalDate to, BigDecimal totalBudget) {

        List<String> comptesDebit  = budgets.stream()
                .filter(b -> b.getSens() == Budget.Sens.DEBIT)
                .map(Budget::getCompteNumero).toList();
        List<String> comptesCredit = budgets.stream()
                .filter(b -> b.getSens() == Budget.Sens.CREDIT)
                .map(Budget::getCompteNumero).toList();

        Map<Integer, BigDecimal> monthlyRealise = new HashMap<>();

        if (!comptesDebit.isEmpty()) {
            for (Object[] r : ligneRepo.realiseMensuelComptes(entrepriseId, comptesDebit, from, to)) {
                int m = ((Number) r[0]).intValue();
                monthlyRealise.merge(m, (BigDecimal) r[1], BigDecimal::add);
            }
        }
        if (!comptesCredit.isEmpty()) {
            for (Object[] r : ligneRepo.realiseMensuelComptes(entrepriseId, comptesCredit, from, to)) {
                int m = ((Number) r[0]).intValue();
                monthlyRealise.merge(m, (BigDecimal) r[2], BigDecimal::add);
            }
        }

        BigDecimal cibleMois = totalBudget.divide(BigDecimal.valueOf(12), 2, RoundingMode.HALF_UP);

        List<BudgetDto.MoisRealise> result = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            String label = Month.of(m).getDisplayName(TextStyle.SHORT, Locale.FRENCH);
            result.add(new BudgetDto.MoisRealise(
                    m, label,
                    monthlyRealise.getOrDefault(m, BigDecimal.ZERO),
                    cibleMois));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<Integer> exercicesWithBudget(UUID entrepriseId) {
        List<Integer> years = new ArrayList<>(budgetRepo.findExercicesWithBudget(entrepriseId));
        int current = LocalDate.now().getYear();
        if (!years.contains(current)) years.add(0, current);
        return years;
    }

    // ─── Export CSV ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String exportCsv(UUID entrepriseId, int exercice) {
        BudgetDto.Comparatif c = getComparatif(entrepriseId, exercice);
        StringBuilder sb = new StringBuilder();
        sb.append("Compte;Intitulé;Sens;Budget;Réalisé;Écart;% Consommé\n");
        for (BudgetDto.LigneComparatif l : c.lignes()) {
            sb.append(l.compteNumero()).append(";")
              .append(l.intitule().replace(";", " ")).append(";")
              .append(l.sens()).append(";")
              .append(l.budget()).append(";")
              .append(l.realise()).append(";")
              .append(l.ecart()).append(";")
              .append(String.format("%.1f", l.pctConsomme())).append("\n");
        }
        return sb.toString();
    }

    // ─── Upsert / Delete ─────────────────────────────────────────────────────

    @Transactional
    public BudgetDto.LigneComparatif upsert(UUID entrepriseId, int exercice, BudgetDto.UpsertRequest dto) {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        if (!compteRepo.existsByNumeroAndEntrepriseId(dto.compteNumero(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Compte " + dto.compteNumero() + " introuvable dans le plan de comptes.");
        }

        Budget budget = budgetRepo
                .findByEntrepriseIdAndExerciceAndCompteNumeroAndSens(
                        entrepriseId, exercice, dto.compteNumero(), dto.sens())
                .orElseGet(() -> Budget.builder()
                        .entreprise(entreprise)
                        .exercice(exercice)
                        .compteNumero(dto.compteNumero())
                        .sens(dto.sens())
                        .build());

        boolean isNew = budget.getId() == null;
        budget.setMontant(dto.montant());
        budgetRepo.save(budget);
        auditSvc.logCurrent(entrepriseId,
                isNew ? "BUDGET_CREE" : "BUDGET_MODIFIE",
                "BUDGET", exercice + "/" + dto.compteNumero());

        String intitule = compteRepo.findByNumeroAndEntrepriseId(dto.compteNumero(), entrepriseId)
                .map(c -> c.getIntitule()).orElse(dto.compteNumero());

        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);
        BigDecimal realise = balance.stream()
                .filter(row -> dto.compteNumero().equals(row[0]))
                .map(row -> dto.sens() == Budget.Sens.DEBIT ? (BigDecimal) row[3] : (BigDecimal) row[4])
                .findFirst().orElse(BigDecimal.ZERO);

        BigDecimal ecart = dto.montant().subtract(realise);
        double pct = dto.montant().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                : realise.multiply(BigDecimal.valueOf(100))
                         .divide(dto.montant(), 1, RoundingMode.HALF_UP).doubleValue();

        return new BudgetDto.LigneComparatif(
                dto.compteNumero(), intitule, dto.sens().name(),
                dto.montant(), realise, ecart, pct, budget.getId());
    }

    @Transactional
    public void delete(UUID id, UUID entrepriseId) {
        Budget b = budgetRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ligne budget introuvable"));
        String ref = b.getExercice() + "/" + b.getCompteNumero();
        budgetRepo.delete(b);
        auditSvc.logCurrent(entrepriseId, "BUDGET_SUPPRIME", "BUDGET", ref);
    }
}
