package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.evaluation.EvaluationDto;
import com.edefence.ecompta.dto.notification.NotificationDto;
import com.edefence.ecompta.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final ObjectifRepository    objectifRepo;
    private final EvaluationRepository  evaluationRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final EntrepriseRepository  entrepriseRepo;
    private final NotificationService   notificationService;

    // ── Objectifs ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EvaluationDto.ObjectifResponse> mesObjectifs(UUID eid, UUID uid, int annee) {
        return objectifRepo.findByCollaborateurAndAnnee(eid, uid, annee)
                .stream().map(this::toObjectifResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationDto.ObjectifResponse> allObjectifs(UUID eid, int annee) {
        return objectifRepo.findByAnnee(eid, annee).stream().map(this::toObjectifResponse).toList();
    }

    @Transactional
    public EvaluationDto.ObjectifResponse createObjectif(UUID eid, UUID uid, EvaluationDto.ObjectifSaveRequest req) {
        Utilisateur collab = utilisateurRepo.findById(uid)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        Objectif o = Objectif.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .collaborateur(collab)
                .annee(req.annee())
                .titre(req.titre())
                .description(req.description())
                .poids(req.poids())
                .build();
        return toObjectifResponse(objectifRepo.save(o));
    }

    @Transactional
    public EvaluationDto.ObjectifResponse createObjectifForCollab(UUID eid, UUID collabId, EvaluationDto.ObjectifSaveRequest req) {
        Utilisateur collab = utilisateurRepo.findById(collabId)
                .orElseThrow(() -> new EntityNotFoundException("Collaborateur introuvable"));
        Objectif o = Objectif.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .collaborateur(collab)
                .annee(req.annee())
                .titre(req.titre())
                .description(req.description())
                .poids(req.poids())
                .build();
        return toObjectifResponse(objectifRepo.save(o));
    }

    @Transactional
    public EvaluationDto.ObjectifResponse updateObjectif(UUID id, UUID eid, EvaluationDto.ObjectifSaveRequest req) {
        Objectif o = objectifRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Objectif introuvable"));
        o.setTitre(req.titre());
        o.setDescription(req.description());
        o.setPoids(req.poids());
        return toObjectifResponse(objectifRepo.save(o));
    }

    @Transactional
    public void deleteObjectif(UUID id, UUID eid) {
        objectifRepo.delete(objectifRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Objectif introuvable")));
    }

    // ── Evaluations ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<EvaluationDto.EvaluationResponse> mesEvaluations(UUID eid, UUID uid) {
        return evaluationRepo.findByCollaborateur(eid, uid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationDto.EvaluationResponse> allEvaluations(UUID eid) {
        return evaluationRepo.findAllByEntreprise(eid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<EvaluationDto.EvaluationResponse> soumises(UUID eid) {
        return evaluationRepo.findSoumises(eid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EvaluationDto.EvaluationResponse findOne(UUID id, UUID eid) {
        return toResponse(findOrThrow(id, eid));
    }

    @Transactional
    public EvaluationDto.EvaluationResponse create(UUID eid, EvaluationDto.EvaluationCreateRequest req) {
        Utilisateur collab = utilisateurRepo.findById(req.collaborateurId())
                .orElseThrow(() -> new EntityNotFoundException("Collaborateur introuvable"));
        Evaluation e = Evaluation.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .collaborateur(collab)
                .annee(req.annee())
                .periode(req.periode())
                .build();
        return toResponse(evaluationRepo.save(e));
    }

    @Transactional
    public EvaluationDto.EvaluationResponse saveLignes(UUID id, UUID eid, EvaluationDto.EvaluationSaveRequest req) {
        Evaluation e = findOrThrow(id, eid);
        if (e.getStatut() == Evaluation.Statut.VALIDEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Évaluation déjà validée");
        }
        e.getLignes().clear();
        for (EvaluationDto.LigneSaveRequest lr : req.lignes()) {
            Objectif obj = objectifRepo.findById(lr.objectifId())
                    .orElseThrow(() -> new EntityNotFoundException("Objectif introuvable : " + lr.objectifId()));
            LigneEvaluation ligne = LigneEvaluation.builder()
                    .evaluation(e)
                    .objectif(obj)
                    .note(lr.note())
                    .commentaire(lr.commentaire())
                    .build();
            e.getLignes().add(ligne);
        }
        if (req.commentaireGlobal() != null) e.setCommentaireGlobal(req.commentaireGlobal());
        e.setScoreGlobal(calculerScore(e));
        return toResponse(evaluationRepo.save(e));
    }

    @Transactional
    public EvaluationDto.EvaluationResponse soumettre(UUID id, UUID eid) {
        Evaluation e = findOrThrow(id, eid);
        if (e.getStatut() != Evaluation.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Évaluation déjà soumise");
        }
        e.setStatut(Evaluation.Statut.SOUMISE);
        evaluationRepo.save(e);
        notificationService.broadcast(eid, new NotificationDto(
                "EVALUATION",
                "Évaluation " + e.getPeriode() + " " + e.getAnnee()
                        + " soumise par " + e.getCollaborateur().getNom(),
                1, "INFO", "/dashboard/evaluations", Instant.now()));
        return toResponse(e);
    }

    @Transactional
    public EvaluationDto.EvaluationResponse valider(UUID id, UUID eid) {
        Evaluation e = findOrThrow(id, eid);
        if (e.getStatut() != Evaluation.Statut.SOUMISE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Évaluation non soumise");
        }
        e.setStatut(Evaluation.Statut.VALIDEE);
        return toResponse(evaluationRepo.save(e));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        Evaluation e = findOrThrow(id, eid);
        if (e.getStatut() != Evaluation.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Seule une évaluation en brouillon peut être supprimée");
        }
        evaluationRepo.delete(e);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private BigDecimal calculerScore(Evaluation e) {
        if (e.getLignes().isEmpty()) return BigDecimal.ZERO;
        BigDecimal total = BigDecimal.ZERO;
        int poidsTotal = 0;
        for (LigneEvaluation l : e.getLignes()) {
            int poids = l.getObjectif().getPoids();
            total = total.add(l.getNote().multiply(BigDecimal.valueOf(poids)));
            poidsTotal += poids;
        }
        if (poidsTotal == 0) return BigDecimal.ZERO;
        return total.divide(BigDecimal.valueOf(poidsTotal), 2, RoundingMode.HALF_UP);
    }

    private Evaluation findOrThrow(UUID id, UUID eid) {
        return evaluationRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Évaluation introuvable"));
    }

    private EvaluationDto.ObjectifResponse toObjectifResponse(Objectif o) {
        return new EvaluationDto.ObjectifResponse(
                o.getId(), o.getCollaborateur().getId(), o.getCollaborateur().getNom(),
                o.getAnnee(), o.getTitre(), o.getDescription(), o.getPoids(), o.getCreatedAt());
    }

    private EvaluationDto.EvaluationResponse toResponse(Evaluation e) {
        List<EvaluationDto.LigneResponse> lignes = e.getLignes().stream()
                .map(l -> new EvaluationDto.LigneResponse(
                        l.getId(), l.getObjectif().getId(), l.getObjectif().getTitre(),
                        l.getObjectif().getPoids(), l.getNote(), l.getCommentaire()))
                .toList();
        return new EvaluationDto.EvaluationResponse(
                e.getId(), e.getCollaborateur().getId(), e.getCollaborateur().getNom(),
                e.getAnnee(), e.getPeriode(), e.getStatut(),
                e.getCommentaireGlobal(), e.getScoreGlobal(), lignes, e.getCreatedAt());
    }
}
