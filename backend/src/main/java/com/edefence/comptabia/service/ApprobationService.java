package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Approbation;
import com.edefence.comptabia.domain.EcritureComptable;
import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.approbation.ApprobationDto;
import com.edefence.comptabia.dto.notification.NotificationDto;
import com.edefence.comptabia.repository.ApprobationRepository;
import com.edefence.comptabia.repository.EcritureComptableRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ApprobationService {

    private final EcritureComptableRepository ecritureRepo;
    private final ApprobationRepository       approbationRepo;
    private final NotificationService         notificationService;

    // ─── Soumettre ───────────────────────────────────────────────────────────

    @Transactional
    public void soumettre(UUID ecritureId, UUID eid, Utilisateur auteur) {
        EcritureComptable e = findOrThrow(ecritureId, eid);
        if (e.getStatut() != EcritureComptable.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une écriture en brouillon peut être soumise à validation");
        }
        e.setStatut(EcritureComptable.Statut.EN_ATTENTE);
        ecritureRepo.save(e);

        notificationService.broadcast(eid, new NotificationDto(
                "APPROBATION",
                "Écriture " + e.getNumeroPiece() + " soumise à validation par " + auteur.getNom(),
                1, "WARNING",
                "/dashboard/ecritures?statut=EN_ATTENTE",
                Instant.now()));
    }

    // ─── Décision ────────────────────────────────────────────────────────────

    @Transactional
    public ApprobationDto.ApprobationResponse decider(UUID ecritureId, UUID eid,
                                                       Utilisateur approbateur,
                                                       ApprobationDto.DecisionRequest req) {
        EcritureComptable e = findOrThrow(ecritureId, eid);
        if (e.getStatut() != EcritureComptable.Statut.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "L'écriture n'est pas en attente de validation");
        }

        EcritureComptable.Statut nouveauStatut =
                req.decision() == Approbation.Decision.APPROUVEE
                        ? EcritureComptable.Statut.VALIDEE
                        : EcritureComptable.Statut.REJETEE;
        e.setStatut(nouveauStatut);
        ecritureRepo.save(e);

        Approbation approbation = Approbation.builder()
                .ecriture(e)
                .entreprise(e.getEntreprise())
                .approbateur(approbateur)
                .decision(req.decision())
                .commentaire(req.commentaire())
                .build();
        approbationRepo.save(approbation);

        String severity = req.decision() == Approbation.Decision.APPROUVEE ? "INFO" : "DANGER";
        String msg = req.decision() == Approbation.Decision.APPROUVEE
                ? "Écriture " + e.getNumeroPiece() + " approuvée par " + approbateur.getNom()
                : "Écriture " + e.getNumeroPiece() + " rejetée par " + approbateur.getNom()
                  + (req.commentaire() != null ? " : " + req.commentaire() : "");

        notificationService.broadcast(eid, new NotificationDto(
                "APPROBATION", msg, 1, severity,
                "/dashboard/ecritures", Instant.now()));

        return toResponse(approbation);
    }

    // ─── Annuler soumission (retour en brouillon) ─────────────────────────────

    @Transactional
    public void annuler(UUID ecritureId, UUID eid) {
        EcritureComptable e = findOrThrow(ecritureId, eid);
        if (e.getStatut() != EcritureComptable.Statut.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une écriture en attente peut être rappelée");
        }
        e.setStatut(EcritureComptable.Statut.BROUILLON);
        ecritureRepo.save(e);
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ApprobationDto.EcritureEnAttenteResume> listeEnAttente(UUID eid) {
        return ecritureRepo.findEnAttente(eid).stream()
                .map(this::toResume)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ApprobationDto.ApprobationResponse> historique(UUID ecritureId, UUID eid) {
        return approbationRepo.findByEcriture(ecritureId, eid).stream()
                .map(this::toResponse)
                .toList();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private EcritureComptable findOrThrow(UUID id, UUID eid) {
        EcritureComptable e = ecritureRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Écriture introuvable"));
        if (!e.getEntreprise().getId().equals(eid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        return e;
    }

    private ApprobationDto.ApprobationResponse toResponse(Approbation a) {
        return new ApprobationDto.ApprobationResponse(
                a.getId(),
                a.getDecision(),
                a.getCommentaire(),
                a.getApprobateur().getId(),
                a.getApprobateur().getNom(),
                a.getCreatedAt()
        );
    }

    private ApprobationDto.EcritureEnAttenteResume toResume(EcritureComptable e) {
        return new ApprobationDto.EcritureEnAttenteResume(
                e.getId(),
                e.getNumeroPiece(),
                e.getDateEcriture(),
                e.getLibelle(),
                e.getJournal(),
                e.getCreatedBy().getId(),
                e.getCreatedBy().getNom(),
                e.getCreatedAt()
        );
    }
}
