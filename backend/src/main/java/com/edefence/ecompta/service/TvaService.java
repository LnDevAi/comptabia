package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.tva.TvaDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TvaService {

    private final DeclarationTvaRepository  declarationRepo;
    private final EntrepriseRepository      entrepriseRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository compteRepo;
    private final UtilisateurRepository     utilisateurRepo;

    // ─── Historique ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TvaDto.Declaration> lister(UUID entrepriseId) {
        return declarationRepo.findByEntrepriseIdOrderByPeriodeDebutDesc(entrepriseId)
                .stream().map(this::toDeclaration).toList();
    }

    // ─── Simulation ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TvaDto.Simulation simuler(UUID entrepriseId, LocalDate debut, LocalDate fin) {
        BigDecimal collectee  = declarationRepo.sumTvaCollectee(entrepriseId, debut, fin);
        BigDecimal deductible = declarationRepo.sumTvaDeductible(entrepriseId, debut, fin);
        BigDecimal aDecaisser = collectee.subtract(deductible);

        List<Object[]> rows = declarationRepo.detailParCompte(entrepriseId, debut, fin);
        List<TvaDto.LigneDetail> detail = new ArrayList<>();
        for (Object[] row : rows) {
            String numero  = (String) row[0];
            String intitule= (String) row[1];
            BigDecimal dbt = (BigDecimal) row[2];
            BigDecimal crd = (BigDecimal) row[3];
            String type    = numero.startsWith("443") ? "COLLECTEE" : "DEDUCTIBLE";
            detail.add(new TvaDto.LigneDetail(numero, intitule, dbt, crd, type));
        }

        boolean dejaDeclare = declarationRepo
                .existsByEntrepriseIdAndPeriodeDebutAndPeriodeFin(entrepriseId, debut, fin);

        return new TvaDto.Simulation(debut, fin, collectee, deductible, aDecaisser, detail, dejaDeclare);
    }

    // ─── Valider et générer OD ───────────────────────────────────────────────

    @Transactional
    public TvaDto.Declaration valider(UUID entrepriseId, LocalDate debut, LocalDate fin, String userEmail) {
        if (declarationRepo.existsByEntrepriseIdAndPeriodeDebutAndPeriodeFin(entrepriseId, debut, fin)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une déclaration TVA existe déjà pour cette période.");
        }

        BigDecimal collectee  = declarationRepo.sumTvaCollectee(entrepriseId, debut, fin);
        BigDecimal deductible = declarationRepo.sumTvaDeductible(entrepriseId, debut, fin);
        BigDecimal aDecaisser = collectee.subtract(deductible);

        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        UUID ecritureId = null;
        if (aDecaisser.compareTo(BigDecimal.ZERO) != 0) {
            ecritureId = genererEcritureOD(entreprise, debut, fin, collectee, deductible, aDecaisser, userEmail);
        }

        DeclarationTva decl = DeclarationTva.builder()
                .entreprise(entreprise)
                .periodeDebut(debut)
                .periodeFin(fin)
                .tvaCollectee(collectee)
                .tvaDeductible(deductible)
                .tvaADecaisser(aDecaisser)
                .statut(DeclarationTva.Statut.VALIDEE)
                .ecritureId(ecritureId)
                .build();

        declarationRepo.save(decl);
        log.info("Déclaration TVA validée entreprise={} periode={}/{} aDecaisser={}", entrepriseId, debut, fin, aDecaisser);
        return toDeclaration(decl);
    }

    @Transactional
    public void supprimer(UUID id, UUID entrepriseId) {
        DeclarationTva decl = declarationRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Déclaration introuvable"));
        declarationRepo.delete(decl);
    }

    // ─── OD TVA ──────────────────────────────────────────────────────────────

    private UUID genererEcritureOD(Entreprise entreprise, LocalDate debut, LocalDate fin,
                                    BigDecimal collectee, BigDecimal deductible, BigDecimal aDecaisser,
                                    String userEmail) {
        UUID eid = entreprise.getId();
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail).orElse(null);
        if (auteur == null) return null;

        String piece = "TVA-" + debut.getYear() + "-" + String.format("%02d", debut.getMonthValue());
        if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(piece, eid)) return null;

        EcritureComptable od = EcritureComptable.builder()
                .entreprise(entreprise)
                .createdBy(auteur)
                .numeroPiece(piece)
                .dateEcriture(fin)
                .libelle("Liquidation TVA " + debut + " / " + fin)
                .journal(EcritureComptable.Journal.OD)
                .statut(EcritureComptable.Statut.BROUILLON)
                .build();

        // Solde TVA collectée (DR 4431 pour vider le crédit)
        addLigne(od, eid, "4431", "TVA collectée liquidée", collectee, BigDecimal.ZERO);
        // Solde TVA déductible (CR 4455 pour vider le débit)
        addLigne(od, eid, "4455", "TVA déductible liquidée", BigDecimal.ZERO, deductible);

        // TVA à décaisser (CR 4441) ou crédit TVA (DR 4441)
        if (aDecaisser.compareTo(BigDecimal.ZERO) > 0) {
            addLigne(od, eid, "4441", "TVA à décaisser", BigDecimal.ZERO, aDecaisser);
        } else {
            addLigne(od, eid, "4441", "Crédit de TVA", aDecaisser.abs(), BigDecimal.ZERO);
        }

        return ecritureRepo.save(od).getId();
    }

    private void addLigne(EcritureComptable od, UUID eid, String numero, String libelle,
                           BigDecimal debit, BigDecimal credit) {
        compteRepo.findByNumeroAndEntrepriseId(numero, eid).ifPresent(compte ->
                od.getLignes().add(LigneEcriture.builder()
                        .ecriture(od).compte(compte).libelle(libelle)
                        .debit(debit).credit(credit).build())
        );
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────

    private TvaDto.Declaration toDeclaration(DeclarationTva d) {
        return new TvaDto.Declaration(
                d.getId(), d.getPeriodeDebut(), d.getPeriodeFin(),
                d.getTvaCollectee(), d.getTvaDeductible(), d.getTvaADecaisser(),
                d.getStatut().name(), d.getEcritureId(), d.getCreatedAt());
    }
}
