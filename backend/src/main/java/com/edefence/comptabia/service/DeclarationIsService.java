package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.is.DeclarationIsDto;
import com.edefence.comptabia.repository.*;
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

@Service
@RequiredArgsConstructor
public class DeclarationIsService {

    private static final BigDecimal TAUX_MINIMUM_CA = new BigDecimal("0.005"); // 0.5% CA minimum forfaitaire
    private static final BigDecimal CENT = new BigDecimal("100");

    private final DeclarationIsRepository isRepo;
    private final LigneEcritureRepository ligneRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository compteRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final UtilisateurRepository utilisateurRepo;

    @Transactional(readOnly = true)
    public List<DeclarationIsDto.Response> lister(UUID entrepriseId) {
        return isRepo.findByEntrepriseIdOrderByExerciceDesc(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public DeclarationIsDto.Response getOrCompute(UUID entrepriseId, int exercice) {
        return isRepo.findByEntrepriseIdAndExercice(entrepriseId, exercice)
                .map(this::toResponse)
                .orElseGet(() -> computeNew(entrepriseId, exercice));
    }

    @Transactional
    public DeclarationIsDto.Response sauvegarder(UUID entrepriseId, int exercice,
                                                  DeclarationIsDto.SaveRequest req) {
        DeclarationIs decl = isRepo.findByEntrepriseIdAndExercice(entrepriseId, exercice)
                .orElseGet(() -> {
                    Entreprise e = entrepriseRepo.getReferenceById(entrepriseId);
                    return DeclarationIs.builder().entreprise(e).exercice(exercice).build();
                });

        if (decl.getStatut() == DeclarationIs.Statut.VALIDEE)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La déclaration IS " + exercice + " est déjà validée.");

        BigDecimal resultatComptable = getResultatComptable(entrepriseId, exercice);
        BigDecimal reintagrations   = coalesce(req.reintagrations());
        BigDecimal deductions        = coalesce(req.deductions());
        BigDecimal taux              = coalesce(req.tauxIs(), new BigDecimal("25.00"));
        BigDecimal minForf           = coalesce(req.minimumForfaitaire());

        BigDecimal resultatFiscal = resultatComptable.add(reintagrations).subtract(deductions);
        BigDecimal isTheorique    = resultatFiscal.compareTo(BigDecimal.ZERO) > 0
                ? resultatFiscal.multiply(taux).divide(CENT, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal isDu = isTheorique.max(minForf);

        decl.setResultatComptable(resultatComptable);
        decl.setReintagrations(reintagrations);
        decl.setDeductions(deductions);
        decl.setResultatFiscal(resultatFiscal);
        decl.setTauxIs(taux);
        decl.setIsTheorique(isTheorique);
        decl.setMinimumForfaitaire(minForf);
        decl.setIsDu(isDu);

        return toResponse(isRepo.save(decl));
    }

    @Transactional
    public DeclarationIsDto.Response valider(UUID entrepriseId, int exercice, String userEmail) {
        DeclarationIs decl = isRepo.findByEntrepriseIdAndExercice(entrepriseId, exercice)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Déclaration IS " + exercice + " introuvable. Sauvegardez d'abord."));

        if (decl.getStatut() == DeclarationIs.Statut.VALIDEE)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "La déclaration IS " + exercice + " est déjà validée.");

        if (decl.getIsDu().compareTo(BigDecimal.ZERO) <= 0)
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Aucun IS dû pour l'exercice " + exercice + ". Validation impossible.");

        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable."));
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));

        CompteComptable compte8951 = compteRepo.findByNumeroAndEntrepriseId("8951", entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "Compte 8951 (Impôt sur le bénéfice) introuvable dans le plan de comptes."));
        CompteComptable compte4410 = compteRepo.findByNumeroAndEntrepriseId("4410", entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "Compte 4410 (État, IS à payer) introuvable dans le plan de comptes."));

        LocalDate dateDecl = LocalDate.of(exercice + 1, 3, 31);
        EcritureComptable ecriture = EcritureComptable.builder()
                .numeroPiece("IS-" + exercice)
                .libelle("Impôt sur les sociétés exercice " + exercice)
                .dateEcriture(dateDecl)
                .journal(EcritureComptable.Journal.OD)
                .statut(EcritureComptable.Statut.VALIDEE)
                .entreprise(entreprise)
                .createdBy(auteur)
                .build();

        ecriture.getLignes().add(LigneEcriture.builder()
                .ecriture(ecriture).compte(compte8951)
                .debit(decl.getIsDu()).credit(BigDecimal.ZERO)
                .libelle("IS exercice " + exercice)
                .build());
        ecriture.getLignes().add(LigneEcriture.builder()
                .ecriture(ecriture).compte(compte4410)
                .debit(BigDecimal.ZERO).credit(decl.getIsDu())
                .libelle("IS à payer exercice " + exercice)
                .build());

        EcritureComptable saved = ecritureRepo.save(ecriture);
        decl.setStatut(DeclarationIs.Statut.VALIDEE);
        decl.setEcritureId(saved.getId());

        return toResponse(isRepo.save(decl));
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private DeclarationIsDto.Response computeNew(UUID entrepriseId, int exercice) {
        BigDecimal resultatComptable = getResultatComptable(entrepriseId, exercice);
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        BigDecimal ca  = isRepo.sumChiffreAffaires(entrepriseId, from, to);
        BigDecimal minForf = ca != null
                ? ca.multiply(TAUX_MINIMUM_CA).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal taux = new BigDecimal("25.00");
        BigDecimal isTheorique = resultatComptable.compareTo(BigDecimal.ZERO) > 0
                ? resultatComptable.multiply(taux).divide(CENT, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal isDu = isTheorique.max(minForf);

        return new DeclarationIsDto.Response(null, exercice, resultatComptable,
                BigDecimal.ZERO, BigDecimal.ZERO, resultatComptable,
                taux, isTheorique, minForf, isDu, "BROUILLON", null);
    }

    private BigDecimal getResultatComptable(UUID entrepriseId, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);
        for (Object[] row : balance) {
            if ("1301".equals(row[0])) {
                BigDecimal debit  = (BigDecimal) row[3];
                BigDecimal credit = (BigDecimal) row[4];
                return credit.subtract(debit);
            }
        }
        return BigDecimal.ZERO;
    }

    private BigDecimal coalesce(BigDecimal val) {
        return val != null ? val : BigDecimal.ZERO;
    }

    private BigDecimal coalesce(BigDecimal val, BigDecimal fallback) {
        return val != null ? val : fallback;
    }

    private DeclarationIsDto.Response toResponse(DeclarationIs d) {
        return new DeclarationIsDto.Response(
                d.getId(), d.getExercice(),
                d.getResultatComptable(), d.getReintagrations(), d.getDeductions(),
                d.getResultatFiscal(), d.getTauxIs(), d.getIsTheorique(),
                d.getMinimumForfaitaire(), d.getIsDu(),
                d.getStatut().name(), d.getEcritureId());
    }
}
