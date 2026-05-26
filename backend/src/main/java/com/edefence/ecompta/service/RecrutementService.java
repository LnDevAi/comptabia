package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.recrutement.RecrutementDto;
import com.edefence.ecompta.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecrutementService {

    private final OffreEmploiRepository    offreRepo;
    private final CandidatureRepository   candidatureRepo;
    private final OnboardingPlanRepository planRepo;
    private final OnboardingTacheRepository tacheRepo;
    private final EntrepriseRepository    entrepriseRepo;
    private final UtilisateurRepository   utilisateurRepo;

    // ── Offres ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecrutementDto.OffreResponse> findOffres(UUID eid) {
        return offreRepo.findAllByEntreprise(eid).stream()
                .map(o -> toOffreResponse(o, candidatureRepo.findByOffre(o.getId()).size()))
                .collect(Collectors.toList());
    }

    @Transactional
    public RecrutementDto.OffreResponse createOffre(UUID eid, RecrutementDto.OffreRequest req) {
        Entreprise e = loadEntreprise(eid);
        OffreEmploi o = OffreEmploi.builder()
                .entreprise(e)
                .titre(req.titre())
                .departement(req.departement())
                .description(req.description())
                .typeContrat(req.typeContrat())
                .nbPostes(req.nbPostes() > 0 ? req.nbPostes() : 1)
                .dateOuverture(req.dateOuverture())
                .dateCloture(req.dateCloture())
                .build();
        return toOffreResponse(offreRepo.save(o), 0);
    }

    @Transactional
    public RecrutementDto.OffreResponse updateStatutOffre(UUID id, UUID eid, OffreEmploi.Statut statut) {
        OffreEmploi o = offreRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Offre introuvable"));
        o.setStatut(statut);
        long nb = candidatureRepo.findByOffre(id).size();
        return toOffreResponse(offreRepo.save(o), nb);
    }

    @Transactional
    public void deleteOffre(UUID id, UUID eid) {
        OffreEmploi o = offreRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Offre introuvable"));
        offreRepo.delete(o);
    }

    // ── Candidatures ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecrutementDto.CandidatureResponse> findCandidatures(UUID eid) {
        return candidatureRepo.findAllByEntreprise(eid).stream()
                .map(this::toCandidatureResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RecrutementDto.CandidatureResponse createCandidature(UUID eid, RecrutementDto.CandidatureRequest req) {
        Entreprise e = loadEntreprise(eid);
        OffreEmploi offre = req.offreId() != null
                ? offreRepo.findByIdAndEntreprise(req.offreId(), eid)
                    .orElseThrow(() -> new EntityNotFoundException("Offre introuvable"))
                : null;
        Candidature c = Candidature.builder()
                .entreprise(e)
                .offre(offre)
                .nomCandidat(req.nomCandidat())
                .emailCandidat(req.emailCandidat())
                .telephone(req.telephone())
                .notes(req.notes())
                .build();
        return toCandidatureResponse(candidatureRepo.save(c));
    }

    @Transactional
    public RecrutementDto.CandidatureResponse avancerStatut(UUID id, UUID eid, Candidature.Statut statut) {
        Candidature c = candidatureRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Candidature introuvable"));
        c.setStatut(statut);
        return toCandidatureResponse(candidatureRepo.save(c));
    }

    @Transactional
    public void deleteCandidature(UUID id, UUID eid) {
        Candidature c = candidatureRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Candidature introuvable"));
        candidatureRepo.delete(c);
    }

    // ── Onboarding ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RecrutementDto.PlanResponse> findPlans(UUID eid) {
        return planRepo.findAllByEntreprise(eid).stream()
                .map(this::toPlanResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public RecrutementDto.PlanResponse createPlan(UUID eid, RecrutementDto.PlanRequest req) {
        Entreprise  e    = loadEntreprise(eid);
        Utilisateur collab = utilisateurRepo.findById(req.collaborateurId())
                .orElseThrow(() -> new EntityNotFoundException("Collaborateur introuvable"));
        if (!collab.getEntreprise().getId().equals(eid)) {
            throw new EntityNotFoundException("Collaborateur introuvable");
        }
        OnboardingPlan plan = OnboardingPlan.builder()
                .entreprise(e)
                .collaborateur(collab)
                .titre(req.titre() != null && !req.titre().isBlank() ? req.titre() : "Plan d'onboarding — " + collab.getNom())
                .dateEmbauche(req.dateEmbauche())
                .build();
        return toPlanResponse(planRepo.save(plan));
    }

    @Transactional
    public RecrutementDto.PlanResponse addTache(UUID planId, UUID eid, RecrutementDto.TacheRequest req) {
        OnboardingPlan plan = planRepo.findByIdAndEntreprise(planId, eid)
                .orElseThrow(() -> new EntityNotFoundException("Plan introuvable"));
        OnboardingTache t = OnboardingTache.builder()
                .plan(plan)
                .titre(req.titre())
                .description(req.description())
                .categorie(req.categorie())
                .ordre(req.ordre())
                .dateLimite(req.dateLimite())
                .build();
        plan.getTaches().add(t);
        return toPlanResponse(planRepo.save(plan));
    }

    @Transactional
    public RecrutementDto.PlanResponse toggleTache(UUID planId, UUID tacheId, UUID eid) {
        OnboardingPlan plan = planRepo.findByIdAndEntreprise(planId, eid)
                .orElseThrow(() -> new EntityNotFoundException("Plan introuvable"));
        OnboardingTache tache = tacheRepo.findByIdAndEntreprise(tacheId, eid)
                .orElseThrow(() -> new EntityNotFoundException("Tâche introuvable"));
        tache.setTerminee(!tache.isTerminee());
        tacheRepo.save(tache);

        // Clôturer le plan si toutes les tâches sont terminées
        boolean toutTermine = plan.getTaches().stream().allMatch(OnboardingTache::isTerminee);
        if (toutTermine && !plan.getTaches().isEmpty()) {
            plan.setStatut(OnboardingPlan.Statut.TERMINE);
        } else {
            plan.setStatut(OnboardingPlan.Statut.EN_COURS);
        }
        return toPlanResponse(planRepo.save(plan));
    }

    @Transactional
    public void deleteTache(UUID planId, UUID tacheId, UUID eid) {
        OnboardingPlan plan = planRepo.findByIdAndEntreprise(planId, eid)
                .orElseThrow(() -> new EntityNotFoundException("Plan introuvable"));
        plan.getTaches().removeIf(t -> t.getId().equals(tacheId));
        planRepo.save(plan);
    }

    @Transactional
    public void deletePlan(UUID id, UUID eid) {
        OnboardingPlan plan = planRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Plan introuvable"));
        planRepo.delete(plan);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Entreprise loadEntreprise(UUID eid) {
        return entrepriseRepo.findById(eid)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
    }

    private RecrutementDto.OffreResponse toOffreResponse(OffreEmploi o, long nbCandidatures) {
        return new RecrutementDto.OffreResponse(
                o.getId(), o.getTitre(), o.getDepartement(), o.getDescription(),
                o.getTypeContrat(), o.getNbPostes(), o.getStatut(),
                o.getDateOuverture(), o.getDateCloture(), nbCandidatures,
                o.getCreatedAt() != null ? o.getCreatedAt().toString() : null
        );
    }

    private RecrutementDto.CandidatureResponse toCandidatureResponse(Candidature c) {
        return new RecrutementDto.CandidatureResponse(
                c.getId(),
                c.getOffre() != null ? c.getOffre().getId() : null,
                c.getOffre() != null ? c.getOffre().getTitre() : null,
                c.getNomCandidat(), c.getEmailCandidat(), c.getTelephone(),
                c.getStatut(), c.getNotes(),
                c.getCreatedAt() != null ? c.getCreatedAt().toString() : null
        );
    }

    private RecrutementDto.PlanResponse toPlanResponse(OnboardingPlan p) {
        List<RecrutementDto.TacheResponse> taches = p.getTaches().stream()
                .map(t -> new RecrutementDto.TacheResponse(
                        t.getId(), t.getTitre(), t.getDescription(),
                        t.getCategorie(), t.getOrdre(), t.isTerminee(), t.getDateLimite()))
                .collect(Collectors.toList());
        int nbTerminees = (int) p.getTaches().stream().filter(OnboardingTache::isTerminee).count();
        return new RecrutementDto.PlanResponse(
                p.getId(),
                p.getCollaborateur().getId(),
                p.getCollaborateur().getNom(),
                p.getTitre(), p.getDateEmbauche(), p.getStatut(),
                p.getTaches().size(), nbTerminees, taches,
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null
        );
    }
}
