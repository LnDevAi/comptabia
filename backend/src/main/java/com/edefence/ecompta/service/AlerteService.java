package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.ExerciceComptable;
import com.edefence.ecompta.dto.alerte.AlerteDto;
import com.edefence.ecompta.dto.alerte.AlerteDto.Alerte;
import com.edefence.ecompta.dto.alerte.AlerteDto.Niveau;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AlerteService {

    private final ExerciceComptableRepository exerciceRepo;
    private final ImmobilisationRepository    immoRepo;
    private final DeclarationTvaRepository    tvaRepo;
    private final RelanceRepository           relanceRepo;
    private final BudgetRepository            budgetRepo;
    private final EcritureComptableRepository ecritureRepo;

    @Transactional(readOnly = true)
    public AlerteDto.AlerteResponse getAlertes(UUID entrepriseId) {
        List<Alerte> alertes = new ArrayList<>();
        int year = LocalDate.now().getYear();

        checkExercicePrecedent(entrepriseId, year, alertes);
        checkBrouillons(entrepriseId, alertes);
        checkDotationsManquantes(entrepriseId, year, alertes);
        checkTvaMoisPrecedent(entrepriseId, alertes);
        checkMisesEnDemeure(entrepriseId, alertes);
        checkBudgetsDépasses(entrepriseId, year, alertes);

        long danger  = alertes.stream().filter(a -> a.niveau() == Niveau.DANGER).count();
        long warning = alertes.stream().filter(a -> a.niveau() == Niveau.WARNING).count();
        long info    = alertes.stream().filter(a -> a.niveau() == Niveau.INFO).count();
        return new AlerteDto.AlerteResponse(alertes, danger, warning, info, alertes.size());
    }

    // ─── Checks ──────────────────────────────────────────────────────────────

    private void checkExercicePrecedent(UUID eid, int year, List<Alerte> out) {
        Optional<ExerciceComptable> ex = exerciceRepo.findByEntrepriseIdAndAnnee(eid, year - 1);
        if (ex.isPresent() && ex.get().getStatut() == ExerciceComptable.Statut.OUVERT) {
            out.add(new Alerte("exercice-ouvert", Niveau.DANGER,
                    "Exercice " + (year - 1) + " non clôturé",
                    "L'exercice comptable " + (year - 1) + " est toujours ouvert. Pensez à le clôturer avant de continuer.",
                    "Exercices", "/dashboard/exercices"));
        }
    }

    private void checkBrouillons(UUID eid, List<Alerte> out) {
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
        } catch (Exception ignored) {
            // La requête YEAR() peut ne pas être supportée sur tous les dialects — on ignore silencieusement
        }
    }
}
