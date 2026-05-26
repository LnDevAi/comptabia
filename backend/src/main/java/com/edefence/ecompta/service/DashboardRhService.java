package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.FeuillePaie;
import com.edefence.ecompta.dto.dashboard.DashboardRhDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
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

    // ─── Comparatif N vs N-1 ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardRhDto.ComparatifRh buildComparatif(UUID eid, int anneeN) {
        int anneeN1 = anneeN - 1;
        LocalDate debutN  = LocalDate.of(anneeN,  1,  1);
        LocalDate finN    = LocalDate.of(anneeN,  12, 31);
        LocalDate debutN1 = LocalDate.of(anneeN1, 1,  1);
        LocalDate finN1   = LocalDate.of(anneeN1, 12, 31);

        BigDecimal massN  = feuillePaieRepo.sumMasseSalarialeByExercice(eid, anneeN);
        BigDecimal massN1 = feuillePaieRepo.sumMasseSalarialeByExercice(eid, anneeN1);
        BigDecimal netN   = feuillePaieRepo.sumNetAPayerByExercice(eid, anneeN);
        BigDecimal netN1  = feuillePaieRepo.sumNetAPayerByExercice(eid, anneeN1);

        long congesNbN  = congeRepo.countApprouveesInPeriod(eid, debutN, finN);
        long congesNbN1 = congeRepo.countApprouveesInPeriod(eid, debutN1, finN1);
        BigDecimal congesJoursN  = congeRepo.sumJoursApprouvesInPeriod(eid, debutN, finN);
        BigDecimal congesJoursN1 = congeRepo.sumJoursApprouvesInPeriod(eid, debutN1, finN1);

        long notesNbN  = noteFraisRepo.countRembourseesInPeriod(eid, debutN, finN);
        long notesNbN1 = noteFraisRepo.countRembourseesInPeriod(eid, debutN1, finN1);
        BigDecimal notesMontN  = noteFraisRepo.sumMontantRembourseesInPeriod(eid, debutN, finN);
        BigDecimal notesMontN1 = noteFraisRepo.sumMontantRembourseesInPeriod(eid, debutN1, finN1);

        List<FeuillePaie> fpN  = feuillePaieRepo.findByEntrepriseIdAndExerciceOrderByMoisAsc(eid, anneeN);
        List<FeuillePaie> fpN1 = feuillePaieRepo.findByEntrepriseIdAndExerciceOrderByMoisAsc(eid, anneeN1);

        return new DashboardRhDto.ComparatifRh(
                anneeN, anneeN1,
                section(massN, massN1),
                section(netN, netN1),
                section(congesJoursN, congesJoursN1),
                section(BigDecimal.valueOf(congesNbN), BigDecimal.valueOf(congesNbN1)),
                section(notesMontN, notesMontN1),
                section(BigDecimal.valueOf(notesNbN), BigDecimal.valueOf(notesNbN1)),
                toMensuel(fpN),
                toMensuel(fpN1)
        );
    }

    private DashboardRhDto.ComparatifSection section(BigDecimal n, BigDecimal n1) {
        BigDecimal variation = n.subtract(n1);
        double pct = n1.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                : variation.divide(n1, 6, RoundingMode.HALF_UP)
                           .multiply(BigDecimal.valueOf(100))
                           .doubleValue();
        return new DashboardRhDto.ComparatifSection(n, n1, variation, pct);
    }

    private List<DashboardRhDto.PaiesMensuel> toMensuel(List<FeuillePaie> fps) {
        return fps.stream().map(f -> new DashboardRhDto.PaiesMensuel(
                f.getMois(), f.getMasseSalarialeBrute(), f.getNetAPayer(), f.getNbSalaries()
        )).toList();
    }
}
