package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.CreditSfd;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.dto.sfd.CreditSfdDto;
import com.edefence.ecompta.repository.CreditSfdRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CreditSfdService {

    private final CreditSfdRepository repo;
    private final EntrepriseRepository entrepriseRepo;
    private final LigneEcritureRepository ligneRepo;

    private static final BigDecimal ZERO  = BigDecimal.ZERO;
    private static final BigDecimal CENT  = BigDecimal.valueOf(100);
    private static final MathContext MC4  = new MathContext(4, RoundingMode.HALF_UP);

    private static final Map<CreditSfd.TypeCredit, String> TYPE_LABELS = Map.of(
            CreditSfd.TypeCredit.COURT_TERME,  "Crédit court terme",
            CreditSfd.TypeCredit.MOYEN_TERME,  "Crédit moyen terme",
            CreditSfd.TypeCredit.LONG_TERME,   "Crédit long terme",
            CreditSfd.TypeCredit.MICRO_CREDIT, "Micro-crédit"
    );

    private static final Map<CreditSfd.Statut, String> STATUT_LABELS = Map.of(
            CreditSfd.Statut.ACTIF,            "Actif",
            CreditSfd.Statut.EN_SOUFFRANCE,    "En souffrance",
            CreditSfd.Statut.DOUTEUX,          "Douteux",
            CreditSfd.Statut.REMBOURSE,        "Remboursé",
            CreditSfd.Statut.PASSE_EN_PERTES,  "Passé en pertes"
    );

    // ─── Lister ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CreditSfdDto.Response> lister(UUID entrepriseId) {
        return repo.findByEntrepriseIdOrderByJoursRetardDescCreatedAtDesc(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────

    @Transactional
    public CreditSfdDto.Response creer(UUID entrepriseId, CreditSfdDto.CreateRequest req) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));

        CreditSfd.Statut statut = req.joursRetard() > 90  ? CreditSfd.Statut.DOUTEUX
                : req.joursRetard() > 30 ? CreditSfd.Statut.EN_SOUFFRANCE
                : CreditSfd.Statut.ACTIF;

        CreditSfd c = repo.save(CreditSfd.builder()
                .entreprise(e)
                .numeroCredit(req.numeroCredit())
                .nomClient(req.nomClient())
                .montantAccorde(req.montantAccorde())
                .montantEncours(req.montantEncours() != null ? req.montantEncours() : req.montantAccorde())
                .dateDeblocage(req.dateDeblocage())
                .dateEcheance(req.dateEcheance())
                .joursRetard(req.joursRetard())
                .statut(statut)
                .typeCredit(req.typeCredit() != null ? req.typeCredit() : CreditSfd.TypeCredit.MICRO_CREDIT)
                .notes(req.notes())
                .build());
        return toResponse(c);
    }

    @Transactional
    public CreditSfdDto.Response mettrAJour(UUID entrepriseId, UUID id,
                                             CreditSfdDto.UpdateRequest req) {
        CreditSfd c = getOrThrow(entrepriseId, id);
        if (req.montantEncours() != null) c.setMontantEncours(req.montantEncours());
        if (req.joursRetard() >= 0) {
            c.setJoursRetard(req.joursRetard());
            if (req.statut() == null) {
                c.setStatut(req.joursRetard() > 90  ? CreditSfd.Statut.DOUTEUX
                        : req.joursRetard() > 30 ? CreditSfd.Statut.EN_SOUFFRANCE
                        : CreditSfd.Statut.ACTIF);
            }
        }
        if (req.statut()      != null) c.setStatut(req.statut());
        if (req.dateEcheance() != null) c.setDateEcheance(req.dateEcheance());
        if (req.notes()       != null) c.setNotes(req.notes());
        return toResponse(repo.save(c));
    }

    @Transactional
    public void supprimer(UUID entrepriseId, UUID id) {
        repo.delete(getOrThrow(entrepriseId, id));
    }

    // ─── Dashboard SFD ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CreditSfdDto.DashboardResponse getDashboard(UUID entrepriseId, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);

        // Portefeuille depuis la table credits_sfd
        BigDecimal encoursTotalActif  = repo.sumEncoursTotalActif(entrepriseId);
        BigDecimal encoursPAR30       = repo.sumEncoursPAR30(entrepriseId);
        BigDecimal encoursPAR90       = repo.sumEncoursPAR90(entrepriseId);
        BigDecimal encoursEnSouffrance = repo.sumEncoursByStatut(entrepriseId, CreditSfd.Statut.EN_SOUFFRANCE);
        BigDecimal encoursDouteux     = repo.sumEncoursByStatut(entrepriseId, CreditSfd.Statut.DOUTEUX);
        int nbCredits                 = (int) repo.countCreditsActifs(entrepriseId);

        // Ratios PAR
        BigDecimal ratioPAR30 = ratio(encoursPAR30, encoursTotalActif).multiply(CENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ratioPAR90 = ratio(encoursPAR90, encoursTotalActif).multiply(CENT).setScale(2, RoundingMode.HALF_UP);

        // Balances comptables
        BigDecimal totalCredits       = soldeDebit(balance, "20");
        BigDecimal totalDepots        = soldeCredit(balance, "25");
        BigDecimal totalActif         = soldeDebit(balance, "1","2","3","4").add(totalCredits);
        BigDecimal fondsPropres       = soldeCredit(balance, "50","51","52","53","54","56");
        BigDecimal interetsCreditsCl  = soldeCredit(balance, "71");
        BigDecimal intBancaires       = soldeCredit(balance, "70");
        BigDecimal pdtDivers          = soldeCredit(balance, "73","74");
        BigDecimal intDepots          = soldeDebit(balance, "61");
        BigDecimal chInterbanc        = soldeDebit(balance, "60");
        BigDecimal pnb                = interetsCreditsCl.add(intBancaires).add(pdtDivers)
                                          .subtract(intDepots).subtract(chInterbanc);
        BigDecimal chargesExploit     = soldeDebit(balance, "64");
        BigDecimal dotProv            = soldeDebit(balance, "65");
        BigDecimal resultat           = soldeCredit(balance, "7").subtract(soldeDebit(balance, "6"));

        // Ratios financiers
        BigDecimal car         = ratio(fondsPropres, totalActif).multiply(CENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roa         = ratio(resultat, totalActif).multiply(CENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal roe         = ratio(resultat, fondsPropres).multiply(CENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal creditDepos = ratio(totalCredits, totalDepots).multiply(CENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal exploitation = ratio(chargesExploit.add(dotProv), pnb).multiply(CENT).setScale(2, RoundingMode.HALF_UP);

        // Répartition par type
        List<CreditSfdDto.RepartitionType> repartition = new ArrayList<>();
        for (Object[] row : repo.repartitionParType(entrepriseId)) {
            CreditSfd.TypeCredit tc = (CreditSfd.TypeCredit) row[0];
            long   nb = ((Number) row[1]).longValue();
            BigDecimal enc = (BigDecimal) row[2];
            BigDecimal pct = ratio(enc, encoursTotalActif).multiply(CENT).setScale(1, RoundingMode.HALF_UP);
            repartition.add(new CreditSfdDto.RepartitionType(tc, TYPE_LABELS.getOrDefault(tc, tc.name()), (int) nb, enc, pct));
        }

        return new CreditSfdDto.DashboardResponse(
                nbCredits, encoursTotalActif, encoursPAR30, encoursPAR90,
                encoursEnSouffrance, encoursDouteux,
                ratioPAR30, ratioPAR90,
                totalActif, fondsPropres, totalDepots, pnb, resultat,
                car, roa, roe, creditDepos, exploitation,
                repartition
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private CreditSfd getOrThrow(UUID entrepriseId, UUID id) {
        return repo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Crédit introuvable"));
    }

    private CreditSfdDto.Response toResponse(CreditSfd c) {
        return new CreditSfdDto.Response(
                c.getId(), c.getNumeroCredit(), c.getNomClient(),
                c.getMontantAccorde(), c.getMontantEncours(),
                c.getDateDeblocage(), c.getDateEcheance(), c.getJoursRetard(),
                c.getStatut(), STATUT_LABELS.getOrDefault(c.getStatut(), c.getStatut().name()),
                c.getTypeCredit(), TYPE_LABELS.getOrDefault(c.getTypeCredit(), c.getTypeCredit().name()),
                c.getNotes(), c.getCreatedAt(), c.getUpdatedAt()
        );
    }

    private BigDecimal soldeDebit(List<Object[]> rows, String... prefixes) {
        BigDecimal sum = ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            for (String p : prefixes) {
                if (num.startsWith(p)) {
                    BigDecimal d = (BigDecimal) r[3], c = (BigDecimal) r[4];
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
                    BigDecimal d = (BigDecimal) r[3], c = (BigDecimal) r[4];
                    sum = sum.add(c.subtract(d).max(ZERO));
                    break;
                }
            }
        }
        return sum;
    }

    private BigDecimal ratio(BigDecimal num, BigDecimal den) {
        if (den == null || den.compareTo(ZERO) == 0) return ZERO;
        return num.divide(den, MC4);
    }
}
