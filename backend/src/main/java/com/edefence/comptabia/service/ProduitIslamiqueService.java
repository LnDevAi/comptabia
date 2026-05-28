package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.islamique.ProduitIslamiqueDto;
import com.edefence.comptabia.repository.*;
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
public class ProduitIslamiqueService {

    private final ProduitIslamiqueRepository produitRepo;
    private final ZakatCalculRepository zakatRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final LigneEcritureRepository ligneRepo;

    private static final BigDecimal ZERO  = BigDecimal.ZERO;
    private static final BigDecimal CENT  = BigDecimal.valueOf(100);
    private static final MathContext MC4  = new MathContext(4, RoundingMode.HALF_UP);

    private static final Map<ProduitIslamique.TypeProduit, String> TYPE_LABELS = Map.of(
            ProduitIslamique.TypeProduit.MOURABAHA,   "Mourabaha",
            ProduitIslamique.TypeProduit.IJARA,       "Ijara",
            ProduitIslamique.TypeProduit.IJARA_IMB,   "Ijara Muntahia Bittamlik",
            ProduitIslamique.TypeProduit.MOUDARABA,   "Moudaraba",
            ProduitIslamique.TypeProduit.MOUCHARAKA,  "Moucharaka",
            ProduitIslamique.TypeProduit.SALAM,       "Salam",
            ProduitIslamique.TypeProduit.ISTISNAA,    "Istisnaa",
            ProduitIslamique.TypeProduit.QARD_HASSAN, "Qard Hassan",
            ProduitIslamique.TypeProduit.SUKUK,       "Sukuk"
    );

    private static final Map<ProduitIslamique.Statut, String> STATUT_LABELS = Map.of(
            ProduitIslamique.Statut.ACTIF,           "Actif",
            ProduitIslamique.Statut.EN_RETARD,       "En retard",
            ProduitIslamique.Statut.DOUTEUX,         "Douteux",
            ProduitIslamique.Statut.CLOTURE,         "Clôturé",
            ProduitIslamique.Statut.PASSE_EN_PERTES, "Passé en pertes"
    );

    private static final Map<ZakatCalcul.StatutZakat, String> ZAKAT_STATUT = Map.of(
            ZakatCalcul.StatutZakat.CALCULE,               "Calculé",
            ZakatCalcul.StatutZakat.VERSE_PARTIELLEMENT,   "Versé partiellement",
            ZakatCalcul.StatutZakat.VERSE_INTEGRALEMENT,   "Versé intégralement"
    );

