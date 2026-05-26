package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.ProvisionTechnique;
import com.edefence.ecompta.dto.provision.ProvisionTechniqueDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import com.edefence.ecompta.repository.ProvisionTechniqueRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProvisionTechniqueService {

    private final ProvisionTechniqueRepository repo;
    private final EntrepriseRepository entrepriseRepo;
    private final LigneEcritureRepository ligneRepo;

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal CENT = BigDecimal.valueOf(100);
    private static final MathContext MC4  = new MathContext(4, RoundingMode.HALF_UP);

    private static final Map<ProvisionTechnique.TypeProvision, String> LABELS = Map.of(
            ProvisionTechnique.TypeProvision.PPNA,               "Provisions pour primes non acquises",
            ProvisionTechnique.TypeProvision.PRC,                "Provisions pour risques en cours",
            ProvisionTechnique.TypeProvision.PSAP,               "Provisions pour sinistres à payer",
            ProvisionTechnique.TypeProvision.RISQUES_CROISSANTS, "Provisions pour risques croissants",
            ProvisionTechnique.TypeProvision.PM_VIE,             "Provisions mathématiques (Vie)",
            ProvisionTechnique.TypeProvision.PPB,                "Provisions pour participation aux bénéfices",
            ProvisionTechnique.TypeProvision.EGALISATION,        "Provisions d'égalisation",
            ProvisionTechnique.TypeProvision.CATASTROPHES,       "Provisions pour catastrophes",
            ProvisionTechnique.TypeProvision.AUTRES,             "Autres provisions techniques"
    );

    // ─── Lister ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProvisionTechniqueDto.Response> lister(UUID entrepriseId) {
        return repo.findByEntrepriseIdOrderByExerciceDescTypeProvisionAscBrancheAsc(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<ProvisionTechniqueDto.Response> listerParExercice(UUID entrepriseId, int exercice) {
        return repo.findByEntrepriseIdAndExerciceOrderByTypeProvisionAscBrancheAsc(entrepriseId, exercice)
                .stream().map(this::toResponse).toList();
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    @Transactional
    public ProvisionTechniqueDto.Response creer(UUID entrepriseId, ProvisionTechniqueDto.CreateRequest req) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        ProvisionTechnique p = repo.save(ProvisionTechnique.builder()
                .entreprise(e)
                .typeProvision(req.typeProvision())
                .branche(req.branche() != null ? req.branche() : ProvisionTechnique.Branche.NON_VIE)
                .exercice(req.exercice())
                .dateCalcul(req.dateCalcul())
                .montant(req.montant() != null ? req.montant() : ZERO)
                .notes(req.notes())
                .build());
        return toResponse(p);
    }

    @Transactional
    public ProvisionTechniqueDto.Response mettrAJour(UUID entrepriseId, UUID id,
                                                      ProvisionTechniqueDto.UpdateRequest req) {
        ProvisionTechnique p = getOrThrow(entrepriseId, id);
        if (req.montant()    != null) p.setMontant(req.montant());
        if (req.dateCalcul() != null) p.setDateCalcul(req.dateCalcul());
        if (req.notes()      != null) p.setNotes(req.notes());
        return toResponse(repo.save(p));
    }

    @Transactional
    public void supprimer(UUID entrepriseId, UUID id) {
        repo.delete(getOrThrow(entrepriseId, id));
    }

    // ─── Dashboard prudentiel ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProvisionTechniqueDto.DashboardResponse getDashboard(UUID entrepriseId, int exercice) {

        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);

        // Balances comptables de l'exercice
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);

        // Totaux CIMA depuis la balance
        BigDecimal totalPlacements    = soldeDebiteur(balance, "22","23","24","25","26","27","28");
        BigDecimal totalFondsPropres  = soldeCredit(balance,   "10","11","12","13","14","15");
        BigDecimal primesNonVie       = soldeCredit(balance,   "700","702");
        BigDecimal primesVie          = soldeCredit(balance,   "701");
        BigDecimal primesCedees       = soldeDebiteur(balance, "601");
        BigDecimal primesAcquises     = primesNonVie.add(primesVie).subtract(primesCedees);
        BigDecimal sinistresPayes     = soldeDebiteur(balance, "610","611","614");
        BigDecimal fraisAcqAdm        = soldeDebiteur(balance, "640","641","642","650","651","652");

        // Provisions depuis la table dédiée
        BigDecimal totalProvisions    = Optional.ofNullable(
                repo.sumMontantByEntrepriseIdAndExercice(entrepriseId, exercice)).orElse(ZERO);

        // Totaux par type de provision
        List<ProvisionTechniqueDto.TotalParType> totaux = new ArrayList<>();
        for (Object[] row : repo.sumParTypeEtBranche(entrepriseId, exercice)) {
            ProvisionTechnique.TypeProvision tp = (ProvisionTechnique.TypeProvision) row[0];
            ProvisionTechnique.Branche       br = (ProvisionTechnique.Branche)       row[1];
            BigDecimal                       mt = (BigDecimal)                        row[2];
            totaux.add(new ProvisionTechniqueDto.TotalParType(tp, label(tp), br, mt));
        }

        // Ratios prudentiels
        BigDecimal ratioCouverture   = ratio(totalPlacements,       totalProvisions);
        BigDecimal ratioCouvertPct   = ratioCouverture.multiply(CENT);
        BigDecimal ratioSolvabilite  = ratio(totalFondsPropres,      primesAcquises).multiply(CENT);
        BigDecimal ratioSinistrality = ratio(sinistresPayes,         primesAcquises).multiply(CENT);
        BigDecimal ratioFrais        = ratio(fraisAcqAdm,            primesAcquises).multiply(CENT);
        BigDecimal ratioCombinaison  = ratioSinistrality.add(ratioFrais);

        return new ProvisionTechniqueDto.DashboardResponse(
                exercice,
                totalProvisions,
                totalPlacements,
                totalFondsPropres,
                primesAcquises,
                sinistresPayes,
                fraisAcqAdm,
                totaux,
                ratioCouvertPct.setScale(2, RoundingMode.HALF_UP),
                ratioSolvabilite.setScale(2, RoundingMode.HALF_UP),
                ratioSinistrality.setScale(2, RoundingMode.HALF_UP),
                ratioFrais.setScale(2, RoundingMode.HALF_UP),
                ratioCombinaison.setScale(2, RoundingMode.HALF_UP)
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private ProvisionTechnique getOrThrow(UUID entrepriseId, UUID id) {
        return repo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Provision introuvable"));
    }

    private ProvisionTechniqueDto.Response toResponse(ProvisionTechnique p) {
        return new ProvisionTechniqueDto.Response(
                p.getId(), p.getTypeProvision(), label(p.getTypeProvision()),
                p.getBranche(), p.getExercice(), p.getDateCalcul(),
                p.getMontant(), p.getNotes(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }

    private static String label(ProvisionTechnique.TypeProvision tp) {
        return LABELS.getOrDefault(tp, tp.name());
    }

    private BigDecimal soldeDebiteur(List<Object[]> rows, String... prefixes) {
        BigDecimal sum = ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            for (String p : prefixes) {
                if (num.startsWith(p)) {
                    BigDecimal d = (BigDecimal) r[3];
                    BigDecimal c = (BigDecimal) r[4];
                    sum = sum.add(d.subtract(c).max(ZERO));
                    break;
                }
            }
        }
        return sum;
    }

    private BigDecimal soldeCredit(List<Object[]> rows, String... prefixes) {
        BigDecimal sum = ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            for (String p : prefixes) {
                if (num.startsWith(p)) {
                    BigDecimal d = (BigDecimal) r[3];
                    BigDecimal c = (BigDecimal) r[4];
                    sum = sum.add(c.subtract(d).max(ZERO));
                    break;
                }
            }
        }
        return sum;
    }

    private BigDecimal ratio(BigDecimal numerateur, BigDecimal denominateur) {
        if (denominateur == null || denominateur.compareTo(ZERO) == 0) return ZERO;
        return numerateur.divide(denominateur, MC4);
    }
}
