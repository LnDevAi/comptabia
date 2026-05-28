package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Formation;
import com.edefence.comptabia.domain.InscriptionFormation;
import com.edefence.comptabia.domain.SessionFormation;
import com.edefence.comptabia.dto.formation.FormationDto;
import com.edefence.comptabia.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FormationService {

    private final FormationRepository         formationRepo;
    private final SessionFormationRepository  sessionRepo;
    private final InscriptionFormationRepository inscriptionRepo;
    private final EntrepriseRepository        entrepriseRepo;
    private final UtilisateurRepository       utilisateurRepo;

    // ── Formations ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FormationDto.FormationResponse> findAll(UUID eid) {
        return formationRepo.findAllByEntreprise(eid).stream().map(this::toFormationResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FormationDto.FormationResponse> findByAnnee(UUID eid, int annee) {
        return formationRepo.findByAnnee(eid, annee).stream().map(this::toFormationResponse).toList();
    }

    @Transactional
    public FormationDto.FormationResponse createFormation(UUID eid, FormationDto.FormationSaveRequest req) {
        Formation f = Formation.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .titre(req.titre())
                .domaine(req.domaine())
                .objectif(req.objectif())
                .annee(req.annee())
                .budgetPrevu(req.budgetPrevu())
                .build();
        return toFormationResponse(formationRepo.save(f));
    }

    @Transactional
    public FormationDto.FormationResponse updateFormation(UUID id, UUID eid, FormationDto.FormationUpdateRequest req) {
        Formation f = formationRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Formation introuvable"));
        if (req.titre()      != null) f.setTitre(req.titre());
        if (req.domaine()    != null) f.setDomaine(req.domaine());
        if (req.objectif()   != null) f.setObjectif(req.objectif());
        if (req.budgetPrevu()!= null) f.setBudgetPrevu(req.budgetPrevu());
        if (req.statut()     != null) f.setStatut(req.statut());
        return toFormationResponse(formationRepo.save(f));
    }

    @Transactional
    public void deleteFormation(UUID id, UUID eid) {
        formationRepo.delete(formationRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Formation introuvable")));
    }

    // ── Sessions ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FormationDto.SessionResponse> findSessions(UUID eid) {
        return sessionRepo.findAllByEntreprise(eid).stream().map(this::toSessionResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FormationDto.SessionResponse> findSessionsByFormation(UUID formationId) {
        return sessionRepo.findByFormation(formationId).stream().map(this::toSessionResponse).toList();
    }

    @Transactional
    public FormationDto.SessionResponse createSession(UUID eid, FormationDto.SessionSaveRequest req) {
        Formation formation = formationRepo.findByIdAndEntreprise(req.formationId(), eid)
                .orElseThrow(() -> new EntityNotFoundException("Formation introuvable"));
        SessionFormation s = SessionFormation.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .formation(formation)
                .dateDebut(req.dateDebut())
                .dateFin(req.dateFin())
                .lieu(req.lieu())
                .formateur(req.formateur())
                .nbPlaces(req.nbPlaces() > 0 ? req.nbPlaces() : 10)
                .coutReel(req.coutReel())
                .build();
        return toSessionResponse(sessionRepo.save(s));
    }

    @Transactional
    public FormationDto.SessionResponse updateSession(UUID id, UUID eid, FormationDto.SessionUpdateRequest req) {
        SessionFormation s = sessionRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Session introuvable"));
        if (req.dateDebut()  != null) s.setDateDebut(req.dateDebut());
        if (req.dateFin()    != null) s.setDateFin(req.dateFin());
        if (req.lieu()       != null) s.setLieu(req.lieu());
        if (req.formateur()  != null) s.setFormateur(req.formateur());
        if (req.nbPlaces()   != null) s.setNbPlaces(req.nbPlaces());
        if (req.coutReel()   != null) s.setCoutReel(req.coutReel());
        if (req.statut()     != null) s.setStatut(req.statut());
        return toSessionResponse(sessionRepo.save(s));
    }

    @Transactional
    public void deleteSession(UUID id, UUID eid) {
        sessionRepo.delete(sessionRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Session introuvable")));
    }

    // ── Inscriptions ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FormationDto.InscriptionResponse> findInscriptions(UUID sessionId) {
        return inscriptionRepo.findBySession(sessionId).stream().map(this::toInscriptionResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FormationDto.InscriptionResponse> mesFormations(UUID eid, UUID collabId) {
        return inscriptionRepo.findByEntrepriseAndCollaborateur(eid, collabId)
                .stream().map(this::toInscriptionResponse).toList();
    }

    @Transactional
    public FormationDto.InscriptionResponse inscrire(UUID sessionId, UUID eid, FormationDto.InscriptionSaveRequest req) {
        SessionFormation session = sessionRepo.findByIdAndEntreprise(sessionId, eid)
                .orElseThrow(() -> new EntityNotFoundException("Session introuvable"));
        if (inscriptionRepo.existsBySessionIdAndCollaborateurId(sessionId, req.collaborateurId()))
            throw new IllegalStateException("Ce collaborateur est déjà inscrit à cette session");
        long nbInscrits = sessionRepo.countInscrits(sessionId);
        if (nbInscrits >= session.getNbPlaces())
            throw new IllegalStateException("Plus de places disponibles");
        InscriptionFormation i = InscriptionFormation.builder()
                .session(session)
                .collaborateur(utilisateurRepo.getReferenceById(req.collaborateurId()))
                .build();
        return toInscriptionResponse(inscriptionRepo.save(i));
    }

    @Transactional
    public FormationDto.InscriptionResponse updateInscription(UUID id, UUID eid, FormationDto.InscriptionUpdateRequest req) {
        InscriptionFormation i = inscriptionRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Inscription introuvable"));
        if (req.statut()     != null) i.setStatut(req.statut());
        if (req.note()       != null) i.setNote(req.note());
        if (req.commentaire()!= null) i.setCommentaire(req.commentaire());
        return toInscriptionResponse(inscriptionRepo.save(i));
    }

    @Transactional
    public void desinscrire(UUID id, UUID eid) {
        inscriptionRepo.delete(inscriptionRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Inscription introuvable")));
    }

    // ── Bilan ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FormationDto.BilanCollaborateur> bilan(UUID eid) {
        List<SessionFormation> sessions = sessionRepo.findAllByEntreprise(eid);
        Map<UUID, List<InscriptionFormation>> byCollab = new LinkedHashMap<>();
        for (SessionFormation s : sessions) {
            for (InscriptionFormation i : inscriptionRepo.findBySession(s.getId())) {
                byCollab.computeIfAbsent(i.getCollaborateur().getId(), k -> new ArrayList<>()).add(i);
            }
        }
        List<FormationDto.BilanCollaborateur> bilans = new ArrayList<>();
        for (var entry : byCollab.entrySet()) {
            List<InscriptionFormation> inscriptions = entry.getValue();
            InscriptionFormation first = inscriptions.get(0);
            String nom = first.getCollaborateur().getNom();
            int nbCert = (int) inscriptions.stream().filter(i -> i.getStatut() == InscriptionFormation.Statut.CERTIFIE).count();
            List<String> domaines = inscriptions.stream()
                    .map(i -> i.getSession().getFormation().getDomaine())
                    .distinct().sorted().toList();
            BigDecimal noteMoy = inscriptions.stream()
                    .map(InscriptionFormation::getNote)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long avecNote = inscriptions.stream().filter(i -> i.getNote() != null).count();
            if (avecNote > 0) noteMoy = noteMoy.divide(BigDecimal.valueOf(avecNote), 1, RoundingMode.HALF_UP);
            else noteMoy = null;
            bilans.add(new FormationDto.BilanCollaborateur(
                    entry.getKey(), nom, inscriptions.size(), nbCert, domaines, noteMoy));
        }
        bilans.sort(Comparator.comparing(FormationDto.BilanCollaborateur::collaborateurNom));
        return bilans;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private FormationDto.FormationResponse toFormationResponse(Formation f) {
        int nbSessions = sessionRepo.findByFormation(f.getId()).size();
        return new FormationDto.FormationResponse(f.getId(), f.getTitre(), f.getDomaine(),
                f.getObjectif(), f.getAnnee(), f.getBudgetPrevu(), f.getStatut(), nbSessions, f.getCreatedAt());
    }

    private FormationDto.SessionResponse toSessionResponse(SessionFormation s) {
        long nbInscrits = sessionRepo.countInscrits(s.getId());
        return new FormationDto.SessionResponse(s.getId(), s.getFormation().getId(),
                s.getFormation().getTitre(), s.getDateDebut(), s.getDateFin(),
                s.getLieu(), s.getFormateur(), s.getNbPlaces(), nbInscrits,
                s.getCoutReel(), s.getStatut(), s.getCreatedAt());
    }

    private FormationDto.InscriptionResponse toInscriptionResponse(InscriptionFormation i) {
        return new FormationDto.InscriptionResponse(i.getId(), i.getSession().getId(),
                i.getCollaborateur().getId(), i.getCollaborateur().getNom(),
                i.getStatut(), i.getNote(), i.getCommentaire(), i.getCreatedAt());
    }
}
