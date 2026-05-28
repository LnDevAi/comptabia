package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.BudgetRh;
import com.edefence.comptabia.domain.BudgetRh.Categorie;
import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.FeuillePaie;
import com.edefence.comptabia.dto.budget.BudgetRhDto;
import com.edefence.comptabia.repository.BudgetRhRepository;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.FeuillePaieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class BudgetRhService {

    private final BudgetRhRepository  budgetRhRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final FeuillePaieRepository paieRepo;

    @Transactional(readOnly = true)
    public BudgetRhDto.ComparatifRh getComparatif(UUID eid, int exercice) {
        List<BudgetRh>     budgets = budgetRhRepo.findByEntrepriseIdAndExerciceOrderByCategorieAscMoisAsc(eid, exercice);
        List<FeuillePaie>  paies   = paieRepo.findByEntrepriseIdAndExerciceOrderByMoisAsc(eid, exercice);

        // realised[cat][mois] — mois 0 = annual total
        Map<Categorie, Map<Integer, BigDecimal>> realise = buildRealise(paies);

        List<BudgetRhDto.LigneBudget> lignes = new ArrayList<>();
        BigDecimal totalBudget  = BigDecimal.ZERO;
        BigDecimal totalRealise = BigDecimal.ZERO;

        for (BudgetRh b : budgets) {
            BigDecimal real = realise.get(b.getCategorie()).getOrDefault(b.getMois(), BigDecimal.ZERO);
            BigDecimal ecart = b.getMontant().subtract(real);
            double pct = b.getMontant().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                    : real.multiply(BigDecimal.valueOf(100))
                         .divide(b.getMontant(), 1, RoundingMode.HALF_UP).doubleValue();
            lignes.add(new BudgetRhDto.LigneBudget(
                    b.getCategorie().name(), libelleCategorie(b.getCategorie()),
                    b.getMois(), b.getMontant(), real, ecart, pct, b.getId()));
            totalBudget  = totalBudget.add(b.getMontant());
            totalRealise = totalRealise.add(real);
        }

        return new BudgetRhDto.ComparatifRh(
                exercice, lignes, totalBudget, totalRealise, totalBudget.subtract(totalRealise));
    }

    @Transactional
    public BudgetRhDto.LigneBudget upsert(UUID eid, int exercice, BudgetRhDto.UpsertRequest req) {
        Entreprise entreprise = entrepriseRepo.findById(eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        BudgetRh budget = budgetRhRepo
                .findByEntrepriseIdAndExerciceAndMoisAndCategorie(eid, exercice, req.mois(), req.categorie())
                .orElseGet(() -> BudgetRh.builder()
                        .entreprise(entreprise)
                        .exercice(exercice)
                        .mois(req.mois())
                        .categorie(req.categorie())
                        .build());
        budget.setMontant(req.montant());
        budgetRhRepo.save(budget);

        List<FeuillePaie> paies = paieRepo.findByEntrepriseIdAndExerciceOrderByMoisAsc(eid, exercice);
        BigDecimal real = paies.stream()
                .filter(p -> req.mois() == 0 || p.getMois() == req.mois())
                .map(p -> fieldOf(p, req.categorie()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal ecart = req.montant().subtract(real);
        double pct = req.montant().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                : real.multiply(BigDecimal.valueOf(100))
                     .divide(req.montant(), 1, RoundingMode.HALF_UP).doubleValue();

        return new BudgetRhDto.LigneBudget(
                req.categorie().name(), libelleCategorie(req.categorie()),
                req.mois(), req.montant(), real, ecart, pct, budget.getId());
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        BudgetRh b = budgetRhRepo.findByIdAndEntrepriseId(id, eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ligne introuvable"));
        budgetRhRepo.delete(b);
    }

    @Transactional(readOnly = true)
    public List<Integer> exercices(UUID eid) {
        List<Integer> years = new ArrayList<>(budgetRhRepo.findExercices(eid));
        int current = LocalDate.now().getYear();
        if (!years.contains(current)) years.add(0, current);
        return years;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Map<Categorie, Map<Integer, BigDecimal>> buildRealise(List<FeuillePaie> paies) {
        Map<Categorie, Map<Integer, BigDecimal>> map = new EnumMap<>(Categorie.class);
        for (Categorie cat : Categorie.values()) {
            map.put(cat, new HashMap<>());
            map.get(cat).put(0, BigDecimal.ZERO);
        }
        for (FeuillePaie p : paies) {
            for (Categorie cat : Categorie.values()) {
                BigDecimal v = fieldOf(p, cat);
                map.get(cat).merge(p.getMois(), v, BigDecimal::add);
                map.get(cat).merge(0, v, BigDecimal::add);
            }
        }
        return map;
    }

    private BigDecimal fieldOf(FeuillePaie p, Categorie cat) {
        return switch (cat) {
            case MASSE_BRUTE             -> p.getMasseSalarialeBrute();
            case COTISATIONS_PATRONALES  -> p.getCotisationsPatronales();
            case COTISATIONS_SALARIALES  -> p.getCotisationsSalariales();
            case IMPOT_RETENU            -> p.getImpotRetenu();
            case NET_A_PAYER             -> p.getNetAPayer();
        };
    }

    private String libelleCategorie(Categorie cat) {
        return switch (cat) {
            case MASSE_BRUTE             -> "Masse salariale brute";
            case COTISATIONS_PATRONALES  -> "Cotisations patronales";
            case COTISATIONS_SALARIALES  -> "Cotisations salariales";
            case IMPOT_RETENU            -> "Impôt retenu (IRPP/ICS)";
            case NET_A_PAYER             -> "Net à payer";
        };
    }
}
