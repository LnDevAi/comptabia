package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.tva.TvaDto;
import com.edefence.comptabia.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TvaService {

    private static final String[] MOIS_FR = {
        "", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin",
        "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."
    };

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

    // ─── Stats annuelles ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TvaDto.StatAnnuelle getStatAnnuelle(UUID entrepriseId, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);

        List<Object[]> rows = declarationRepo.tvaParMois(entrepriseId, from, to);

        Map<Integer, BigDecimal[]> byMois = new LinkedHashMap<>();
        for (Object[] row : rows) {
            int mois          = ((Number) row[0]).intValue();
            BigDecimal coll   = (BigDecimal) row[1];
            BigDecimal deduct = (BigDecimal) row[2];
            byMois.put(mois, new BigDecimal[]{ coll, deduct });
        }

        List<TvaDto.MoisTva> mensuel = new ArrayList<>();
        BigDecimal totalColl  = BigDecimal.ZERO;
        BigDecimal totalDeduct = BigDecimal.ZERO;

        for (int m = 1; m <= 12; m++) {
            BigDecimal[] vals = byMois.getOrDefault(m, new BigDecimal[]{ BigDecimal.ZERO, BigDecimal.ZERO });
            BigDecimal coll   = vals[0];
            BigDecimal deduct = vals[1];
            BigDecimal net    = coll.subtract(deduct);
            totalColl   = totalColl.add(coll);
            totalDeduct = totalDeduct.add(deduct);
            mensuel.add(new TvaDto.MoisTva(m, MOIS_FR[m], coll, deduct, net));
        }

        BigDecimal totalNet = totalColl.subtract(totalDeduct);

        List<DeclarationTva> decls = declarationRepo.findByEntrepriseIdOrderByPeriodeDebutDesc(entrepriseId)
                .stream()
                .filter(d -> d.getPeriodeDebut().getYear() == exercice)
                .toList();

        List<Integer> moisDeclares = decls.stream()
                .map(d -> d.getPeriodeDebut().getMonthValue())
                .distinct().sorted().toList();

        return new TvaDto.StatAnnuelle(exercice, totalColl, totalDeduct, totalNet,
                decls.size(), moisDeclares, mensuel);
    }

    // ─── Export CSV ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String exportCsv(UUID entrepriseId, int exercice) {
        List<DeclarationTva> decls = declarationRepo.findByEntrepriseIdOrderByPeriodeDebutDesc(entrepriseId)
                .stream()
                .filter(d -> d.getPeriodeDebut().getYear() == exercice || exercice == 0)
                .toList();

        StringBuilder sb = new StringBuilder();
        sb.append("Période début;Période fin;TVA collectée;TVA déductible;À décaisser;Statut;OD\n");
        for (DeclarationTva d : decls) {
            sb.append(d.getPeriodeDebut()).append(';')
              .append(d.getPeriodeFin()).append(';')
              .append(d.getTvaCollectee()).append(';')
              .append(d.getTvaDeductible()).append(';')
              .append(d.getTvaADecaisser()).append(';')
              .append(d.getStatut().name()).append(';')
              .append(d.getEcritureId() != null ? "OD générée" : "—").append('\n');
        }
        return sb.toString();
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
