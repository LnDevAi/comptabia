package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.paie.PayeDto;
import com.edefence.comptabia.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PayeService {

    private final FeuillePaieRepository    paieRepo;
    private final EntrepriseRepository     entrepriseRepo;
    private final UtilisateurRepository    utilisateurRepo;
    private final CompteComptableRepository compteRepo;
    private final EcritureComptableRepository ecritureRepo;

    // ─── Lister ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PayeDto.Response> lister(UUID entrepriseId, int exercice) {
        return paieRepo
            .findByEntrepriseIdAndExerciceOrderByMoisAsc(entrepriseId, exercice)
            .stream().map(this::toResponse).toList();
    }

    // ─── Sauvegarder (créer ou mettre à jour en brouillon) ───────────────────

    @Transactional
    public PayeDto.Response sauvegarder(UUID entrepriseId, int exercice,
                                         PayeDto.SauvegarderRequest req,
                                         String userEmail) {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable."));

        FeuillePaie fp = paieRepo
            .findByEntrepriseIdAndExerciceAndMois(entrepriseId, exercice, req.mois())
            .orElseGet(() -> FeuillePaie.builder().entreprise(entreprise)
                .exercice(exercice).build());

        if (fp.getStatut() == FeuillePaie.Statut.COMPTABILISEE)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "La paie du mois " + req.mois() + "/" + exercice + " est déjà comptabilisée.");

        BigDecimal netAPayer = req.masseSalarialeBrute()
            .subtract(req.cotisationsSalariales())
            .subtract(req.impotRetenu());

        fp.setMois(req.mois());
        fp.setNbSalaries(req.nbSalaries());
        fp.setMasseSalarialeBrute(req.masseSalarialeBrute());
        fp.setCotisationsSalariales(req.cotisationsSalariales());
        fp.setCotisationsPatronales(req.cotisationsPatronales());
        fp.setImpotRetenu(req.impotRetenu());
        fp.setNetAPayer(netAPayer);

        return toResponse(paieRepo.save(fp));
    }

    // ─── Comptabiliser ───────────────────────────────────────────────────────

    @Transactional
    public PayeDto.Response comptabiliser(UUID entrepriseId, UUID id, String userEmail) {
        FeuillePaie fp = paieRepo.findByIdAndEntrepriseId(id, entrepriseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feuille de paie introuvable."));

        if (fp.getStatut() == FeuillePaie.Statut.COMPTABILISEE)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Déjà comptabilisée.");

        if (fp.getMasseSalarialeBrute().compareTo(BigDecimal.ZERO) <= 0)
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                "La masse salariale brute doit être > 0.");

        Entreprise  entreprise = fp.getEntreprise();
        Utilisateur auteur     = utilisateurRepo.findByEmail(userEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));

        // ── Comptes SYSCOHADA (auto-créés si absents) ─────────────────────────
        CompteComptable c661  = getOrCreate(entreprise, "661",  "Rémunérations directes versées",         6);
        CompteComptable c664  = getOrCreate(entreprise, "664",  "Charges sociales — cotisations patronales", 6);
        CompteComptable c431  = getOrCreate(entreprise, "431",  "Sécurité sociale",                        4);
        CompteComptable c447  = getOrCreate(entreprise, "447",  "État — IPTS",                             4);
        CompteComptable c4221 = getOrCreate(entreprise, "4221", "Personnel — rémunérations dues",          4);

        LocalDate dateEcriture = LocalDate.of(fp.getExercice(), fp.getMois(),
            LocalDate.of(fp.getExercice(), fp.getMois(), 1).lengthOfMonth());

        String numeroPiece = "PAIE-" + fp.getExercice()
            + String.format("%02d", fp.getMois());

        if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(numeroPiece, entrepriseId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "L'écriture " + numeroPiece + " existe déjà.");

        EcritureComptable ecriture = EcritureComptable.builder()
            .numeroPiece(numeroPiece)
            .libelle("Paie " + moisLibelle(fp.getMois()) + " " + fp.getExercice())
            .dateEcriture(dateEcriture)
            .journal(EcritureComptable.Journal.OD)
            .statut(EcritureComptable.Statut.VALIDEE)
            .entreprise(entreprise)
            .createdBy(auteur)
            .build();

        String label = moisLibelle(fp.getMois()) + " " + fp.getExercice();

        // DR 661 — Salaires bruts
        ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture).compte(c661)
            .debit(fp.getMasseSalarialeBrute()).credit(BigDecimal.ZERO)
            .libelle("Salaires bruts " + label).build());

        // DR 664 — Charges patronales
        if (fp.getCotisationsPatronales().compareTo(BigDecimal.ZERO) > 0)
            ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture).compte(c664)
                .debit(fp.getCotisationsPatronales()).credit(BigDecimal.ZERO)
                .libelle("Charges patronales " + label).build());

        // CR 431 — CNSS (part salariale + patronale)
        BigDecimal totalCnss = fp.getCotisationsSalariales().add(fp.getCotisationsPatronales());
        if (totalCnss.compareTo(BigDecimal.ZERO) > 0)
            ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture).compte(c431)
                .debit(BigDecimal.ZERO).credit(totalCnss)
                .libelle("CNSS " + label).build());

        // CR 447 — IPTS
        if (fp.getImpotRetenu().compareTo(BigDecimal.ZERO) > 0)
            ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture).compte(c447)
                .debit(BigDecimal.ZERO).credit(fp.getImpotRetenu())
                .libelle("IPTS " + label).build());

        // CR 4221 — Net à payer
        ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture).compte(c4221)
            .debit(BigDecimal.ZERO).credit(fp.getNetAPayer())
            .libelle("Net à payer " + label).build());

        EcritureComptable saved = ecritureRepo.save(ecriture);
        fp.setStatut(FeuillePaie.Statut.COMPTABILISEE);
        fp.setEcriture(saved);

        return toResponse(paieRepo.save(fp));
    }

    // ─── Supprimer ───────────────────────────────────────────────────────────

    @Transactional
    public void supprimer(UUID entrepriseId, UUID id) {
        FeuillePaie fp = paieRepo.findByIdAndEntrepriseId(id, entrepriseId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Feuille de paie introuvable."));
        if (fp.getStatut() == FeuillePaie.Statut.COMPTABILISEE)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Impossible de supprimer une paie comptabilisée.");
        paieRepo.delete(fp);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private CompteComptable getOrCreate(Entreprise entreprise, String numero,
                                         String intitule, int classe) {
        return compteRepo.findByNumeroAndEntrepriseId(numero, entreprise.getId())
            .orElseGet(() -> compteRepo.save(CompteComptable.builder()
                .entreprise(entreprise)
                .numero(numero)
                .intitule(intitule)
                .classe(classe)
                .actif(true)
                .build()));
    }

    private PayeDto.Response toResponse(FeuillePaie fp) {
        BigDecimal coutTotal = fp.getMasseSalarialeBrute().add(fp.getCotisationsPatronales());
        return new PayeDto.Response(
            fp.getId(), fp.getExercice(), fp.getMois(),
            moisLibelle(fp.getMois()),
            fp.getNbSalaries(),
            fp.getMasseSalarialeBrute(),
            fp.getCotisationsSalariales(),
            fp.getCotisationsPatronales(),
            fp.getImpotRetenu(),
            fp.getNetAPayer(),
            coutTotal,
            fp.getStatut().name(),
            fp.getEcriture() != null ? fp.getEcriture().getId() : null,
            fp.getCreatedAt()
        );
    }

    private static String moisLibelle(int mois) {
        return Month.of(mois).getDisplayName(TextStyle.FULL, Locale.FRENCH);
    }
}
