package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.affectation.AffectationDto;
import com.edefence.comptabia.repository.*;
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
public class AffectationService {

    private final ExerciceComptableRepository exerciceRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final LigneEcritureRepository ligneRepo;
    private final CompteComptableRepository compteRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final UtilisateurRepository utilisateurRepo;

    @Transactional(readOnly = true)
    public AffectationDto.InfoResultat getInfo(UUID entrepriseId, int annee) {
        ExerciceComptable ex = exerciceRepo.findByEntrepriseIdAndAnnee(entrepriseId, annee)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Exercice " + annee + " introuvable."));

        BigDecimal resultat = getResultat(entrepriseId, annee);
        boolean dejaAffecte = ecritureRepo.existsByNumeroPieceAndEntrepriseId(
                "AFFECT-" + annee, entrepriseId);

        return new AffectationDto.InfoResultat(
                annee, ex.getStatut().name(), resultat, dejaAffecte);
    }

    @Transactional
    public AffectationDto.AffectationResponse affecter(
            UUID entrepriseId, int annee,
            AffectationDto.AffectationRequest request,
            String userEmail) {

        ExerciceComptable ex = exerciceRepo.findByEntrepriseIdAndAnnee(entrepriseId, annee)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Exercice " + annee + " introuvable."));

        if (ex.getStatut() != ExerciceComptable.Statut.CLOTURE)
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "L'exercice " + annee + " doit être clôturé avant l'affectation.");

        if (ecritureRepo.existsByNumeroPieceAndEntrepriseId("AFFECT-" + annee, entrepriseId))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "L'affectation de l'exercice " + annee + " a déjà été effectuée.");

        BigDecimal resultat = getResultat(entrepriseId, annee);
        if (resultat.compareTo(BigDecimal.ZERO) == 0)
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Le résultat de l'exercice " + annee + " est nul. Aucune affectation nécessaire.");

        // Validate sum of distribution lines = |résultat|
        BigDecimal sumLignes = request.lignes().stream()
                .map(AffectationDto.LigneAffectation::montant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (sumLignes.compareTo(resultat.abs()) != 0)
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "La somme des affectations (" + sumLignes
                    + ") ne correspond pas au résultat (" + resultat.abs() + ").");

        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable."));
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));
        CompteComptable compte1301 = compteRepo.findByNumeroAndEntrepriseId("1301", entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                        "Compte 1301 introuvable dans le plan de comptes."));

        String numeroPiece = "AFFECT-" + annee;
        LocalDate dateAffectation = LocalDate.of(annee + 1, 1, 1);
        BigDecimal montantAbsolu = resultat.abs();
        boolean benefice = resultat.compareTo(BigDecimal.ZERO) > 0;

        EcritureComptable ecriture = EcritureComptable.builder()
                .numeroPiece(numeroPiece)
                .libelle("Affectation résultat exercice " + annee)
                .dateEcriture(dateAffectation)
                .journal(EcritureComptable.Journal.OD)
                .statut(EcritureComptable.Statut.VALIDEE)
                .entreprise(entreprise)
                .createdBy(auteur)
                .build();

        if (benefice) {
            // DR 1301 / CR distribution accounts
            ecriture.getLignes().add(buildLigne(ecriture, compte1301,
                    montantAbsolu, BigDecimal.ZERO, "Affectation résultat " + annee));
            for (AffectationDto.LigneAffectation ligne : request.lignes()) {
                CompteComptable compte = compteRepo
                        .findByNumeroAndEntrepriseId(ligne.compteNumero(), entrepriseId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                                "Compte " + ligne.compteNumero() + " introuvable."));
                ecriture.getLignes().add(buildLigne(ecriture, compte,
                        BigDecimal.ZERO, ligne.montant(), ligne.libelle()));
            }
        } else {
            // DR distribution accounts (RAN déficitaire) / CR 1301
            for (AffectationDto.LigneAffectation ligne : request.lignes()) {
                CompteComptable compte = compteRepo
                        .findByNumeroAndEntrepriseId(ligne.compteNumero(), entrepriseId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY,
                                "Compte " + ligne.compteNumero() + " introuvable."));
                ecriture.getLignes().add(buildLigne(ecriture, compte,
                        ligne.montant(), BigDecimal.ZERO, ligne.libelle()));
            }
            ecriture.getLignes().add(buildLigne(ecriture, compte1301,
                    BigDecimal.ZERO, montantAbsolu, "Affectation résultat " + annee));
        }

        ecritureRepo.save(ecriture);

        List<AffectationDto.LigneAffectation> lignesReponse = request.lignes();
        return new AffectationDto.AffectationResponse(numeroPiece, annee, resultat, lignesReponse);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private BigDecimal getResultat(UUID entrepriseId, int annee) {
        LocalDate from = LocalDate.of(annee, 1, 1);
        LocalDate to   = LocalDate.of(annee, 12, 31);

        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);
        for (Object[] row : balance) {
            String numero = (String) row[0];
            if ("1301".equals(numero)) {
                BigDecimal debit  = (BigDecimal) row[3];
                BigDecimal credit = (BigDecimal) row[4];
                return credit.subtract(debit); // positive = bénéfice
            }
        }
        return BigDecimal.ZERO;
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
}
