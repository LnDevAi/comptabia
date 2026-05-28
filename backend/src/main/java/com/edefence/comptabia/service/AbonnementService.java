package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Abonnement;
import com.edefence.comptabia.domain.Tiers;
import com.edefence.comptabia.dto.abonnement.AbonnementDto;
import com.edefence.comptabia.dto.facture.FactureDto;
import com.edefence.comptabia.repository.AbonnementRepository;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.TiersRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AbonnementService {

    private final AbonnementRepository abonnementRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final TiersRepository      tiersRepo;
    private final FactureService       factureService;

    // ─── Queries ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AbonnementDto.Resume> findAll(UUID eid) {
        return abonnementRepo.findAllByEntreprise(eid)
                .stream().map(this::toResume).toList();
    }

    @Transactional(readOnly = true)
    public AbonnementDto.Response findOne(UUID id, UUID eid) {
        return toResponse(findOrThrow(id, eid));
    }

    // ─── CRUD ───────────────────────────────────────────────────────────────

    @Transactional
    public AbonnementDto.Response create(UUID eid, AbonnementDto.SaveRequest req) {
        Abonnement a = Abonnement.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .nom(req.nom())
                .description(req.description())
                .periodicite(req.periodicite())
                .montantHt(req.montantHt())
                .tauxTva(req.tauxTva())
                .compteProduit(req.compteProduit())
                .tiers(req.tiersId() != null ? resolveTiers(req.tiersId(), eid) : null)
                .dateDebut(req.dateDebut())
                .dateFin(req.dateFin())
                .prochaineEcheance(req.prochaineEcheance())
                .build();
        return toResponse(abonnementRepo.save(a));
    }

    @Transactional
    public AbonnementDto.Response update(UUID id, UUID eid, AbonnementDto.SaveRequest req) {
        Abonnement a = findOrThrow(id, eid);
        a.setNom(req.nom());
        a.setDescription(req.description());
        a.setPeriodicite(req.periodicite());
        a.setMontantHt(req.montantHt());
        a.setTauxTva(req.tauxTva());
        a.setCompteProduit(req.compteProduit());
        a.setTiers(req.tiersId() != null ? resolveTiers(req.tiersId(), eid) : null);
        a.setDateDebut(req.dateDebut());
        a.setDateFin(req.dateFin());
        a.setProchaineEcheance(req.prochaineEcheance());
        return toResponse(abonnementRepo.save(a));
    }

    @Transactional
    public void toggle(UUID id, UUID eid) {
        Abonnement a = findOrThrow(id, eid);
        a.setActif(!a.isActif());
        abonnementRepo.save(a);
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        Abonnement a = findOrThrow(id, eid);
        abonnementRepo.delete(a);
    }

    // ─── Génération manuelle ─────────────────────────────────────────────────

    @Transactional
    public FactureDto.Response genererFacture(UUID id, UUID eid) {
        Abonnement a = findOrThrow(id, eid);
        return generer(a);
    }

    // ─── Tâche planifiée ─────────────────────────────────────────────────────

    @Scheduled(cron = "0 0 1 * * *")
    @Transactional
    public void autoGenerer() {
        List<Abonnement> dus = abonnementRepo.findDus(LocalDate.now());
        log.info("Abonnements: {} à générer", dus.size());
        for (Abonnement a : dus) {
            try {
                generer(a);
            } catch (Exception e) {
                log.error("Erreur génération facture abonnement {}: {}", a.getId(), e.getMessage());
            }
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private FactureDto.Response generer(Abonnement a) {
        LocalDate today = LocalDate.now();
        LocalDate echeance = today.plusDays(30);

        BigDecimal montantTva = a.getMontantHt()
                .multiply(a.getTauxTva())
                .divide(BigDecimal.valueOf(100));

        var req = new FactureDto.CreateRequest(
                today,
                echeance,
                a.getTiers() != null ? a.getTiers().getId() : null,
                a.getTiers() != null ? a.getTiers().getNom() : a.getNom(),
                a.getTiers() != null ? a.getTiers().getAdresse() : null,
                a.getTiers() != null ? a.getTiers().getIfu() : null,
                "Abonnement : " + a.getNom(),
                List.of(new FactureDto.LigneRequest(
                        a.getNom() + (a.getDescription() != null ? " — " + a.getDescription() : ""),
                        BigDecimal.ONE,
                        a.getMontantHt(),
                        a.getTauxTva(),
                        a.getCompteProduit() != null ? a.getCompteProduit() : "706",
                        1
                ))
        );

        FactureDto.Response facture = factureService.create(
                a.getEntreprise().getId(), req, a.getEntreprise(), null);

        a.setProchaineEcheance(a.nextEcheance());
        abonnementRepo.save(a);
        return facture;
    }

    private Abonnement findOrThrow(UUID id, UUID eid) {
        return abonnementRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Abonnement introuvable"));
    }

    private Tiers resolveTiers(UUID tiersId, UUID eid) {
        return tiersRepo.findByIdAndEntrepriseId(tiersId, eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tiers introuvable"));
    }

    private BigDecimal ttc(Abonnement a) {
        return a.getMontantHt()
                .multiply(BigDecimal.ONE.add(a.getTauxTva().divide(BigDecimal.valueOf(100))));
    }

    private AbonnementDto.Response toResponse(Abonnement a) {
        return new AbonnementDto.Response(
                a.getId(), a.getNom(), a.getDescription(), a.getPeriodicite(),
                a.getMontantHt(), a.getTauxTva(), ttc(a),
                a.getCompteProduit(),
                a.getTiers() != null ? a.getTiers().getId() : null,
                a.getTiers() != null ? a.getTiers().getNom() : null,
                a.getDateDebut(), a.getDateFin(), a.isActif(), a.getProchaineEcheance()
        );
    }

    private AbonnementDto.Resume toResume(Abonnement a) {
        return new AbonnementDto.Resume(
                a.getId(), a.getNom(), a.getPeriodicite(), ttc(a),
                a.getTiers() != null ? a.getTiers().getId() : null,
                a.getTiers() != null ? a.getTiers().getNom() : null,
                a.isActif(), a.getProchaineEcheance()
        );
    }
}
