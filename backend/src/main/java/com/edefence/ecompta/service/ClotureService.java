package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.exercice.ExerciceDto;
import com.edefence.ecompta.repository.*;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClotureService {

    private final ExerciceComptableRepository exerciceRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final LigneEcritureRepository ligneRepo;
    private final CompteComptableRepository compteRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final AuditService auditSvc;

    // ─── Listing ──────────────────────────────────────────────────────────────

    @Transactional
    public List<ExerciceDto.Response> lister(UUID entrepriseId) {
        ensureCurrentYearExists(entrepriseId);
        return exerciceRepo.findByEntrepriseIdOrderByAnneeDesc(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    // ─── Clôture ─────────────────────────────────────────────────────────────

    @Transactional
    public ExerciceDto.ClotureResponse cloturer(UUID entrepriseId, int annee, String userEmail) {
        ExerciceComptable ex = exerciceRepo.findByEntrepriseIdAndAnnee(entrepriseId, annee)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Exercice " + annee + " introuvable."));

        if (ex.getStatut() == ExerciceComptable.Statut.CLOTURE)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "L'exercice " + annee + " est déjà clôturé.");

        LocalDate from = LocalDate.of(annee, 1, 1);
        LocalDate to   = LocalDate.of(annee, 12, 31);

        // Guard: brouillons en attente
        long brouillons = ecritureRepo.countBrouillonsByPeriod(entrepriseId, from, to);
        if (brouillons > 0)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    brouillons + " écriture(s) en brouillon pour " + annee
                    + ". Validez-les ou supprimez-les avant de clôturer.");

        // Compute balances for classes 6, 7, 8
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);

        BigDecimal totalCharges = BigDecimal.ZERO;
        BigDecimal totalProduits = BigDecimal.ZERO;

        // Lines for closing entries grouped by direction
        List<Object[]> lignesCharges = new ArrayList<>();   // [compte, net] → DR 1301 / CR compte
        List<Object[]> lignesProduits = new ArrayList<>();  // [compte, net] → DR compte / CR 1301

        for (Object[] row : balance) {
            int classe      = ((Number) row[2]).intValue();
            BigDecimal d    = (BigDecimal) row[3];
            BigDecimal c    = (BigDecimal) row[4];
            BigDecimal net  = d.subtract(c); // positive = net debit

            if (classe != 6 && classe != 7 && classe != 8) continue;
            if (net.compareTo(BigDecimal.ZERO) == 0) continue;

            String numero = (String) row[0];

            boolean isCharge = (classe == 6) || (classe == 8 && net.compareTo(BigDecimal.ZERO) > 0);
            if (isCharge) {
                totalCharges = totalCharges.add(net.abs());
                lignesCharges.add(new Object[]{numero, net.abs()});
            } else {
                totalProduits = totalProduits.add(net.abs());
                lignesProduits.add(new Object[]{numero, net.abs()});
            }
        }

        BigDecimal resultatNet = totalProduits.subtract(totalCharges);

        // Fetch helpers
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));
        CompteComptable compte1301 = compteRepo
                .findByNumeroAndEntrepriseId("1301", entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "Compte 1301 (Résultat net) introuvable dans le plan de comptes."));

        // Create closing entry for charges (if any)
        if (!lignesCharges.isEmpty()) {
            EcritureComptable ecCharges = buildEcriture(
                    "CL-" + annee + "-CH",
                    "Clôture charges " + annee,
                    to, entreprise, auteur);
            // DR 1301 / CR each charge account
            ecCharges.getLignes().add(buildLigne(ecCharges, compte1301, totalCharges, BigDecimal.ZERO,
                    "Résultat net " + annee));
            for (Object[] entry : lignesCharges) {
                String numero   = (String) entry[0];
                BigDecimal montant = (BigDecimal) entry[1];
                compteRepo.findByNumeroAndEntrepriseId(numero, entrepriseId).ifPresent(cc ->
                        ecCharges.getLignes().add(
                                buildLigne(ecCharges, cc, BigDecimal.ZERO, montant, "Clôture charges " + annee)));
            }
            ecritureRepo.save(ecCharges);
        }

        // Create closing entry for produits (if any)
        if (!lignesProduits.isEmpty()) {
            EcritureComptable ecProduits = buildEcriture(
                    "CL-" + annee + "-PR",
                    "Clôture produits " + annee,
                    to, entreprise, auteur);
            // DR each produit account / CR 1301
            for (Object[] entry : lignesProduits) {
                String numero    = (String) entry[0];
                BigDecimal montant = (BigDecimal) entry[1];
                compteRepo.findByNumeroAndEntrepriseId(numero, entrepriseId).ifPresent(cc ->
                        ecProduits.getLignes().add(
                                buildLigne(ecProduits, cc, montant, BigDecimal.ZERO, "Clôture produits " + annee)));
            }
            ecProduits.getLignes().add(buildLigne(ecProduits, compte1301, BigDecimal.ZERO, totalProduits,
                    "Résultat net " + annee));
            ecritureRepo.save(ecProduits);
        }

        // Seal the exercise
        ex.setStatut(ExerciceComptable.Statut.CLOTURE);
        ex.setDateCloture(to);
        ex.setClotureAt(OffsetDateTime.now());
        exerciceRepo.save(ex);

        log.info("Exercice {} clôturé pour entreprise {} — résultat net : {}",
                annee, entrepriseId, resultatNet);
        auditSvc.log(entrepriseId, userEmail, "EXERCICE_CLOTURE", "EXERCICE",
                String.valueOf(annee), "Résultat net : " + resultatNet);

        return new ExerciceDto.ClotureResponse(
                ex.getId(), ex.getAnnee(), ex.getStatut().name(),
                ex.getDateCloture(), totalCharges, totalProduits, resultatNet);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void ensureCurrentYearExists(UUID entrepriseId) {
        int currentYear = LocalDate.now().getYear();
        if (!exerciceRepo.existsByEntrepriseIdAndAnnee(entrepriseId, currentYear)) {
            Entreprise entreprise = entrepriseRepo.getReferenceById(entrepriseId);
            exerciceRepo.save(ExerciceComptable.builder()
                    .annee(currentYear)
                    .dateOuverture(LocalDate.of(currentYear, 1, 1))
                    .entreprise(entreprise)
                    .build());
        }
    }

    private EcritureComptable buildEcriture(String numeroPiece, String libelle,
                                             LocalDate date, Entreprise entreprise, Utilisateur auteur) {
        return EcritureComptable.builder()
                .numeroPiece(numeroPiece)
                .libelle(libelle)
                .dateEcriture(date)
                .journal(EcritureComptable.Journal.OD)
                .statut(EcritureComptable.Statut.VALIDEE)
                .entreprise(entreprise)
                .createdBy(auteur)
                .build();
    }

    private LigneEcriture buildLigne(EcritureComptable ecriture, CompteComptable compte,
                                      BigDecimal debit, BigDecimal credit, String libelle) {
        return LigneEcriture.builder()
                .ecriture(ecriture)
                .compte(compte)
                .debit(debit)
                .credit(credit)
                .libelle(libelle)
                .build();
    }

    private ExerciceDto.Response toResponse(ExerciceComptable ex) {
        return new ExerciceDto.Response(
                ex.getId(), ex.getAnnee(), ex.getStatut().name(),
                ex.getDateOuverture(), ex.getDateCloture(), ex.getClotureAt());
    }
}
