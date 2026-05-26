package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.devis.DevisDto;
import com.edefence.ecompta.dto.facture.FactureDto;
import com.edefence.ecompta.repository.DevisRepository;
import com.edefence.ecompta.repository.TiersRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class DevisService {

    private final DevisRepository  devisRepo;
    private final TiersRepository  tiersRepo;
    private final FactureService   factureSvc;

    // ─── Queries ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<DevisDto.Resume> findAll(UUID eid, Devis.Statut statut,
                                          LocalDate from, LocalDate to, Pageable pageable) {
        return devisRepo.findWithFilters(eid, statut, from, to, pageable)
                        .map(d -> toResume(d, LocalDate.now()));
    }

    @Transactional(readOnly = true)
    public DevisDto.Response findOne(UUID id, UUID eid) {
        return toResponse(findOrThrow(id, eid), LocalDate.now());
    }

    // ─── CRUD ───────────────────────────────────────────────────────────────

    @Transactional
    public DevisDto.Response create(UUID eid, DevisDto.SaveRequest req, Entreprise entreprise) {
        String numero = generateNumero(eid, req.dateDevis().getYear());
        Tiers tiers = req.tiersId() != null ? resolveTiers(req.tiersId(), eid) : null;

        Devis devis = Devis.builder()
                .entreprise(entreprise)
                .numero(numero)
                .dateDevis(req.dateDevis())
                .dateValidite(req.dateValidite())
                .tiers(tiers)
                .nomTiers(tiers != null ? tiers.getNom() : req.nomTiers())
                .adresseTiers(tiers != null ? tiers.getAdresse() : req.adresseTiers())
                .objet(req.objet())
                .conditions(req.conditions())
                .build();

        buildLignes(devis, req.lignes());
        recalcTotaux(devis);
        return toResponse(devisRepo.save(devis), LocalDate.now());
    }

    @Transactional
    public DevisDto.Response update(UUID id, UUID eid, DevisDto.SaveRequest req) {
        Devis devis = findOrThrow(id, eid);
        if (devis.getStatut() != Devis.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seul un devis en brouillon peut être modifié");
        }
        Tiers tiers = req.tiersId() != null ? resolveTiers(req.tiersId(), eid) : null;
        devis.setDateDevis(req.dateDevis());
        devis.setDateValidite(req.dateValidite());
        devis.setTiers(tiers);
        devis.setNomTiers(tiers != null ? tiers.getNom() : req.nomTiers());
        devis.setAdresseTiers(tiers != null ? tiers.getAdresse() : req.adresseTiers());
        devis.setObjet(req.objet());
        devis.setConditions(req.conditions());
        devis.getLignes().clear();
        buildLignes(devis, req.lignes());
        recalcTotaux(devis);
        return toResponse(devisRepo.save(devis), LocalDate.now());
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        Devis devis = findOrThrow(id, eid);
        if (devis.getStatut() != Devis.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seul un devis en brouillon peut être supprimé");
        }
        devisRepo.delete(devis);
    }

    // ─── Actions ────────────────────────────────────────────────────────────

    @Transactional
    public DevisDto.Response envoyer(UUID id, UUID eid) {
        Devis devis = findOrThrow(id, eid);
        if (devis.getStatut() != Devis.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Devis déjà envoyé ou finalisé");
        }
        devis.setStatut(Devis.Statut.ENVOYE);
        return toResponse(devisRepo.save(devis), LocalDate.now());
    }

    @Transactional
    public DevisDto.Response changerStatut(UUID id, UUID eid, Devis.Statut nouveau) {
        Devis devis = findOrThrow(id, eid);
        if (devis.getStatut() == Devis.Statut.ACCEPTE || devis.getStatut() == Devis.Statut.EXPIRE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ce devis ne peut plus être modifié");
        }
        devis.setStatut(nouveau);
        return toResponse(devisRepo.save(devis), LocalDate.now());
    }

    @Transactional
    public FactureDto.Response convertirEnFacture(UUID id, UUID eid,
                                                    Entreprise entreprise, Utilisateur auteur) {
        Devis devis = findOrThrow(id, eid);
        if (devis.getStatut() != Devis.Statut.ACCEPTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seul un devis accepté peut être converti en facture");
        }
        if (devis.getFacture() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Ce devis a déjà été converti en facture " + devis.getFacture().getNumero());
        }

        FactureDto.CreateRequest req = new FactureDto.CreateRequest(
                devis.getDateDevis(),
                devis.getDateValidite(),
                devis.getTiers() != null ? devis.getTiers().getId() : null,
                devis.getNomTiers(),
                devis.getAdresseTiers(),
                devis.getTiers() != null ? devis.getTiers().getIfu() : null,
                "Devis " + devis.getNumero() + (devis.getObjet() != null ? " — " + devis.getObjet() : ""),
                devis.getLignes().stream()
                        .map(l -> new FactureDto.LigneRequest(
                                l.getDescription(), l.getQuantite(), l.getPrixUnitaire(),
                                l.getTauxTva(), l.getCompteProduit(), l.getOrdre()))
                        .collect(Collectors.toList())
        );

        FactureDto.Response facture = factureSvc.create(eid, req, entreprise, auteur);

        // Reload facture entity to set link
        devis.setStatut(Devis.Statut.ACCEPTE);
        // We store factureId via a proxy — reload after factureSvc.create persisted it
        com.edefence.ecompta.domain.Facture factureEntity =
                new com.edefence.ecompta.domain.Facture();
        factureEntity.setId(facture.id());
        devis.setFacture(factureEntity);
        devisRepo.save(devis);

        return facture;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private String generateNumero(UUID eid, int year) {
        String prefix = "DEV-" + year + "-";
        Integer max = devisRepo.maxNumeroSeq(eid, prefix + "%");
        return prefix + String.format("%04d", (max == null ? 0 : max) + 1);
    }

    private void buildLignes(Devis devis, List<DevisDto.LigneRequest> dtos) {
        int ordre = 0;
        for (DevisDto.LigneRequest l : dtos) {
            BigDecimal ht  = l.quantite().multiply(l.prixUnitaire()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tva = ht.multiply(l.tauxTva()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            devis.getLignes().add(LigneDevis.builder()
                    .devis(devis)
                    .description(l.description())
                    .quantite(l.quantite())
                    .prixUnitaire(l.prixUnitaire())
                    .tauxTva(l.tauxTva())
                    .montantHt(ht)
                    .montantTva(tva)
                    .montantTtc(ht.add(tva))
                    .compteProduit(l.compteProduit() != null ? l.compteProduit() : "706")
                    .ordre(ordre++)
                    .build());
        }
    }

    private void recalcTotaux(Devis d) {
        BigDecimal ht  = d.getLignes().stream().map(LigneDevis::getMontantHt) .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tva = d.getLignes().stream().map(LigneDevis::getMontantTva).reduce(BigDecimal.ZERO, BigDecimal::add);
        d.setMontantHt(ht);
        d.setMontantTva(tva);
        d.setMontantTtc(ht.add(tva));
    }

    private Tiers resolveTiers(UUID tiersId, UUID eid) {
        Tiers t = tiersRepo.findById(tiersId)
                .orElseThrow(() -> new EntityNotFoundException("Tiers introuvable : " + tiersId));
        if (!t.getEntreprise().getId().equals(eid)) throw new EntityNotFoundException("Tiers introuvable");
        return t;
    }

    private Devis findOrThrow(UUID id, UUID eid) {
        Devis d = devisRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Devis introuvable : " + id));
        if (!d.getEntreprise().getId().equals(eid)) throw new EntityNotFoundException("Devis introuvable : " + id);
        return d;
    }

    // ─── Mappers ────────────────────────────────────────────────────────────

    private DevisDto.Response toResponse(Devis d, LocalDate today) {
        return new DevisDto.Response(
                d.getId(), d.getNumero(), d.getDateDevis(), d.getDateValidite(),
                d.getTiers() != null ? d.getTiers().getId() : null,
                d.getNomTiers(), d.getAdresseTiers(), d.getObjet(), d.getStatut(),
                d.getMontantHt(), d.getMontantTva(), d.getMontantTtc(), d.getConditions(),
                d.getLignes().stream().map(l -> new DevisDto.LigneResponse(
                        l.getId(), l.getDescription(), l.getQuantite(), l.getPrixUnitaire(),
                        l.getTauxTva(), l.getMontantHt(), l.getMontantTva(), l.getMontantTtc(),
                        l.getCompteProduit(), l.getOrdre())).collect(Collectors.toList()),
                d.getFacture() != null ? d.getFacture().getId() : null,
                isExpire(d, today));
    }

    private DevisDto.Resume toResume(Devis d, LocalDate today) {
        return new DevisDto.Resume(
                d.getId(), d.getNumero(), d.getDateDevis(), d.getDateValidite(),
                d.getTiers() != null ? d.getTiers().getId() : null,
                d.getNomTiers(), d.getStatut(),
                d.getMontantHt(), d.getMontantTva(), d.getMontantTtc(),
                d.getFacture() != null ? d.getFacture().getId() : null,
                isExpire(d, today));
    }

    private boolean isExpire(Devis d, LocalDate today) {
        return d.getStatut() == Devis.Statut.ENVOYE
                && d.getDateValidite() != null
                && today.isAfter(d.getDateValidite());
    }
}