    // ─── Produits islamiques CRUD ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProduitIslamiqueDto.Response> lister(UUID entrepriseId) {
        return produitRepo.findByEntrepriseIdOrderByJoursRetardDescCreatedAtDesc(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public ProduitIslamiqueDto.Response creer(UUID entrepriseId, ProduitIslamiqueDto.CreateRequest req) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));

        ProduitIslamique.Statut statut = req.joursRetard() > 90 ? ProduitIslamique.Statut.DOUTEUX
                : req.joursRetard() > 30 ? ProduitIslamique.Statut.EN_RETARD
                : ProduitIslamique.Statut.ACTIF;

        ProduitIslamique p = produitRepo.save(ProduitIslamique.builder()
                .entreprise(e)
                .reference(req.reference())
                .nomClient(req.nomClient())
                .typeProduit(req.typeProduit() != null ? req.typeProduit() : ProduitIslamique.TypeProduit.MOURABAHA)
                .montantFinancement(req.montantFinancement())
                .montantEncours(req.montantEncours() != null ? req.montantEncours() : req.montantFinancement())
                .margeBeneficiaire(req.margeBeneficiaire() != null ? req.margeBeneficiaire() : ZERO)
                .tauxMarge(req.tauxMarge() != null ? req.tauxMarge() : ZERO)
                .dateContrat(req.dateContrat())
                .dateEcheance(req.dateEcheance())
                .joursRetard(req.joursRetard())
                .statut(statut)
                .objetFinancement(req.objetFinancement())
                .notes(req.notes())
                .build());
        return toResponse(p);
    }

    @Transactional
    public ProduitIslamiqueDto.Response mettrAJour(UUID entrepriseId, UUID id, ProduitIslamiqueDto.UpdateRequest req) {
        ProduitIslamique p = getOrThrow(entrepriseId, id);
        if (req.montantEncours() != null)   p.setMontantEncours(req.montantEncours());
        if (req.margeBeneficiaire() != null) p.setMargeBeneficiaire(req.margeBeneficiaire());
        if (req.dateEcheance() != null)     p.setDateEcheance(req.dateEcheance());
        if (req.notes() != null)            p.setNotes(req.notes());
        if (req.joursRetard() >= 0) {
            p.setJoursRetard(req.joursRetard());
            if (req.statut() == null) {
                p.setStatut(req.joursRetard() > 90 ? ProduitIslamique.Statut.DOUTEUX
                        : req.joursRetard() > 30 ? ProduitIslamique.Statut.EN_RETARD
                        : ProduitIslamique.Statut.ACTIF);
            }
        }
        if (req.statut() != null) p.setStatut(req.statut());
        return toResponse(produitRepo.save(p));
    }

    @Transactional
    public void supprimer(UUID entrepriseId, UUID id) {
        produitRepo.delete(getOrThrow(entrepriseId, id));
    }

    // ─── Zakat CRUD ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProduitIslamiqueDto.ZakatResponse> listerZakat(UUID entrepriseId) {
        return zakatRepo.findByEntrepriseIdOrderByExerciceDesc(entrepriseId)
                .stream().map(this::toZakatResponse).toList();
    }

    @Transactional
    public ProduitIslamiqueDto.ZakatResponse calculerZakat(UUID entrepriseId, ProduitIslamiqueDto.ZakatCreateRequest req) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));

        // Supprimer calcul existant pour cet exercice (re-calcul)
        zakatRepo.findByEntrepriseIdAndExercice(entrepriseId, req.exercice())
                .ifPresent(zakatRepo::delete);

        BigDecimal taux = req.tauxZakat() != null ? req.tauxZakat() : new BigDecimal("2.5");
        BigDecimal base = req.baseZakatable() != null ? req.baseZakatable()
                : calculerBaseZakatable(entrepriseId, req.exercice());
        BigDecimal montant = base.multiply(taux).divide(CENT, 4, RoundingMode.HALF_UP);

        ZakatCalcul z = zakatRepo.save(ZakatCalcul.builder()
                .entreprise(e)
                .exercice(req.exercice())
                .dateCalcul(req.dateCalcul() != null ? req.dateCalcul() : LocalDate.now())
                .baseZakatable(base)
                .tauxZakat(taux)
                .montantZakat(montant)
                .notes(req.notes())
                .build());
        return toZakatResponse(z);
    }

    @Transactional
    public ProduitIslamiqueDto.ZakatResponse mettreAJourZakat(UUID entrepriseId, UUID id, ProduitIslamiqueDto.ZakatUpdateRequest req) {
        ZakatCalcul z = zakatRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Calcul Zakat introuvable"));
        if (req.montantVerse() != null)  z.setMontantVerse(req.montantVerse());
        if (req.statut() != null)        z.setStatut(req.statut());
        if (req.notes() != null)         z.setNotes(req.notes());
        return toZakatResponse(zakatRepo.save(z));
    }

    // ─── Dashboard islamique ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProduitIslamiqueDto.DashboardResponse getDashboard(UUID entrepriseId, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);

        BigDecimal encoursTotalActif = produitRepo.sumEncoursTotalActif(entrepriseId);
        BigDecimal encoursPAR30      = produitRepo.sumEncoursPAR30(entrepriseId);
        BigDecimal margeTotale       = produitRepo.sumMargeTotale(entrepriseId);
        int nbContrats               = (int) produitRepo.countActifs(entrepriseId);

        BigDecimal ratioPAR30 = ratio(encoursPAR30, encoursTotalActif).multiply(CENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal rendementMoyen = ratio(margeTotale, encoursTotalActif).multiply(CENT).setScale(2, RoundingMode.HALF_UP);

        // Pourcentage participatifs
        BigDecimal encoursParticipatifs = ZERO;
        for (Object[] row : produitRepo.repartitionParType(entrepriseId)) {
            ProduitIslamique.TypeProduit tp = (ProduitIslamique.TypeProduit) row[0];
            if (tp == ProduitIslamique.TypeProduit.MOUDARABA || tp == ProduitIslamique.TypeProduit.MOUCHARAKA) {
                encoursParticipatifs = encoursParticipatifs.add((BigDecimal) row[2]);
            }
        }
        BigDecimal pctParticipatifs = ratio(encoursParticipatifs, encoursTotalActif).multiply(CENT).setScale(1, RoundingMode.HALF_UP);

        // Balances comptables
        BigDecimal totalActif   = soldeDebit(balance, "2","3","4","5");
        BigDecimal fondsPropres = soldeCredit(balance, "50","51","52","53","54","56");
        BigDecimal totalDepots  = soldeCredit(balance, "25");
        BigDecimal pni          = computePni(balance);
        BigDecimal chargesExpl  = soldeDebit(balance, "64");
        BigDecimal dotProv      = soldeDebit(balance, "65");
        BigDecimal resultat     = soldeCredit(balance, "7").subtract(soldeDebit(balance, "6"));

        // Zakat exercice courant
        Optional<ZakatCalcul> zakatOpt = zakatRepo.findByEntrepriseIdAndExercice(entrepriseId, exercice);
        BigDecimal zakatDue   = zakatOpt.map(ZakatCalcul::getMontantZakat).orElse(ZERO);
        BigDecimal zakatVerse = zakatOpt.map(ZakatCalcul::getMontantVerse).orElse(ZERO);

        // Répartition par type
        List<ProduitIslamiqueDto.RepartitionType> repartition = new ArrayList<>();
        for (Object[] row : produitRepo.repartitionParType(entrepriseId)) {
            ProduitIslamique.TypeProduit tp = (ProduitIslamique.TypeProduit) row[0];
            long   nb  = ((Number) row[1]).longValue();
            BigDecimal enc = (BigDecimal) row[2];
            BigDecimal mar = (BigDecimal) row[3];
            BigDecimal pct = ratio(enc, encoursTotalActif).multiply(CENT).setScale(1, RoundingMode.HALF_UP);
            repartition.add(new ProduitIslamiqueDto.RepartitionType(
                    tp, TYPE_LABELS.getOrDefault(tp, tp.name()), (int) nb, enc, mar, pct));
        }

        return new ProduitIslamiqueDto.DashboardResponse(
                nbContrats, encoursTotalActif, encoursPAR30, margeTotale, ratioPAR30,
                pctParticipatifs, rendementMoyen,
                totalActif, fondsPropres, totalDepots, pni, resultat,
                zakatDue, zakatVerse,
                repartition
        );
    }

    // ─── État de résultat islamique ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProduitIslamiqueDto.EtatResultatIslamiqueResponse getEtatResultat(UUID entrepriseId, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);

        BigDecimal margesMourabaha   = soldeCredit(balance, "71");
        BigDecimal loyersIjara       = soldeCredit(balance, "72");
        BigDecimal quotesPartsPartic = soldeCredit(balance, "73");
        BigDecimal profitsSukuk      = soldeCredit(balance, "74");
        BigDecimal produitsInterbanc = soldeCredit(balance, "70");
        BigDecimal chargesRessources = soldeDebit(balance, "60");
        BigDecimal chargesDepots     = soldeDebit(balance, "61");
        BigDecimal pni               = margesMourabaha.add(loyersIjara).add(quotesPartsPartic)
                                        .add(profitsSukuk).add(produitsInterbanc)
                                        .subtract(chargesRessources).subtract(chargesDepots);

        BigDecimal chargesGen  = soldeDebit(balance, "64");
        BigDecimal dotAmortProv = soldeDebit(balance, "65");
        BigDecimal pertesIrr   = soldeDebit(balance, "66");
        BigDecimal chargesDivers = soldeDebit(balance, "63");
        BigDecimal reprises    = soldeCredit(balance, "75", "78");
        BigDecimal resultatExp = pni.subtract(chargesGen).subtract(dotAmortProv)
                                   .subtract(pertesIrr).subtract(chargesDivers).add(reprises);

        BigDecimal zakatDue    = soldeDebit(balance, "67");
        BigDecimal pdtsExcep   = soldeCredit(balance, "76", "77");
        BigDecimal chExcep     = ZERO;
        BigDecimal impots      = soldeDebit(balance, "68");
        BigDecimal resultatNet = resultatExp.subtract(zakatDue).add(pdtsExcep).subtract(chExcep).subtract(impots);

        BigDecimal ratioCharges = ratio(chargesGen.add(dotAmortProv), pni).multiply(CENT).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ratioZakat   = ratio(zakatDue, resultatExp.compareTo(ZERO) > 0 ? resultatExp : BigDecimal.ONE)
                                   .multiply(CENT).setScale(2, RoundingMode.HALF_UP);

        return new ProduitIslamiqueDto.EtatResultatIslamiqueResponse(
                exercice, margesMourabaha, loyersIjara, quotesPartsPartic, profitsSukuk,
                produitsInterbanc, chargesRessources, chargesDepots, pni,
                chargesGen, dotAmortProv, pertesIrr, chargesDivers, reprises, resultatExp,
                zakatDue, pdtsExcep, chExcep, impots, resultatNet,
                ratioCharges, ratioZakat
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private BigDecimal calculerBaseZakatable(UUID entrepriseId, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);
        // Base zakatable = liquidités (trésorerie) + créances Mourabaha + titres Sukuk
        return soldeDebit(balance, "5")       // Trésorerie
                .add(soldeDebit(balance, "20","21")) // Financements islamiques
                .add(soldeDebit(balance, "30"));     // Sukuk et titres
    }

    private BigDecimal computePni(List<Object[]> balance) {
        return soldeCredit(balance, "71","72","73","74","70")
                .subtract(soldeDebit(balance, "60","61"));
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

    private ProduitIslamique getOrThrow(UUID entrepriseId, UUID id) {
        return produitRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Produit islamique introuvable"));
    }

    private ProduitIslamiqueDto.Response toResponse(ProduitIslamique p) {
        return new ProduitIslamiqueDto.Response(
                p.getId(), p.getReference(), p.getNomClient(),
                p.getTypeProduit(), TYPE_LABELS.getOrDefault(p.getTypeProduit(), p.getTypeProduit().name()),
                p.getMontantFinancement(), p.getMontantEncours(), p.getMargeBeneficiaire(), p.getTauxMarge(),
                p.getDateContrat(), p.getDateEcheance(), p.getJoursRetard(),
                p.getStatut(), STATUT_LABELS.getOrDefault(p.getStatut(), p.getStatut().name()),
                p.getObjetFinancement(), p.getNotes(), p.getCreatedAt(), p.getUpdatedAt()
        );
    }

    private ProduitIslamiqueDto.ZakatResponse toZakatResponse(ZakatCalcul z) {
        BigDecimal reste = z.getMontantZakat().subtract(z.getMontantVerse()).max(ZERO);
        return new ProduitIslamiqueDto.ZakatResponse(
                z.getId(), z.getExercice(), z.getDateCalcul(),
                z.getBaseZakatable(), z.getTauxZakat(), z.getMontantZakat(),
                z.getMontantVerse(), reste,
                z.getStatut(), ZAKAT_STATUT.getOrDefault(z.getStatut(), z.getStatut().name()),
                z.getNotes(), z.getCreatedAt()
        );
    }
}
