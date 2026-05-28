package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.reporting.ReportingDto;
import com.edefence.comptabia.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportingService {

    private final UtilisateurRepository    utilisateurRepo;
    private final CongeRepository          congeRepo;
    private final AbsenceRepository        absenceRepo;
    private final NoteFraisRepository      noteFraisRepo;
    private final PretRepository           pretRepo;
    private final DocumentRhRepository     docRhRepo;
    private final OffreEmploiRepository    offreRepo;
    private final OnboardingPlanRepository planRepo;
    private final PointageRepository       pointageRepo;

    @Transactional(readOnly = true)
    public ReportingDto.SyntheseRh syntheseRh(UUID eid) {
        long nbCollab        = utilisateurRepo.countActifs(eid);
        long congesEnAttente = congeRepo.countSoumises(eid);
        long notesEnAttente  = noteFraisRepo.countSoumises(eid);
        BigDecimal montantNotes = noteFraisRepo.sumMontantSoumises(eid);

        long absencesEnAttente = absenceRepo.findAllByEntreprise(eid).stream()
                .filter(a -> a.getStatut() == Absence.Statut.EN_ATTENTE).count();

        List<Pret> prets = pretRepo.findAllByEntreprise(eid);
        long pretsEnCours = prets.stream().filter(p -> p.getStatut() == Pret.Statut.EN_COURS).count();
        BigDecimal encours = prets.stream()
                .filter(p -> p.getStatut() == Pret.Statut.EN_COURS)
                .map(p -> {
                    long nbPrel = p.getEcheances().stream()
                            .filter(e -> e.getStatut() == EcheancePret.Statut.PRELEVE).count();
                    return p.getMontantEcheance().multiply(
                            BigDecimal.valueOf(p.getNbEcheances() - nbPrel));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long docsExpirant = docRhRepo.findExpirantAvant(eid, LocalDate.now().plusDays(30)).size();

        long offresOuvertes = offreRepo.findAllByEntreprise(eid).stream()
                .filter(o -> o.getStatut() == OffreEmploi.Statut.OUVERTE).count();

        long onboardingEnCours = planRepo.findAllByEntreprise(eid).stream()
                .filter(p -> p.getStatut() == OnboardingPlan.Statut.EN_COURS).count();

        return new ReportingDto.SyntheseRh(
                nbCollab, congesEnAttente, absencesEnAttente,
                notesEnAttente, montantNotes != null ? montantNotes : BigDecimal.ZERO,
                pretsEnCours, encours, docsExpirant, offresOuvertes, onboardingEnCours
        );
    }

    @Transactional(readOnly = true)
    public ReportingDto.RapportConges rapportConges(UUID eid, int annee) {
        LocalDate debut = LocalDate.of(annee, 1, 1);
        LocalDate fin   = LocalDate.of(annee, 12, 31);
        List<Conge> conges = congeRepo.findApprouveesInRange(eid, debut, fin);
        // include all statuts by fetching all
        List<Conge> all = congeRepo.findAllByEntreprise(eid).stream()
                .filter(c -> c.getDateDebut().getYear() == annee || c.getDateFin().getYear() == annee)
                .collect(Collectors.toList());
        List<ReportingDto.LigneConge> lignes = all.stream()
                .map(c -> new ReportingDto.LigneConge(
                        c.getCollaborateur().getNom(),
                        c.getType().name(),
                        c.getDateDebut().toString(),
                        c.getDateFin().toString(),
                        c.getNombreJours(),
                        c.getStatut().name()))
                .collect(Collectors.toList());
        int nbApprouves = (int) all.stream().filter(c -> c.getStatut() == Conge.Statut.APPROUVEE).count();
        int totalJours  = all.stream().filter(c -> c.getStatut() == Conge.Statut.APPROUVEE)
                .mapToInt(Conge::getNombreJours).sum();
        return new ReportingDto.RapportConges(annee, all.size(), nbApprouves, totalJours, lignes);
    }

    @Transactional(readOnly = true)
    public ReportingDto.RapportPresences rapportPresences(UUID eid, int mois, int annee) {
        LocalDate debut = LocalDate.of(annee, mois, 1);
        LocalDate fin   = debut.with(TemporalAdjusters.lastDayOfMonth());

        Map<UUID, List<Pointage>> byCollab = pointageRepo.findByPeriode(eid, debut, fin).stream()
                .collect(Collectors.groupingBy(p -> p.getCollaborateur().getId()));

        List<ReportingDto.LignePresence> lignes = byCollab.entrySet().stream()
                .map(e -> {
                    List<Pointage> pts = e.getValue();
                    String nom = pts.get(0).getCollaborateur().getNom();
                    int nbJours  = pts.size();
                    int nbRetards = (int) pts.stream().filter(p -> p.getType() == Pointage.Type.RETARD).count();
                    double heures = pts.stream()
                            .mapToDouble(p -> p.getHeuresTravaillees() != null ? p.getHeuresTravaillees().doubleValue() : 0)
                            .sum();
                    long nbAbsences = absenceRepo.countApprouvees(eid, e.getKey(), debut, fin);
                    return new ReportingDto.LignePresence(nom, nbJours, nbRetards, (int) nbAbsences, heures);
                })
                .sorted(Comparator.comparing(ReportingDto.LignePresence::collaborateur))
                .collect(Collectors.toList());

        return new ReportingDto.RapportPresences(mois, annee, lignes);
    }

    @Transactional(readOnly = true)
    public ReportingDto.RapportNotesFrais rapportNotesFrais(UUID eid, int annee) {
        List<NoteFrais> all = noteFraisRepo.findAllByEntreprise(eid).stream()
                .filter(n -> n.getDateDebut().getYear() == annee || n.getDateFin().getYear() == annee)
                .collect(Collectors.toList());
        BigDecimal total = all.stream()
                .filter(n -> n.getStatut() == NoteFrais.Statut.REMBOURSEE || n.getStatut() == NoteFrais.Statut.APPROUVEE)
                .map(NoteFrais::getMontant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        List<ReportingDto.LigneNoteFrais> lignes = all.stream()
                .map(n -> new ReportingDto.LigneNoteFrais(
                        n.getCollaborateur().getNom(),
                        n.getCategorie().name(),
                        n.getTitre(),
                        n.getMontant(),
                        n.getDateDebut().toString(),
                        n.getStatut().name()))
                .collect(Collectors.toList());
        return new ReportingDto.RapportNotesFrais(annee, all.size(), total, lignes);
    }

    @Transactional(readOnly = true)
    public ReportingDto.RapportPrets rapportPrets(UUID eid) {
        List<Pret> prets = pretRepo.findAllByEntreprise(eid);
        List<ReportingDto.LignePret> lignes = prets.stream()
                .map(p -> {
                    int nbPrel = (int) p.getEcheances().stream()
                            .filter(e -> e.getStatut() == EcheancePret.Statut.PRELEVE).count();
                    BigDecimal restant = p.getMontantEcheance()
                            .multiply(BigDecimal.valueOf(Math.max(0, p.getNbEcheances() - nbPrel)));
                    return new ReportingDto.LignePret(
                            p.getCollaborateur().getNom(),
                            p.getTypePret().name(),
                            p.getMontant(), p.getNbEcheances(), nbPrel, restant,
                            p.getStatut().name());
                })
                .collect(Collectors.toList());
        BigDecimal totalEncours = lignes.stream()
                .filter(l -> "EN_COURS".equals(l.statut()))
                .map(ReportingDto.LignePret::restantDu)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return new ReportingDto.RapportPrets(lignes, totalEncours);
    }
}
