package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.pret.PretDto;
import com.edefence.comptabia.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PretService {

    private final PretRepository          pretRepo;
    private final EcheancePretRepository  echeanceRepo;
    private final EntrepriseRepository    entrepriseRepo;
    private final UtilisateurRepository   utilisateurRepo;

    @Transactional(readOnly = true)
    public List<PretDto.PretResponse> findAll(UUID eid) {
        return pretRepo.findAllByEntreprise(eid).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PretDto.PretResponse> findByCollaborateur(UUID collabId, UUID eid) {
        return pretRepo.findByCollaborateur(collabId, eid).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public PretDto.PretResponse create(UUID eid, PretDto.PretRequest req) {
        Entreprise e = entrepriseRepo.findById(eid)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        Utilisateur collab = utilisateurRepo.findById(req.collaborateurId())
                .orElseThrow(() -> new EntityNotFoundException("Collaborateur introuvable"));
        if (!collab.getEntreprise().getId().equals(eid)) {
            throw new EntityNotFoundException("Collaborateur introuvable");
        }

        BigDecimal echeance = req.montant()
                .divide(BigDecimal.valueOf(req.nbEcheances()), 2, RoundingMode.HALF_UP);

        Pret pret = Pret.builder()
                .entreprise(e)
                .collaborateur(collab)
                .typePret(req.typePret())
                .montant(req.montant())
                .nbEcheances(req.nbEcheances())
                .montantEcheance(echeance)
                .dateDebut(req.dateDebut())
                .motif(req.motif())
                .build();
        return toResponse(pretRepo.save(pret));
    }

    @Transactional
    public PretDto.PretResponse approuver(UUID id, UUID eid) {
        Pret pret = load(id, eid);
        if (pret.getStatut() != Pret.Statut.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Le prêt n'est pas en attente d'approbation");
        }
        pret.setStatut(Pret.Statut.APPROUVE);

        // Générer les échéances
        LocalDate cursor = pret.getDateDebut();
        for (int i = 1; i <= pret.getNbEcheances(); i++) {
            EcheancePret ech = EcheancePret.builder()
                    .pret(pret)
                    .numero(i)
                    .mois(cursor.getMonthValue())
                    .annee(cursor.getYear())
                    .montant(pret.getMontantEcheance())
                    .build();
            pret.getEcheances().add(ech);
            cursor = cursor.plusMonths(1);
        }
        pret.setStatut(Pret.Statut.EN_COURS);
        return toResponse(pretRepo.save(pret));
    }

    @Transactional
    public PretDto.PretResponse refuser(UUID id, UUID eid) {
        Pret pret = load(id, eid);
        if (pret.getStatut() != Pret.Statut.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Le prêt n'est pas en attente d'approbation");
        }
        pret.setStatut(Pret.Statut.REFUSE);
        return toResponse(pretRepo.save(pret));
    }

    @Transactional
    public PretDto.PretResponse prelevEcheance(UUID pretId, UUID echeanceId, UUID eid) {
        Pret pret = load(pretId, eid);
        EcheancePret ech = echeanceRepo.findByIdAndEntreprise(echeanceId, eid)
                .orElseThrow(() -> new EntityNotFoundException("Échéance introuvable"));
        if (ech.getStatut() == EcheancePret.Statut.PRELEVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Échéance déjà prélevée");
        }
        ech.setStatut(EcheancePret.Statut.PRELEVE);
        echeanceRepo.save(ech);

        boolean toutPrelevé = pret.getEcheances().stream()
                .allMatch(e -> e.getId().equals(echeanceId)
                        || e.getStatut() == EcheancePret.Statut.PRELEVE);
        if (toutPrelevé) {
            pret.setStatut(Pret.Statut.SOLDE);
        }
        return toResponse(pretRepo.save(pret));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        Pret pret = load(id, eid);
        if (pret.getStatut() != Pret.Statut.EN_ATTENTE && pret.getStatut() != Pret.Statut.REFUSE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Impossible de supprimer un prêt approuvé ou en cours");
        }
        pretRepo.delete(pret);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Pret load(UUID id, UUID eid) {
        return pretRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Prêt introuvable"));
    }

    private PretDto.PretResponse toResponse(Pret p) {
        List<PretDto.EcheanceResponse> echs = p.getEcheances().stream()
                .map(e -> new PretDto.EcheanceResponse(
                        e.getId(), e.getNumero(), e.getMois(), e.getAnnee(),
                        e.getMontant(), e.getStatut()))
                .collect(Collectors.toList());
        int nbPrelevees = (int) p.getEcheances().stream()
                .filter(e -> e.getStatut() == EcheancePret.Statut.PRELEVE).count();
        return new PretDto.PretResponse(
                p.getId(),
                p.getCollaborateur().getId(),
                p.getCollaborateur().getNom(),
                p.getTypePret(),
                p.getMontant(),
                p.getNbEcheances(),
                p.getMontantEcheance(),
                p.getDateDebut(),
                p.getStatut(),
                p.getMotif(),
                nbPrelevees,
                echs,
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null
        );
    }
}
