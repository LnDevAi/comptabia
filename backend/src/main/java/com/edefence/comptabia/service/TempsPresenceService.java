package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.temps.TempsPresenceDto;
import com.edefence.comptabia.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TempsPresenceService {

    // Heure de début de journée : retard si arrivée après 08:30
    private static final LocalTime HEURE_DEBUT = LocalTime.of(8, 30);

    private final PointageRepository  pointageRepo;
    private final AbsenceRepository   absenceRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final EntrepriseRepository  entrepriseRepo;

    // ─── Pointages ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TempsPresenceDto.PointageResponse> findPointages(UUID eid, int mois, int annee) {
        LocalDate debut = LocalDate.of(annee, mois, 1);
        LocalDate fin   = debut.withDayOfMonth(debut.lengthOfMonth());
        return pointageRepo.findByPeriode(eid, debut, fin).stream()
                .map(this::toPointageResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TempsPresenceDto.PointageResponse createPointage(UUID eid, TempsPresenceDto.PointageRequest req) {
        if (pointageRepo.existsByEntrepriseIdAndCollaborateurIdAndDatePointage(
                eid, req.collaborateurId(), req.datePointage())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un pointage existe déjà pour ce collaborateur à cette date");
        }
        Entreprise  entreprise    = loadEntreprise(eid);
        Utilisateur collaborateur = loadCollaborateur(req.collaborateurId(), eid);

        Pointage.Type type = req.heureArrivee().isAfter(HEURE_DEBUT)
                ? Pointage.Type.RETARD : Pointage.Type.NORMAL;

        BigDecimal heures = computeHeures(req.heureArrivee(), req.heureDepart());

        Pointage p = Pointage.builder()
                .entreprise(entreprise)
                .collaborateur(collaborateur)
                .datePointage(req.datePointage())
                .heureArrivee(req.heureArrivee())
                .heureDepart(req.heureDepart())
                .heuresTravaillees(heures)
                .type(type)
                .notes(req.notes())
                .build();

        return toPointageResponse(pointageRepo.save(p));
    }

    @Transactional
    public TempsPresenceDto.PointageResponse patchPointage(UUID id, UUID eid,
                                                            TempsPresenceDto.PointagePatchRequest req) {
        Pointage p = pointageRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Pointage introuvable"));

        if (req.heureDepart() != null) {
            p.setHeureDepart(req.heureDepart());
            p.setHeuresTravaillees(computeHeures(p.getHeureArrivee(), req.heureDepart()));
        }
        if (req.notes() != null) p.setNotes(req.notes());
        return toPointageResponse(pointageRepo.save(p));
    }

    @Transactional
    public void deletePointage(UUID id, UUID eid) {
        Pointage p = pointageRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Pointage introuvable"));
        pointageRepo.delete(p);
    }

    // ─── Absences ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TempsPresenceDto.AbsenceResponse> findAbsences(UUID eid) {
        return absenceRepo.findAllByEntreprise(eid).stream()
                .map(this::toAbsenceResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TempsPresenceDto.AbsenceResponse createAbsence(UUID eid, TempsPresenceDto.AbsenceRequest req) {
        if (req.dateFin().isBefore(req.dateDebut())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La date de fin doit être après la date de début");
        }
        Entreprise  entreprise    = loadEntreprise(eid);
        Utilisateur collaborateur = loadCollaborateur(req.collaborateurId(), eid);

        Absence a = Absence.builder()
                .entreprise(entreprise)
                .collaborateur(collaborateur)
                .dateDebut(req.dateDebut())
                .dateFin(req.dateFin())
                .typeAbsence(req.typeAbsence())
                .justificatif(req.justificatif())
                .notes(req.notes())
                .build();

        return toAbsenceResponse(absenceRepo.save(a));
    }

    @Transactional
    public TempsPresenceDto.AbsenceResponse approuver(UUID id, UUID eid) {
        Absence a = absenceRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Absence introuvable"));
        a.setStatut(Absence.Statut.APPROUVEE);
        return toAbsenceResponse(absenceRepo.save(a));
    }

    @Transactional
    public TempsPresenceDto.AbsenceResponse rejeter(UUID id, UUID eid) {
        Absence a = absenceRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Absence introuvable"));
        a.setStatut(Absence.Statut.REJETEE);
        return toAbsenceResponse(absenceRepo.save(a));
    }

    @Transactional
    public void deleteAbsence(UUID id, UUID eid) {
        Absence a = absenceRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Absence introuvable"));
        absenceRepo.delete(a);
    }

    // ─── État mensuel ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TempsPresenceDto.EtatMensuel etatMensuel(UUID eid, int mois, int annee) {
        LocalDate debut = LocalDate.of(annee, mois, 1);
        LocalDate fin   = debut.withDayOfMonth(debut.lengthOfMonth());

        List<Pointage> allPointages = pointageRepo.findByPeriode(eid, debut, fin);
        List<Absence>  allAbsences  = absenceRepo.findAllByEntreprise(eid).stream()
                .filter(a -> !a.getDateDebut().isAfter(fin) && !a.getDateFin().isBefore(debut))
                .filter(a -> a.getStatut() == Absence.Statut.APPROUVEE)
                .collect(Collectors.toList());

        // Grouper par collaborateur
        Map<UUID, List<Pointage>> byCollab = allPointages.stream()
                .collect(Collectors.groupingBy(p -> p.getCollaborateur().getId()));
        Map<UUID, List<Absence>> absByCollab = allAbsences.stream()
                .collect(Collectors.groupingBy(a -> a.getCollaborateur().getId()));

        Set<UUID> collabIds = new LinkedHashSet<>();
        collabIds.addAll(byCollab.keySet());
        collabIds.addAll(absByCollab.keySet());

        List<TempsPresenceDto.EtatCollaborateur> etats = collabIds.stream()
                .map(cid -> {
                    List<Pointage> pts = byCollab.getOrDefault(cid, List.of());
                    List<Absence>  abs = absByCollab.getOrDefault(cid, List.of());
                    String nom = pts.isEmpty()
                            ? abs.get(0).getCollaborateur().getNom()
                            : pts.get(0).getCollaborateur().getNom();
                    int nbRetards = (int) pts.stream().filter(p -> p.getType() == Pointage.Type.RETARD).count();
                    BigDecimal totalH = pts.stream()
                            .map(p -> p.getHeuresTravaillees() != null ? p.getHeuresTravaillees() : BigDecimal.ZERO)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new TempsPresenceDto.EtatCollaborateur(
                            cid, nom, pts.size(), nbRetards, abs.size(), totalH,
                            pts.stream().map(this::toPointageResponse).collect(Collectors.toList()),
                            abs.stream().map(this::toAbsenceResponse).collect(Collectors.toList())
                    );
                })
                .sorted(Comparator.comparing(TempsPresenceDto.EtatCollaborateur::collaborateurNom))
                .collect(Collectors.toList());

        return new TempsPresenceDto.EtatMensuel(mois, annee, etats);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private BigDecimal computeHeures(LocalTime arrivee, LocalTime depart) {
        if (arrivee == null || depart == null) return null;
        long minutes = Duration.between(arrivee, depart).toMinutes();
        if (minutes <= 0) return null;
        return BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
    }

    private Entreprise loadEntreprise(UUID eid) {
        return entrepriseRepo.findById(eid)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
    }

    private Utilisateur loadCollaborateur(UUID collabId, UUID eid) {
        Utilisateur u = utilisateurRepo.findById(collabId)
                .orElseThrow(() -> new EntityNotFoundException("Collaborateur introuvable : " + collabId));
        if (!u.getEntreprise().getId().equals(eid)) {
            throw new EntityNotFoundException("Collaborateur introuvable : " + collabId);
        }
        return u;
    }

    private TempsPresenceDto.PointageResponse toPointageResponse(Pointage p) {
        return new TempsPresenceDto.PointageResponse(
                p.getId(),
                p.getCollaborateur().getId(),
                p.getCollaborateur().getNom(),
                p.getDatePointage(),
                p.getHeureArrivee(),
                p.getHeureDepart(),
                p.getHeuresTravaillees(),
                p.getType(),
                p.getNotes()
        );
    }

    private TempsPresenceDto.AbsenceResponse toAbsenceResponse(Absence a) {
        return new TempsPresenceDto.AbsenceResponse(
                a.getId(),
                a.getCollaborateur().getId(),
                a.getCollaborateur().getNom(),
                a.getDateDebut(),
                a.getDateFin(),
                a.getTypeAbsence(),
                a.isJustificatif(),
                a.getNotes(),
                a.getStatut(),
                a.getCreatedAt() != null ? a.getCreatedAt().toString() : null
        );
    }
}
