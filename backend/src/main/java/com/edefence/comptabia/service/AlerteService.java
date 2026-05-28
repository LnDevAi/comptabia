package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.ExerciceComptable;
import com.edefence.comptabia.domain.Facture;
import com.edefence.comptabia.domain.FeuillePaie;
import com.edefence.comptabia.domain.NotificationRule;
import com.edefence.comptabia.dto.alerte.AlerteDto;
import com.edefence.comptabia.dto.alerte.AlerteDto.Alerte;
import com.edefence.comptabia.dto.alerte.AlerteDto.Niveau;
import com.edefence.comptabia.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlerteService {

    private final ExerciceComptableRepository  exerciceRepo;
    private final ImmobilisationRepository     immoRepo;
    private final DeclarationTvaRepository     tvaRepo;
    private final RelanceRepository            relanceRepo;
    private final BudgetRepository             budgetRepo;
    private final EcritureComptableRepository  ecritureRepo;
    private final FactureRepository            factureRepo;
    private final FeuillePaieRepository        paieRepo;
    private final LigneEcritureRepository      ligneRepo;
    private final NotificationRuleRepository   ruleRepo;

    @Transactional(readOnly = true)
    public AlerteDto.AlerteResponse getAlertes(UUID entrepriseId) {
        List<Alerte> alertes = new ArrayList<>();
        int year = LocalDate.now().getYear();
        Map<String, NotificationRule> rules = loadRules(entrepriseId);

        checkExercicePrecedent(entrepriseId, year, alertes);
        checkBrouillons(entrepriseId, alertes, rules);
        checkDotationsManquantes(entrepriseId, year, alertes);
        checkTvaMoisPrecedent(entrepriseId, alertes);
        checkMisesEnDemeure(entrepriseId, alertes);
        checkBudgetsDépasses(entrepriseId, year, alertes);
        checkTresorerieCritique(entrepriseId, alertes, rules);
        checkFacturesEcheancesImminentes(entrepriseId, alertes, rules);
        checkPaiesNonComptabilisees(entrepriseId, year, alertes, rules);
        checkResultatNegatif(entrepriseId, year, alertes, rules);

        long danger  = alertes.stream().filter(a -> a.niveau() == Niveau.DANGER).count();
        long warning = alertes.stream().filter(a -> a.niveau() == Niveau.WARNING).count();
        long info    = alertes.stream().filter(a -> a.niveau() == Niveau.INFO).count();
        return new AlerteDto.AlerteResponse(alertes, danger, warning, info, alertes.size());
    }

    // ─── Checks existants ─────────────────────────────────────────────────────

    private void checkExercicePrecedent(UUID eid, int year, List<Alerte> out) {
        Optional<ExerciceComptable> ex = exerciceRepo.findByEntrepriseIdAndAnnee(eid, year - 1);
        if (ex.isPresent() && ex.get().getStatut() == ExerciceComptable.Statut.OUVERT) {
            out.add(new Alerte("exercice-ouvert", Niveau.DANGER,
                    "Exercice " + (year - 1) + " non clôturé",
                    "L'exercice comptable " + (year - 1) + " est toujours ouvert. Pensez à le clôturer avant de continuer.",
                    "Exercices", "/dashboard/exercices"));
        }
    }

    private void checkBrouillons(UUID eid, List<Alerte> out, Map<String, NotificationRule> rules) {
        if (isDisabled(rules, "BROUILLONS")) return;
        long nb = ecritureRepo.countBrouillonsByEntrepriseId(eid);
        if (nb > 0) {
            out.add(new Alerte("brouillons", Niveau.WARNING,
                    nb + " écriture(s) en brouillon",
                    nb + " écriture(s) sont en attente de validation. Validez-les avant la clôture.",
                    "Écritures", "/dashboard/ecritures"));
        }
    }

    private void checkDotationsManquantes(UUID eid, int year, List<Alerte> out) {
        long nb = immoRepo.countActifsSansDotation(eid, year);
        if (nb > 0) {
            out.add(new Alerte("dotations-manquantes", Niveau.WARNING,
                    nb + " immobilisation(s) sans dotation " + year,
                    nb + " immobilisation(s) active(s) n'ont pas encore de dotation d'amortissement pour " + year + ".",
                    "Immobilisations", "/dashboard/immobilisations"));
        }
    }

    private void checkTvaMoisPrecedent(UUID eid, List<Alerte> out) {
        LocalDate today = LocalDate.now();
        LocalDate debut = today.minusMonths(1).withDayOfMonth(1);
        LocalDate fin   = debut.withDayOfMonth(debut.lengthOfMonth());
        boolean declare = tvaRepo.existsByEntrepriseIdAndPeriodeDebutAndPeriodeFin(eid, debut, fin);
        if (!declare) {
            String mois = debut.getMonth().getDisplayName(
                    java.time.format.TextStyle.FULL, java.util.Locale.FRENCH);
            out.add(new Alerte("tva-manquante", Niveau.WARNING,
                    "TVA " + mois + " " + debut.getYear() + " non déclarée",
                    "La déclaration TVA du mois de " + mois + " n'a pas encore été soumise.",
                    "TVA", "/dashboard/tva"));
        }
    }

    private void checkMisesEnDemeure(UUID eid, List<Alerte> out) {
        long nb = relanceRepo.countTiersAvecMiseEnDemeure(eid);
        if (nb > 0) {
            out.add(new Alerte("mises-en-demeure", Niveau.DANGER,
                    nb + " client(s) en mise en demeure",
                    nb + " client(s) ont reçu une relance de niveau 3 (mise en demeure) non résolue.",
                    "Relances", "/dashboard/relances"));
        }
    }

    private void checkBudgetsDépasses(UUID eid, int year, List<Alerte> out) {
        try {
            List<Object[]> rows = budgetRepo.findBudgetsDépasses(eid, year);
            if (!rows.isEmpty()) {
                out.add(new Alerte("budget-depasse", Niveau.WARNING,
                        rows.size() + " ligne(s) de budget dépassée(s)",
                        rows.size() + " compte(s) ont consommé plus que leur budget prévu pour " + year + ".",
                        "Budget", "/dashboard/budget"));
            }
        } catch (Exception ignored) {}
    }

    // ─── Nouveaux checks intelligents ─────────────────────────────────────────

    private void checkTresorerieCritique(UUID eid, List<Alerte> out, Map<String, NotificationRule> rules) {
        if (isDisabled(rules, "TRESORERIE_CRITIQUE")) return;
        try {
            BigDecimal seuil  = getSeuilOrDefault(rules, "TRESORERIE_CRITIQUE", BigDecimal.ZERO);
            BigDecimal solde  = ligneRepo.soldeTresorerie(eid);
            if (solde != null && solde.compareTo(seuil) <= 0) {
                Niveau niv = solde.compareTo(BigDecimal.ZERO) < 0 ? Niveau.DANGER : Niveau.WARNING;
                out.add(new Alerte("tresorerie-critique", niv,
                        "Trésorerie critique : " + formatMontant(solde),
                        "Le solde de trésorerie (" + formatMontant(solde) + ") est en dessous du seuil configuré (" + formatMontant(seuil) + ").",
                        "Trésorerie", "/dashboard/tresorerie-avancee"));
            }
        } catch (Exception ignored) {}
    }

    private void checkFacturesEcheancesImminentes(UUID eid, List<Alerte> out, Map<String, NotificationRule> rules) {
        if (isDisabled(rules, "FACTURES_ECHEANCE")) return;
        try {
            int joursAlerte = getSeuilOrDefault(rules, "FACTURES_ECHEANCE", BigDecimal.valueOf(7)).intValue();
            LocalDate limite = LocalDate.now().plusDays(joursAlerte);
            long nb = factureRepo.findAllEmises(eid).stream()
                    .filter(f -> {
                        LocalDate due = f.getDateEcheance() != null ? f.getDateEcheance()
                                : f.getDateFacture().plusDays(30);
                        return !due.isBefore(LocalDate.now()) && !due.isAfter(limite);
                    }).count();
            if (nb > 0) {
                out.add(new Alerte("echeances-imminentes", Niveau.WARNING,
                        nb + " facture(s) à échéance dans " + joursAlerte + " jours",
                        nb + " facture(s) arrivent à échéance dans les " + joursAlerte + " prochains jours.",
                        "Facturation", "/dashboard/facturation"));
            }
        } catch (Exception ignored) {}
    }

    private void checkPaiesNonComptabilisees(UUID eid, int year, List<Alerte> out,
                                              Map<String, NotificationRule> rules) {
        if (isDisabled(rules, "PAIES_NON_COMPTA")) return;
        try {
            long nb = paieRepo.findByEntrepriseIdAndExerciceOrderByMoisAsc(eid, year).stream()
                    .filter(p -> p.getStatut() == FeuillePaie.Statut.BROUILLON)
                    .count();
            if (nb > 0) {
                out.add(new Alerte("paies-brouillon", Niveau.WARNING,
                        nb + " fiche(s) de paie non comptabilisée(s)",
                        nb + " fiche(s) de paie de " + year + " sont en brouillon et n'ont pas été comptabilisées.",
                        "Paie", "/dashboard/paie"));
            }
        } catch (Exception ignored) {}
    }

    private void checkResultatNegatif(UUID eid, int year, List<Alerte> out,
                                       Map<String, NotificationRule> rules) {
        if (isDisabled(rules, "RESULTAT_NEGATIF")) return;
        try {
            LocalDate from = LocalDate.of(year, 1, 1);
            LocalDate to   = LocalDate.of(year, 12, 31);
            BigDecimal ca      = ligneRepo.totalProduitsYtd(eid, from, to);
            BigDecimal charges = ligneRepo.totalChargesYtd(eid, from, to);
            if (ca != null && charges != null && charges.compareTo(ca) > 0 && ca.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal deficit = charges.subtract(ca);
                out.add(new Alerte("resultat-negatif", Niveau.DANGER,
                        "Résultat déficitaire : -" + formatMontant(deficit),
                        "Les charges (" + formatMontant(charges) + ") dépassent les produits (" + formatMontant(ca) + ") pour " + year + ".",
                        "Tableau de bord", "/dashboard/pilotage-global"));
            }
        } catch (Exception ignored) {}
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Map<String, NotificationRule> loadRules(UUID eid) {
        return ruleRepo.findByEntrepriseIdOrderByType(eid).stream()
                .collect(Collectors.toMap(NotificationRule::getType, r -> r));
    }

    private boolean isDisabled(Map<String, NotificationRule> rules, String type) {
        NotificationRule r = rules.get(type);
        return r != null && !r.isEnabled();
    }

    private BigDecimal getSeuilOrDefault(Map<String, NotificationRule> rules, String type, BigDecimal def) {
        NotificationRule r = rules.get(type);
        return (r != null && r.getSeuil() != null) ? r.getSeuil() : def;
    }

    private String formatMontant(BigDecimal v) {
        if (v == null) return "0";
        long abs = Math.abs(v.longValue());
        String sign = v.compareTo(BigDecimal.ZERO) < 0 ? "-" : "";
        if (abs >= 1_000_000) return sign + String.format("%.1fM", abs / 1_000_000.0);
        if (abs >= 1_000)     return sign + String.format("%dK", abs / 1_000);
        return sign + v.toPlainString();
    }
}
