package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.FeuillePaie;
import com.edefence.ecompta.dto.dashboard.DashboardRhDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardRhService {

    private final UtilisateurRepository          utilisateurRepo;
    private final FeuillePaieRepository          feuillePaieRepo;
    private final CongeRepository                congeRepo;
    private final DossierDisciplinaireRepository disciplineRepo;
    private final SessionFormationRepository     sessionFormationRepo;
    private final InscriptionFormationRepository inscriptionRepo;
    private final EvaluationRepository          evaluationRepo;
    private final NoteFraisRepository           noteFraisRepo;

    @Transactional(readOnly = true)
    public DashboardRhDto.DashboardRh buildDashboard(UUID eid) {
        LocalDate today = LocalDate.now();
        int annee = today.getYear();
        int mois  = today.getMonthValue();

        return new DashboardRhDto.DashboardRh(
                buildEffectifs(eid),
                buildPaie(eid, annee, mois),
                buildConges(eid, today),
                buildDiscipline(eid),
                buildFormation(eid),
                buildEvaluations(eid),
                buildNotesFrais(eid)
        );
    }

    private DashboardRhDto.KpiEffectifs buildEffectifs(UUID eid) {
        return new DashboardRhDto.KpiEffectifs(utilisateurRepo.countActifs(eid));
    }

    private DashboardRhDto.KpiPaie buildPaie(UUID eid, int annee, int mois) {
        Optional<FeuillePaie> opt = feuillePaieRepo.findByEntrepriseIdAndExerciceAndMois(eid, annee, mois);
        if (opt.isEmpty()) {
            // Essayer le mois précédent
            int moisPrec  = mois == 1 ? 12 : mois - 1;
            int anneePrec = mois == 1 ? annee - 1 : annee;
            opt = feuillePaieRepo.findByEntrepriseIdAndExerciceAndMois(eid, anneePrec, moisPrec);
        }
        return opt.map(f -> new DashboardRhDto.KpiPaie(
                true, f.getMois(), f.getExercice(),
                f.getNbSalaries(), f.getMasseSalarialeBrute(),
                f.getNetAPayer(), f.getCotisationsPatronales()
        )).orElse(new DashboardRhDto.KpiPaie(
                false, mois, annee, 0,
                BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
        ));
    }

    private DashboardRhDto.KpiConges buildConges(UUID eid, LocalDate today) {
        return new DashboardRhDto.KpiConges(
                congeRepo.countSoumises(eid),
                congeRepo.countEnCours(eid, today)
        );
    }

    private DashboardRhDto.KpiDiscipline buildDiscipline(UUID eid) {
        return new DashboardRhDto.KpiDiscipline(disciplineRepo.countEnCours(eid));
    }

    private DashboardRhDto.KpiFormation buildFormation(UUID eid) {
        return new DashboardRhDto.KpiFormation(
                sessionFormationRepo.countEnCours(eid),
                inscriptionRepo.countInscritsActifs(eid)
        );
    }

    private DashboardRhDto.KpiEvaluations buildEvaluations(UUID eid) {
        return new DashboardRhDto.KpiEvaluations(evaluationRepo.countSoumises(eid));
    }

    private DashboardRhDto.KpiNotesFrais buildNotesFrais(UUID eid) {
        return new DashboardRhDto.KpiNotesFrais(
                noteFraisRepo.countSoumises(eid),
                noteFraisRepo.sumMontantSoumises(eid)
        );
    }
}
