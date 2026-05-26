package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.facture.FactureDto;
import com.edefence.ecompta.repository.*;
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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FactureService {

    private final FactureRepository         factureRepo;
    private final TiersRepository           tiersRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository compteRepo;

    // ─── Queries ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<FactureDto.Resume> findAll(UUID eid, Facture.Statut statut,
                                            LocalDate from, LocalDate to, Pageable pageable) {
        return factureRepo.findWithFilters(eid, statut, from, to, pageable)
                          .map(f -> toResume(f, LocalDate.now()));
    }

    @Transactional(readOnly = true)
    public FactureDto.Response findOne(UUID id, UUID eid) {
        return toResponse(findOrThrow(id, eid), LocalDate.now());
    }

    // ─── CRUD ───────────────────────────────────────────────────────────────

    @Transactional
    public FactureDto.Response create(UUID eid, FactureDto.CreateRequest req,
                                       Entreprise entreprise, Utilisateur auteur) {
        String numero = generateNumero(eid, req.dateFacture().getYear());
        Tiers tiers = req.tiersId() != null ? resolveTiers(req.tiersId(), eid) : null;
        boolean exonere = estExonere(entreprise);

        String ifuClient = resolveIfuClient(req.ifuClient(), tiers);

        Facture facture = Facture.builder()
                .entreprise(entreprise)
                .numero(numero)
                .dateFacture(req.dateFacture())
                .dateEcheance(req.dateEcheance())
                .tiers(tiers)
                .nomTiers(tiers != null ? tiers.getNom() : req.nomTiers())
                .adresseTiers(tiers != null ? tiers.getAdresse() : req.adresseTiers())
                .ifuClient(ifuClient)
                .notes(req.notes())
                .build();

        buildLignes(facture, req.lignes(), exonere);
        recalcTotaux(facture);
        return toResponse(factureRepo.save(facture), LocalDate.now());
    }

    @Transactional
    public FactureDto.Response update(UUID id, UUID eid, FactureDto.UpdateRequest req,
                                       Entreprise entreprise) {
        Facture facture = findOrThrow(id, eid);
        if (facture.getStatut() != Facture.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une facture en brouillon peut être modifiée");
        }
        boolean exonere = estExonere(entreprise);
        Tiers tiers = req.tiersId() != null ? resolveTiers(req.tiersId(), eid) : null;
        facture.setDateFacture(req.dateFacture());
        facture.setDateEcheance(req.dateEcheance());
        facture.setTiers(tiers);
        facture.setNomTiers(tiers != null ? tiers.getNom() : req.nomTiers());
        facture.setAdresseTiers(tiers != null ? tiers.getAdresse() : req.adresseTiers());
        facture.setIfuClient(resolveIfuClient(req.ifuClient(), tiers));
        facture.setNotes(req.notes());
        facture.getLignes().clear();
        buildLignes(facture, req.lignes(), exonere);
        recalcTotaux(facture);
        return toResponse(factureRepo.save(facture), LocalDate.now());
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        Facture facture = findOrThrow(id, eid);
        if (facture.getStatut() != Facture.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une facture en brouillon peut être supprimée");
        }
        factureRepo.delete(facture);
    }

    // ─── Actions ────────────────────────────────────────────────────────────

    @Transactional
    public FactureDto.Response emettre(UUID id, UUID eid, Entreprise entreprise, Utilisateur auteur) {
        Facture facture = findOrThrow(id, eid);
        if (facture.getStatut() != Facture.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Facture déjà émise ou annulée");
        }

        // Compte 411 Client
        String numClient = facture.getTiers() != null
                && facture.getTiers().getCompteNumero() != null
                ? facture.getTiers().getCompteNumero() : "411";
        CompteComptable c411 = getOrCreate(entreprise, numClient, "Clients", 4);

        EcritureComptable ecriture = EcritureComptable.builder()
                .entreprise(entreprise)
                .createdBy(auteur)
                .numeroPiece(facture.getNumero())
                .dateEcriture(facture.getDateFacture())
                .libelle("Facture " + facture.getNumero() + " — " + orEmpty(facture.getNomTiers()))
                .journal(EcritureComptable.Journal.VT)
                .statut(EcritureComptable.Statut.VALIDEE)
                .build();

        // DR 411 = TTC
        ecriture.getLignes().add(LigneEcriture.builder()
                .ecriture(ecriture).compte(c411)
                .libelle(facture.getNomTiers())
                .debit(facture.getMontantTtc()).credit(BigDecimal.ZERO)
                .build());

        // CR par compte_produit (regroupé)
        Map<String, BigDecimal> produits = new LinkedHashMap<>();
        for (LigneFacture l : facture.getLignes()) {
            String cp = l.getCompteProduit() != null ? l.getCompteProduit() : "706";
            produits.merge(cp, l.getMontantHt(), BigDecimal::add);
        }
        for (Map.Entry<String, BigDecimal> e : produits.entrySet()) {
            CompteComptable cproduit = getOrCreate(entreprise, e.getKey(), "Produits", 7);
            ecriture.getLignes().add(LigneEcriture.builder()
                    .ecriture(ecriture).compte(cproduit)
                    .libelle("Vente " + facture.getNumero())
                    .debit(BigDecimal.ZERO).credit(e.getValue())
                    .build());
        }

        // CR 447 TVA collectée (seulement si régime TVA — pas CME)
        if (facture.getMontantTva().compareTo(BigDecimal.ZERO) > 0
                && !estExonere(entreprise)) {
            CompteComptable c447 = getOrCreate(entreprise, "447", "État — TVA collectée", 4);
            ecriture.getLignes().add(LigneEcriture.builder()
                    .ecriture(ecriture).compte(c447)
                    .libelle("TVA facture " + facture.getNumero())
                    .debit(BigDecimal.ZERO).credit(facture.getMontantTva())
                    .build());
        }

        EcritureComptable saved = ecritureRepo.save(ecriture);
        facture.setStatut(Facture.Statut.EMISE);
        facture.setEcritureVente(saved);
        // Passage automatique en EN_ATTENTE de normalisation DGI
        facture.setStatutNormalisation(Facture.StatutNormalisation.EN_ATTENTE);
        return toResponse(factureRepo.save(facture), LocalDate.now());
    }

    @Transactional
    public FactureDto.Response normaliser(UUID id, UUID eid, FactureDto.NormalisationRequest req) {
        Facture facture = findOrThrow(id, eid);
        if (facture.getStatut() == Facture.Statut.BROUILLON) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La facture doit être émise avant normalisation");
        }
        if (facture.isEstNormalisee()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Facture déjà normalisée (NFN : " + facture.getNfn() + ")");
        }
        facture.setNfn(req.nfn());
        facture.setCodeControle(req.codeControle());
        facture.setStatutNormalisation(Facture.StatutNormalisation.NORMALISEE);
        facture.setEstNormalisee(true);
        return toResponse(factureRepo.save(facture), LocalDate.now());
    }

    @Transactional
    public FactureDto.Response payer(UUID id, UUID eid, FactureDto.PayerRequest req,
                                      Entreprise entreprise, Utilisateur auteur) {
        Facture facture = findOrThrow(id, eid);
        if (facture.getStatut() != Facture.Statut.EMISE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une facture émise peut être soldée");
        }

        String numBanque = req.compteReglement() != null && !req.compteReglement().isBlank()
                ? req.compteReglement() : "521";
        CompteComptable cBanque = getOrCreate(entreprise, numBanque, "Banque", 5);

        String numClient = facture.getTiers() != null
                && facture.getTiers().getCompteNumero() != null
                ? facture.getTiers().getCompteNumero() : "411";
        CompteComptable c411 = getOrCreate(entreprise, numClient, "Clients", 4);

        String refReg = "REG-" + facture.getNumero();
        EcritureComptable ecriture = EcritureComptable.builder()
                .entreprise(entreprise)
                .createdBy(auteur)
                .numeroPiece(refReg)
                .dateEcriture(req.dateReglement())
                .libelle("Règlement " + facture.getNumero() + " — " + orEmpty(facture.getNomTiers()))
                .journal(EcritureComptable.Journal.BQ)
                .statut(EcritureComptable.Statut.VALIDEE)
                .build();

        ecriture.getLignes().add(LigneEcriture.builder()
                .ecriture(ecriture).compte(cBanque)
                .libelle("Règlement " + facture.getNumero())
                .debit(facture.getMontantTtc()).credit(BigDecimal.ZERO)
                .build());
        ecriture.getLignes().add(LigneEcriture.builder()
                .ecriture(ecriture).compte(c411)
                .libelle(orEmpty(facture.getNomTiers()))
                .debit(BigDecimal.ZERO).credit(facture.getMontantTtc())
                .build());

        EcritureComptable saved = ecritureRepo.save(ecriture);
        facture.setStatut(Facture.Statut.PAYEE);
        facture.setEcritureReglement(saved);
        return toResponse(factureRepo.save(facture), LocalDate.now());
    }

    @Transactional
    public FactureDto.Response annuler(UUID id, UUID eid) {
        Facture facture = findOrThrow(id, eid);
        if (facture.getStatut() == Facture.Statut.PAYEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une facture payée ne peut pas être annulée");
        }
        facture.setStatut(Facture.Statut.ANNULEE);
        return toResponse(factureRepo.save(facture), LocalDate.now());
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private boolean estExonere(Entreprise e) {
        return e.getRegimeFiscal() == Entreprise.RegimeFiscal.CME;
    }

    private String resolveIfuClient(String ifuFromReq, Tiers tiers) {
        if (ifuFromReq != null && !ifuFromReq.isBlank()) return ifuFromReq;
        if (tiers != null && tiers.getIfu() != null) return tiers.getIfu();
        return null;
    }

    private String generateNumero(UUID eid, int year) {
        String prefix = "FAC-" + year + "-";
        Integer max = factureRepo.maxNumeroSeq(eid, prefix + "%");
        int seq = (max == null ? 0 : max) + 1;
        return prefix + String.format("%04d", seq);
    }

    private void buildLignes(Facture facture, List<FactureDto.LigneRequest> dtos, boolean exonere) {
        int ordre = 0;
        for (FactureDto.LigneRequest l : dtos) {
            BigDecimal taux = exonere ? BigDecimal.ZERO : l.tauxTva();
            BigDecimal ht   = l.quantite().multiply(l.prixUnitaire()).setScale(2, RoundingMode.HALF_UP);
            BigDecimal tva  = ht.multiply(taux).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            facture.getLignes().add(LigneFacture.builder()
                    .facture(facture)
                    .description(l.description())
                    .quantite(l.quantite())
                    .prixUnitaire(l.prixUnitaire())
                    .tauxTva(taux)
                    .montantHt(ht)
                    .montantTva(tva)
                    .montantTtc(ht.add(tva))
                    .compteProduit(l.compteProduit() != null ? l.compteProduit() : "706")
                    .ordre(ordre++)
                    .build());
        }
    }

    private void recalcTotaux(Facture f) {
        BigDecimal ht  = f.getLignes().stream().map(LigneFacture::getMontantHt) .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal tva = f.getLignes().stream().map(LigneFacture::getMontantTva).reduce(BigDecimal.ZERO, BigDecimal::add);
        f.setMontantHt(ht);
        f.setMontantTva(tva);
        f.setMontantTtc(ht.add(tva));
    }

    private CompteComptable getOrCreate(Entreprise e, String numero, String intitule, int classe) {
        return compteRepo.findByNumeroAndEntrepriseId(numero, e.getId())
                .orElseGet(() -> compteRepo.save(CompteComptable.builder()
                        .entreprise(e).numero(numero).intitule(intitule).classe(classe).actif(true)
                        .build()));
    }

    private Tiers resolveTiers(UUID tiersId, UUID eid) {
        Tiers t = tiersRepo.findById(tiersId)
                .orElseThrow(() -> new EntityNotFoundException("Tiers introuvable : " + tiersId));
        if (!t.getEntreprise().getId().equals(eid)) {
            throw new EntityNotFoundException("Tiers introuvable : " + tiersId);
        }
        return t;
    }

    private Facture findOrThrow(UUID id, UUID eid) {
        Facture f = factureRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Facture introuvable : " + id));
        if (!f.getEntreprise().getId().equals(eid)) {
            throw new EntityNotFoundException("Facture introuvable : " + id);
        }
        return f;
    }

    private String orEmpty(String s) { return s != null ? s : ""; }

    // ─── Mappers ────────────────────────────────────────────────────────────

    private FactureDto.Response toResponse(Facture f, LocalDate today) {
        List<FactureDto.LigneResponse> lignes = f.getLignes().stream()
                .map(l -> new FactureDto.LigneResponse(
                        l.getId(), l.getDescription(), l.getQuantite(), l.getPrixUnitaire(),
                        l.getTauxTva(), l.getMontantHt(), l.getMontantTva(), l.getMontantTtc(),
                        l.getCompteProduit(), l.getOrdre()))
                .collect(Collectors.toList());
        return new FactureDto.Response(
                f.getId(), f.getNumero(), f.getDateFacture(), f.getDateEcheance(),
                f.getTiers() != null ? f.getTiers().getId() : null,
                f.getNomTiers(), f.getAdresseTiers(), f.getIfuClient(),
                f.getStatut(), f.getMontantHt(), f.getMontantTva(), f.getMontantTtc(),
                f.getNotes(), lignes,
                isEnRetard(f, today),
                f.getNfn(), f.getCodeControle(), f.getStatutNormalisation(), f.isEstNormalisee());
    }

    private FactureDto.Resume toResume(Facture f, LocalDate today) {
        return new FactureDto.Resume(
                f.getId(), f.getNumero(), f.getDateFacture(), f.getDateEcheance(),
                f.getTiers() != null ? f.getTiers().getId() : null,
                f.getNomTiers(), f.getStatut(),
                f.getMontantHt(), f.getMontantTva(), f.getMontantTtc(),
                isEnRetard(f, today),
                f.getStatutNormalisation(), f.isEstNormalisee());
    }

    private boolean isEnRetard(Facture f, LocalDate today) {
        return f.getStatut() == Facture.Statut.EMISE
                && f.getDateEcheance() != null
                && today.isAfter(f.getDateEcheance());
    }
}
