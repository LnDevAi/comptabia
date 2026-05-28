package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.notefrais.NoteFraisDto;
import com.edefence.comptabia.dto.notification.NotificationDto;
import com.edefence.comptabia.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NoteFraisService {

    private final NoteFraisRepository       noteFraisRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository  compteRepo;
    private final EntrepriseRepository       entrepriseRepo;
    private final UtilisateurRepository      utilisateurRepo;
    private final NotificationService        notificationService;

    // ─── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NoteFraisDto.Resume> findAll(UUID eid) {
        return noteFraisRepo.findAllByEntreprise(eid).stream().map(this::toResume).toList();
    }

    @Transactional(readOnly = true)
    public List<NoteFraisDto.Resume> findMesNotes(UUID eid, UUID uid) {
        return noteFraisRepo.findByCollaborateur(eid, uid).stream().map(this::toResume).toList();
    }

    @Transactional(readOnly = true)
    public List<NoteFraisDto.Resume> findSoumises(UUID eid) {
        return noteFraisRepo.findSoumises(eid).stream().map(this::toResume).toList();
    }

    @Transactional(readOnly = true)
    public NoteFraisDto.Response findOne(UUID id, UUID eid) {
        return toResponse(findOrThrow(id, eid));
    }

    @Transactional(readOnly = true)
    public NoteFraisDto.Stats getStats(UUID eid, int exercice) {
        if (exercice <= 0) exercice = LocalDate.now().getYear();
        String[] moisFr = {"Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"};

        Map<String, long[]> byStatut = new HashMap<>();
        Map<String, BigDecimal> montByStatut = new HashMap<>();
        for (Object[] r : noteFraisRepo.statsParStatut(eid, exercice)) {
            String st = r[0].toString();
            byStatut.put(st, new long[]{ ((Number) r[1]).longValue() });
            montByStatut.put(st, (BigDecimal) r[2]);
        }
        long brouillons  = get(byStatut, "BROUILLON");
        long soumises    = get(byStatut, "SOUMISE");
        long approuvees  = get(byStatut, "APPROUVEE");
        long rejetees    = get(byStatut, "REJETEE");
        long remboursees = get(byStatut, "REMBOURSEE");
        BigDecimal montSoumis    = montByStatut.getOrDefault("SOUMISE",    BigDecimal.ZERO);
        BigDecimal montApprouve  = montByStatut.getOrDefault("APPROUVEE",  BigDecimal.ZERO);
        BigDecimal montRembourse = montByStatut.getOrDefault("REMBOURSEE", BigDecimal.ZERO);

        List<NoteFraisDto.ParCategorie> parCategorie = new ArrayList<>();
        for (Object[] r : noteFraisRepo.statsParCategorie(eid, exercice)) {
            parCategorie.add(new NoteFraisDto.ParCategorie(
                r[0].toString(), ((Number) r[1]).longValue(), (BigDecimal) r[2]));
        }

        Map<Integer, Object[]> byMois = new HashMap<>();
        for (Object[] r : noteFraisRepo.remboursementsMensuels(eid, exercice))
            byMois.put(((Number) r[0]).intValue(), r);
        List<NoteFraisDto.MoisFrais> mensuel = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            Object[] r = byMois.get(m);
            mensuel.add(new NoteFraisDto.MoisFrais(m, moisFr[m - 1],
                r != null ? ((Number) r[1]).longValue() : 0L,
                r != null ? (BigDecimal) r[2] : BigDecimal.ZERO));
        }

        return new NoteFraisDto.Stats(exercice,
            brouillons + soumises + approuvees + rejetees + remboursees,
            brouillons, soumises, approuvees, rejetees, remboursees,
            montSoumis, montApprouve, montRembourse, parCategorie, mensuel);
    }

    private long get(Map<String, long[]> m, String key) {
        long[] v = m.get(key); return v != null ? v[0] : 0L;
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    @Transactional
    public NoteFraisDto.Response create(UUID eid, UUID uid, NoteFraisDto.SaveRequest req) {
        Utilisateur collab = utilisateurRepo.findById(uid)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        NoteFrais n = NoteFrais.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .collaborateur(collab)
                .titre(req.titre())
                .categorie(req.categorie())
                .description(req.description())
                .montant(req.montant())
                .compteCharge(req.categorie().compteCharge())
                .dateDebut(req.dateDebut())
                .dateFin(req.dateFin())
                .build();
        return toResponse(noteFraisRepo.save(n));
    }

    @Transactional
    public NoteFraisDto.Response update(UUID id, UUID eid, NoteFraisDto.SaveRequest req) {
        NoteFrais n = findOrThrow(id, eid);
        if (n.getStatut() != NoteFrais.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une note en brouillon peut être modifiée");
        }
        n.setTitre(req.titre());
        n.setCategorie(req.categorie());
        n.setDescription(req.description());
        n.setMontant(req.montant());
        n.setCompteCharge(req.categorie().compteCharge());
        n.setDateDebut(req.dateDebut());
        n.setDateFin(req.dateFin());
        return toResponse(noteFraisRepo.save(n));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        NoteFrais n = findOrThrow(id, eid);
        if (n.getStatut() != NoteFrais.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une note en brouillon peut être supprimée");
        }
        noteFraisRepo.delete(n);
    }

    // ─── Circuit ─────────────────────────────────────────────────────────────

    @Transactional
    public NoteFraisDto.Response soumettre(UUID id, UUID eid) {
        NoteFrais n = findOrThrow(id, eid);
        if (n.getStatut() != NoteFrais.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Note déjà soumise");
        }
        n.setStatut(NoteFrais.Statut.SOUMISE);
        noteFraisRepo.save(n);
        notificationService.broadcast(eid, new NotificationDto(
                "NOTE_FRAIS",
                "Note de frais \"" + n.getTitre() + "\" soumise par " + n.getCollaborateur().getNom(),
                1, "WARNING", "/dashboard/notes-frais", Instant.now()));
        return toResponse(n);
    }

    @Transactional
    public NoteFraisDto.Response approuver(UUID id, UUID eid, Entreprise entreprise, Utilisateur auteur) {
        NoteFrais n = findOrThrow(id, eid);
        if (n.getStatut() != NoteFrais.Statut.SOUMISE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Note non soumise");
        }

        // DR compteCharge / CR 421 Personnel avances
        CompteComptable cCharge = getOrCreate(entreprise, n.getCompteCharge(),
                n.getCategorie().intitule(), 6);
        CompteComptable c421 = getOrCreate(entreprise, "421",
                "Personnel - avances et acomptes", 4);

        String piece = "NF-" + n.getId().toString().substring(0, 6).toUpperCase();
        EcritureComptable ecriture = buildEcriture(entreprise, auteur, piece,
                n.getDateFin(), "Note de frais — " + n.getTitre(),
                cCharge, c421, n.getMontant());

        n.setEcritureApprobation(ecritureRepo.save(ecriture));
        n.setStatut(NoteFrais.Statut.APPROUVEE);
        noteFraisRepo.save(n);

        notificationService.broadcast(eid, new NotificationDto(
                "NOTE_FRAIS",
                "Note de frais \"" + n.getTitre() + "\" approuvée",
                1, "INFO", "/dashboard/notes-frais", Instant.now()));
        return toResponse(n);
    }

    @Transactional
    public NoteFraisDto.Response rejeter(UUID id, UUID eid, NoteFraisDto.RejeterRequest req) {
        NoteFrais n = findOrThrow(id, eid);
        if (n.getStatut() != NoteFrais.Statut.SOUMISE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Note non soumise");
        }
        n.setStatut(NoteFrais.Statut.REJETEE);
        n.setCommentaireRejet(req.commentaire());
        noteFraisRepo.save(n);

        notificationService.broadcast(eid, new NotificationDto(
                "NOTE_FRAIS",
                "Note de frais \"" + n.getTitre() + "\" rejetée",
                1, "DANGER", "/dashboard/notes-frais", Instant.now()));
        return toResponse(n);
    }

    @Transactional
    public NoteFraisDto.Response rembourser(UUID id, UUID eid, Entreprise entreprise, Utilisateur auteur) {
        NoteFrais n = findOrThrow(id, eid);
        if (n.getStatut() != NoteFrais.Statut.APPROUVEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Note non approuvée");
        }

        // DR 421 Personnel avances / CR 521 Banque
        CompteComptable c421 = getOrCreate(entreprise, "421",
                "Personnel - avances et acomptes", 4);
        CompteComptable c521 = getOrCreate(entreprise, "521", "Banques locales", 5);

        String piece = "RMB-" + n.getId().toString().substring(0, 6).toUpperCase();
        EcritureComptable ecriture = buildEcriture(entreprise, auteur, piece,
                LocalDate.now(), "Remboursement note de frais — " + n.getTitre(),
                c421, c521, n.getMontant());

        n.setEcritureRemboursement(ecritureRepo.save(ecriture));
        n.setStatut(NoteFrais.Statut.REMBOURSEE);
        noteFraisRepo.save(n);

        notificationService.broadcast(eid, new NotificationDto(
                "NOTE_FRAIS",
                "Note de frais \"" + n.getTitre() + "\" remboursée",
                1, "INFO", "/dashboard/notes-frais", Instant.now()));
        return toResponse(n);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private EcritureComptable buildEcriture(Entreprise entreprise, Utilisateur auteur,
                                             String piece, LocalDate date, String libelle,
                                             CompteComptable cDebit, CompteComptable cCredit,
                                             BigDecimal montant) {
        EcritureComptable e = EcritureComptable.builder()
                .entreprise(entreprise)
                .createdBy(auteur)
                .numeroPiece(piece)
                .dateEcriture(date)
                .libelle(libelle)
                .journal(EcritureComptable.Journal.OD)
                .statut(EcritureComptable.Statut.VALIDEE)
                .build();
        e.getLignes().add(LigneEcriture.builder()
                .ecriture(e).compte(cDebit).libelle(libelle)
                .debit(montant).credit(BigDecimal.ZERO).build());
        e.getLignes().add(LigneEcriture.builder()
                .ecriture(e).compte(cCredit).libelle(libelle)
                .debit(BigDecimal.ZERO).credit(montant).build());
        return e;
    }

    private CompteComptable getOrCreate(Entreprise entreprise, String numero,
                                         String intitule, int classe) {
        return compteRepo.findByNumeroAndEntrepriseId(numero, entreprise.getId())
                .orElseGet(() -> compteRepo.save(CompteComptable.builder()
                        .numero(numero).intitule(intitule)
                        .classe(classe).entreprise(entreprise).build()));
    }

    private NoteFrais findOrThrow(UUID id, UUID eid) {
        return noteFraisRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Note de frais introuvable"));
    }

    private NoteFraisDto.Response toResponse(NoteFrais n) {
        return new NoteFraisDto.Response(
                n.getId(), n.getTitre(), n.getCategorie(), n.getDescription(),
                n.getMontant(), n.getCompteCharge(), n.getDateDebut(), n.getDateFin(),
                n.getStatut(), n.getCommentaireRejet(),
                n.getCollaborateur().getId(), n.getCollaborateur().getNom(),
                n.getEcritureApprobation() != null ? n.getEcritureApprobation().getId() : null,
                n.getEcritureRemboursement() != null ? n.getEcritureRemboursement().getId() : null,
                n.getCreatedAt()
        );
    }

    private NoteFraisDto.Resume toResume(NoteFrais n) {
        return new NoteFraisDto.Resume(
                n.getId(), n.getTitre(), n.getCategorie(), n.getMontant(),
                n.getDateDebut(), n.getDateFin(), n.getStatut(),
                n.getCollaborateur().getNom(), n.getCreatedAt()
        );
    }
}
