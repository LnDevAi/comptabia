package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.regularisation.RegularisationDto;
import com.edefence.ecompta.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegularisationService {

    private final RegularisationRepository regularisationRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository   compteRepo;
    private final EntrepriseRepository        entrepriseRepo;

    // ─── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RegularisationDto.Response> findAll(UUID eid, int exercice) {
        return regularisationRepo.findByExercice(eid, exercice)
                .stream().map(this::toResponse).toList();
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    @Transactional
    public RegularisationDto.Response create(UUID eid, RegularisationDto.SaveRequest req) {
        Regularisation r = Regularisation.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .type(req.type())
                .libelle(req.libelle())
                .compteContrepartie(req.compteContrepartie())
                .montant(req.montant())
                .exercice(req.exercice())
                .dateRegularisation(req.dateRegularisation())
                .dateExtourne(req.dateExtourne())
                .build();
        return toResponse(regularisationRepo.save(r));
    }

    @Transactional
    public RegularisationDto.Response update(UUID id, UUID eid, RegularisationDto.SaveRequest req) {
        Regularisation r = findOrThrow(id, eid);
        if (r.getStatut() != Regularisation.Statut.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une régularisation en attente peut être modifiée");
        }
        r.setType(req.type());
        r.setLibelle(req.libelle());
        r.setCompteContrepartie(req.compteContrepartie());
        r.setMontant(req.montant());
        r.setExercice(req.exercice());
        r.setDateRegularisation(req.dateRegularisation());
        r.setDateExtourne(req.dateExtourne());
        return toResponse(regularisationRepo.save(r));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        Regularisation r = findOrThrow(id, eid);
        if (r.getStatut() != Regularisation.Statut.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une régularisation en attente peut être supprimée");
        }
        regularisationRepo.delete(r);
    }

    // ─── Comptabiliser ───────────────────────────────────────────────────────

    @Transactional
    public RegularisationDto.Response comptabiliser(UUID id, UUID eid,
                                                     Entreprise entreprise,
                                                     Utilisateur auteur) {
        Regularisation r = findOrThrow(id, eid);
        if (r.getStatut() != Regularisation.Statut.EN_ATTENTE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Déjà comptabilisée");
        }

        String compteReg = compteRegularisation(r.getType());
        String intituleReg = intituleCompteReg(r.getType());
        int classeReg = classeCompteReg(r.getType());

        CompteComptable cReg = getOrCreate(entreprise, compteReg, intituleReg, classeReg);
        CompteComptable cCtr = getOrCreate(entreprise, r.getCompteContrepartie(),
                "Compte " + r.getCompteContrepartie(), classeContrepartie(r.getType()));

        String piece = "REG-" + r.getExercice() + "-" + r.getId().toString().substring(0, 6).toUpperCase();
        EcritureComptable ecriture = buildEcriture(entreprise, auteur, piece,
                r.getDateRegularisation(), r.getLibelle(), r.getType(), r.getMontant(),
                cReg, cCtr, false);

        r.setEcriture(ecritureRepo.save(ecriture));
        r.setStatut(Regularisation.Statut.COMPTABILISEE);
        return toResponse(regularisationRepo.save(r));
    }

    // ─── Extourner ───────────────────────────────────────────────────────────

    @Transactional
    public RegularisationDto.Response extourner(UUID id, UUID eid,
                                                 Entreprise entreprise,
                                                 Utilisateur auteur) {
        Regularisation r = findOrThrow(id, eid);
        if (r.getStatut() != Regularisation.Statut.COMPTABILISEE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Seule une régularisation comptabilisée peut être extournée");
        }

        String compteReg = compteRegularisation(r.getType());
        String intituleReg = intituleCompteReg(r.getType());
        int classeReg = classeCompteReg(r.getType());

        CompteComptable cReg = getOrCreate(entreprise, compteReg, intituleReg, classeReg);
        CompteComptable cCtr = getOrCreate(entreprise, r.getCompteContrepartie(),
                "Compte " + r.getCompteContrepartie(), classeContrepartie(r.getType()));

        String piece = "EXT-" + r.getExercice() + "-" + r.getId().toString().substring(0, 6).toUpperCase();
        EcritureComptable extourne = buildEcriture(entreprise, auteur, piece,
                r.getDateExtourne(), "Extourne — " + r.getLibelle(), r.getType(), r.getMontant(),
                cReg, cCtr, true);

        r.setEcritureExtourne(ecritureRepo.save(extourne));
        r.setStatut(Regularisation.Statut.EXTOURNEE);
        return toResponse(regularisationRepo.save(r));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private EcritureComptable buildEcriture(Entreprise entreprise, Utilisateur auteur,
                                             String piece, LocalDate date, String libelle,
                                             Regularisation.TypeRegularisation type,
                                             BigDecimal montant,
                                             CompteComptable cReg, CompteComptable cCtr,
                                             boolean inverse) {
        EcritureComptable e = EcritureComptable.builder()
                .entreprise(entreprise)
                .createdBy(auteur)
                .numeroPiece(piece)
                .dateEcriture(date)
                .libelle(libelle)
                .journal(EcritureComptable.Journal.OD)
                .statut(EcritureComptable.Statut.VALIDEE)
                .build();

        // Schéma de base (non-inverse) :
        // CCA : DR cReg(476) / CR cCtr(6xx)
        // PCA : DR cCtr(7xx) / CR cReg(477)
        // CAP : DR cCtr(6xx) / CR cReg(408)
        // PAR : DR cReg(418) / CR cCtr(7xx)
        boolean debiteReg = type == Regularisation.TypeRegularisation.CCA
                         || type == Regularisation.TypeRegularisation.PAR;

        if (inverse) debiteReg = !debiteReg;

        BigDecimal debitReg  = debiteReg ? montant : BigDecimal.ZERO;
        BigDecimal creditReg = debiteReg ? BigDecimal.ZERO : montant;

        e.getLignes().add(LigneEcriture.builder()
                .ecriture(e).compte(cReg)
                .libelle(libelle)
                .debit(debitReg).credit(creditReg)
                .build());

        e.getLignes().add(LigneEcriture.builder()
                .ecriture(e).compte(cCtr)
                .libelle(libelle)
                .debit(creditReg).credit(debitReg)
                .build());

        return e;
    }

    private String compteRegularisation(Regularisation.TypeRegularisation type) {
        return switch (type) {
            case CCA -> "476";
            case PCA -> "477";
            case CAP -> "408";
            case PAR -> "418";
        };
    }

    private String intituleCompteReg(Regularisation.TypeRegularisation type) {
        return switch (type) {
            case CCA -> "Charges constatées d'avance";
            case PCA -> "Produits constatés d'avance";
            case CAP -> "Fournisseurs - factures non parvenues";
            case PAR -> "Clients - produits à recevoir";
        };
    }

    private int classeCompteReg(Regularisation.TypeRegularisation type) {
        return switch (type) {
            case CCA, PCA -> 4;
            case CAP -> 4;
            case PAR -> 4;
        };
    }

    private int classeContrepartie(Regularisation.TypeRegularisation type) {
        return switch (type) {
            case CCA, CAP -> 6;
            case PCA, PAR -> 7;
        };
    }

    private CompteComptable getOrCreate(Entreprise entreprise, String numero,
                                         String intitule, int classe) {
        return compteRepo.findByNumeroAndEntrepriseId(numero, entreprise.getId())
                .orElseGet(() -> compteRepo.save(CompteComptable.builder()
                        .numero(numero)
                        .intitule(intitule)
                        .classe(classe)
                        .entreprise(entreprise)
                        .build()));
    }

    private Regularisation findOrThrow(UUID id, UUID eid) {
        return regularisationRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Régularisation introuvable"));
    }

    private RegularisationDto.Response toResponse(Regularisation r) {
        return new RegularisationDto.Response(
                r.getId(), r.getType(), r.getLibelle(), r.getCompteContrepartie(),
                r.getMontant(), r.getExercice(), r.getDateRegularisation(), r.getDateExtourne(),
                r.getStatut(),
                r.getEcriture() != null ? r.getEcriture().getId() : null,
                r.getEcritureExtourne() != null ? r.getEcritureExtourne().getId() : null,
                compteRegularisation(r.getType()),
                description(r.getType())
        );
    }

    private String description(Regularisation.TypeRegularisation type) {
        return switch (type) {
            case CCA -> "Charge payée sur cet exercice mais relative à la période suivante → DR 476 / CR 6xx";
            case PCA -> "Produit encaissé sur cet exercice mais relatif à la période suivante → DR 7xx / CR 477";
            case CAP -> "Charge relative à cet exercice, facture non encore reçue → DR 6xx / CR 408";
            case PAR -> "Produit relatif à cet exercice, non encore facturé → DR 418 / CR 7xx";
        };
    }
}
