package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Conge;
import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.conge.CongeDto;
import com.edefence.comptabia.dto.notification.NotificationDto;
import com.edefence.comptabia.repository.CongeRepository;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CongeService {

    private final CongeRepository        congeRepo;
    private final UtilisateurRepository  utilisateurRepo;
    private final EntrepriseRepository   entrepriseRepo;
    private final NotificationService    notificationService;

    @Transactional(readOnly = true)
    public List<CongeDto.Response> findAll(UUID eid) {
        return congeRepo.findAllByEntreprise(eid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CongeDto.Response> mesConges(UUID eid, UUID uid) {
        return congeRepo.findByCollaborateur(eid, uid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CongeDto.Response> soumises(UUID eid) {
        return congeRepo.findSoumises(eid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CongeDto.CalendrierItem> calendrier(UUID eid, int annee, int mois) {
        LocalDate debut = LocalDate.of(annee, mois, 1);
        LocalDate fin   = debut.withDayOfMonth(debut.lengthOfMonth());
        return congeRepo.findApprouveesInRange(eid, debut, fin).stream()
                .map(c -> new CongeDto.CalendrierItem(
                        c.getId(), c.getCollaborateur().getNom(),
                        c.getType(), c.getType().intitule(),
                        c.getDateDebut(), c.getDateFin(), c.getNombreJours()))
                .toList();
    }

    @Transactional
    public CongeDto.Response create(UUID eid, UUID uid, CongeDto.SaveRequest req) {
        validateDates(req.dateDebut(), req.dateFin());
        Utilisateur collab = utilisateurRepo.findById(uid)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        Conge c = Conge.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .collaborateur(collab)
                .type(req.type())
                .dateDebut(req.dateDebut())
                .dateFin(req.dateFin())
                .nombreJours(joursOuvres(req.dateDebut(), req.dateFin()))
                .motif(req.motif())
                .build();
        return toResponse(congeRepo.save(c));
    }

    @Transactional
    public CongeDto.Response update(UUID id, UUID eid, CongeDto.SaveRequest req) {
        Conge c = findOrThrow(id, eid);
        if (c.getStatut() != Conge.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seul un congé en brouillon peut être modifié");
        }
        validateDates(req.dateDebut(), req.dateFin());
        c.setType(req.type());
        c.setDateDebut(req.dateDebut());
        c.setDateFin(req.dateFin());
        c.setNombreJours(joursOuvres(req.dateDebut(), req.dateFin()));
        c.setMotif(req.motif());
        return toResponse(congeRepo.save(c));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        Conge c = findOrThrow(id, eid);
        if (c.getStatut() != Conge.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seul un congé en brouillon peut être supprimé");
        }
        congeRepo.delete(c);
    }

    @Transactional
    public CongeDto.Response soumettre(UUID id, UUID eid) {
        Conge c = findOrThrow(id, eid);
        if (c.getStatut() != Conge.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Demande déjà soumise");
        }
        c.setStatut(Conge.Statut.SOUMISE);
        congeRepo.save(c);
        notificationService.broadcast(eid, new NotificationDto(
                "CONGE",
                "Demande de " + c.getType().intitule() + " soumise par " + c.getCollaborateur().getNom()
                        + " (" + c.getNombreJours() + "j)",
                1, "WARNING", "/dashboard/conges", Instant.now()));
        return toResponse(c);
    }

    @Transactional
    public CongeDto.Response approuver(UUID id, UUID eid) {
        Conge c = findOrThrow(id, eid);
        if (c.getStatut() != Conge.Statut.SOUMISE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Demande non soumise");
        }
        c.setStatut(Conge.Statut.APPROUVEE);
        congeRepo.save(c);
        notificationService.broadcast(eid, new NotificationDto(
                "CONGE",
                "Congé de " + c.getCollaborateur().getNom() + " approuvé ("
                        + c.getDateDebut() + " → " + c.getDateFin() + ")",
                1, "INFO", "/dashboard/conges", Instant.now()));
        return toResponse(c);
    }

    @Transactional
    public CongeDto.Response rejeter(UUID id, UUID eid, CongeDto.RejeterRequest req) {
        Conge c = findOrThrow(id, eid);
        if (c.getStatut() != Conge.Statut.SOUMISE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Demande non soumise");
        }
        c.setStatut(Conge.Statut.REJETEE);
        c.setCommentaireRejet(req.commentaire());
        congeRepo.save(c);
        notificationService.broadcast(eid, new NotificationDto(
                "CONGE",
                "Demande de congé de " + c.getCollaborateur().getNom() + " rejetée",
                1, "DANGER", "/dashboard/conges", Instant.now()));
        return toResponse(c);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private int joursOuvres(LocalDate debut, LocalDate fin) {
        int jours = 0;
        LocalDate cur = debut;
        while (!cur.isAfter(fin)) {
            int dow = cur.getDayOfWeek().getValue();
            if (dow < 6) jours++;
            cur = cur.plusDays(1);
        }
        return Math.max(jours, 1);
    }

    private void validateDates(LocalDate debut, LocalDate fin) {
        if (fin.isBefore(debut)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La date de fin doit être postérieure à la date de début");
        }
    }

    private Conge findOrThrow(UUID id, UUID eid) {
        return congeRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Congé introuvable"));
    }

    private CongeDto.Response toResponse(Conge c) {
        return new CongeDto.Response(
                c.getId(), c.getType(), c.getType().intitule(),
                c.getDateDebut(), c.getDateFin(), c.getNombreJours(),
                c.getMotif(), c.getStatut(), c.getCommentaireRejet(),
                c.getCollaborateur().getId(), c.getCollaborateur().getNom(),
                c.getCreatedAt());
    }
}
