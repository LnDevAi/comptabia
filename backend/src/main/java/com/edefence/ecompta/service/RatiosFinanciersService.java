package com.edefence.ecompta.service;

import com.edefence.ecompta.dto.ratios.RatiosDto;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RatiosFinanciersService {

    private final LigneEcritureRepository ligneRepo;

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final MathContext MC4  = new MathContext(4, RoundingMode.HALF_UP);
    private static final BigDecimal CENT  = BigDecimal.valueOf(100);
    private static final BigDecimal TRSF  = BigDecimal.valueOf(365);

    @Transactional(readOnly = true)
    public RatiosDto.Response calculer(UUID entrepriseId, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> rows = ligneRepo.balanceParCompte(entrepriseId, from, to);

        // ── Agrégats par classes ──────────────────────────────────────────────
        BigDecimal immos            = soldeDebit(rows, "2");        // 2x actif immo
        BigDecimal stocks           = soldeDebit(rows, "3");        // 3x stocks
        BigDecimal creancesClients  = soldeDebit(rows, "41");       // 41x clients
        BigDecimal autresCreances   = soldeDebit(rows, "44","45","46","47","48"); // autres créances actif
        BigDecimal valEncaisser     = soldeDebit(rows, "50","57");  // 50x valeurs à encaisser
        BigDecimal disponibilites   = soldeDebit(rows, "51","52","53"); // 51-53 banque+caisse

        BigDecimal capitauxPropres  = soldeCredit(rows, "10","11","12","13","14","15"); // CP nets
        BigDecimal dettesLT         = soldeCredit(rows, "16","17"); // emprunts LT
        BigDecimal dettesFournisseurs = soldeCredit(rows, "40");
        BigDecimal dettesFiscSoc    = soldeCredit(rows, "42","43","44");
        BigDecimal autresDettesCirc = soldeCredit(rows, "46","47","48");

        BigDecimal chiffreAffaires  = soldeCredit(rows, "70","71","72","73","74");
        BigDecimal achats           = soldeDebit(rows, "60","61","62","63","64","65");
        BigDecimal chargesPersonnel = soldeDebit(rows, "66");
        BigDecimal produitsTotaux   = soldeCredit(rows, "7");
        BigDecimal chargesTotales   = soldeDebit(rows, "6","8");
        BigDecimal resultatNet      = produitsTotaux.subtract(chargesTotales);

        // ── Agrégats dérivés ─────────────────────────────────────────────────
        BigDecimal actifCirculant   = stocks.add(creancesClients).add(autresCreances)
                                           .add(valEncaisser).add(disponibilites);
        BigDecimal passifCirculant  = dettesFournisseurs.add(dettesFiscSoc).add(autresDettesCirc);
        BigDecimal totalActif       = immos.add(actifCirculant);
        BigDecimal ressourcesStables = capitauxPropres.add(dettesLT);
        BigDecimal dettesFinancieres = dettesLT;

        BigDecimal frng             = ressourcesStables.subtract(immos);
        BigDecimal bfr              = stocks.add(creancesClients).subtract(dettesFournisseurs)
                                           .subtract(dettesFiscSoc);
        BigDecimal tresorerieNette  = disponibilites.subtract(ZERO); // concours CT = 0 si non modélisé

        // ── CAF (Capacité d'Autofinancement) = résultat + dotations ──────────
        BigDecimal dotations        = soldeDebit(rows, "68","69");
        BigDecimal reprises         = soldeCredit(rows, "78","79");
        BigDecimal caf              = resultatNet.add(dotations).subtract(reprises);

        // ── Groupe 1 : Liquidité ──────────────────────────────────────────────
        List<RatiosDto.Ratio> liquidite = new ArrayList<>();

        BigDecimal ratioLiqGen = divSafe(actifCirculant, passifCirculant);
        liquidite.add(ratio("LIQ_GEN", "Liquidité générale",
            "Actif circulant / Passif circulant", ratioLiqGen, pct(false),
            ratioLiqGen.compareTo(BigDecimal.valueOf(1.5)) >= 0 ? "BON"
            : ratioLiqGen.compareTo(BigDecimal.ONE) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal actifCircSansStock = actifCirculant.subtract(stocks);
        BigDecimal ratioLiqRed = divSafe(actifCircSansStock, passifCirculant);
        liquidite.add(ratio("LIQ_RED", "Liquidité réduite",
            "(Actif circulant − Stocks) / Passif circulant", ratioLiqRed, pct(false),
            ratioLiqRed.compareTo(BigDecimal.ONE) >= 0 ? "BON"
            : ratioLiqRed.compareTo(new BigDecimal("0.5")) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal ratioLiqImm = divSafe(disponibilites, passifCirculant);
        liquidite.add(ratio("LIQ_IMM", "Liquidité immédiate",
            "Disponibilités / Passif circulant", ratioLiqImm, pct(false),
            ratioLiqImm.compareTo(new BigDecimal("0.2")) >= 0 ? "BON"
            : ratioLiqImm.compareTo(new BigDecimal("0.1")) >= 0 ? "MOYEN" : "FAIBLE"));

        // ── Groupe 2 : Solvabilité ────────────────────────────────────────────
        List<RatiosDto.Ratio> solvabilite = new ArrayList<>();

        BigDecimal ratioAutonomie = divSafe(capitauxPropres, totalActif).multiply(CENT);
        solvabilite.add(ratio("SOL_AUT", "Autonomie financière",
            "Capitaux propres / Total actif × 100", ratioAutonomie, "%",
            ratioAutonomie.compareTo(BigDecimal.valueOf(40)) >= 0 ? "BON"
            : ratioAutonomie.compareTo(BigDecimal.valueOf(20)) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal ratioEndt = divSafe(dettesFinancieres, capitauxPropres);
        solvabilite.add(ratio("SOL_END", "Ratio d'endettement",
            "Dettes financières / Capitaux propres", ratioEndt, pct(false),
            ratioEndt.compareTo(BigDecimal.ONE) <= 0 ? "BON"
            : ratioEndt.compareTo(BigDecimal.valueOf(2)) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal ratioCapRembours = divSafe(dettesFinancieres, caf.compareTo(ZERO) != 0 ? caf : BigDecimal.ONE);
        solvabilite.add(ratio("SOL_CAP", "Capacité de remboursement",
            "Dettes financières / CAF (années)", ratioCapRembours, "ans",
            ratioCapRembours.compareTo(BigDecimal.valueOf(3)) <= 0 ? "BON"
            : ratioCapRembours.compareTo(BigDecimal.valueOf(5)) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal ratioSolvGen = divSafe(totalActif, passifCirculant.add(dettesLT));
        solvabilite.add(ratio("SOL_GEN", "Solvabilité générale",
            "Total actif / Total dettes", ratioSolvGen, pct(false),
            ratioSolvGen.compareTo(BigDecimal.valueOf(2)) >= 0 ? "BON"
            : ratioSolvGen.compareTo(BigDecimal.ONE) >= 0 ? "MOYEN" : "FAIBLE"));

        // ── Groupe 3 : Rentabilité ────────────────────────────────────────────
        List<RatiosDto.Ratio> rentabilite = new ArrayList<>();

        BigDecimal ratioMargeNette = divSafe(resultatNet, chiffreAffaires).multiply(CENT);
        rentabilite.add(ratio("RENT_MN", "Marge nette",
            "Résultat net / CA × 100", ratioMargeNette, "%",
            ratioMargeNette.compareTo(BigDecimal.valueOf(5)) >= 0 ? "BON"
            : ratioMargeNette.compareTo(BigDecimal.ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal roe = divSafe(resultatNet, capitauxPropres.compareTo(ZERO) != 0 ? capitauxPropres : BigDecimal.ONE).multiply(CENT);
        rentabilite.add(ratio("RENT_ROE", "Rentabilité des CP (ROE)",
            "Résultat net / Capitaux propres × 100", roe, "%",
            roe.compareTo(BigDecimal.valueOf(10)) >= 0 ? "BON"
            : roe.compareTo(BigDecimal.ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal roa = divSafe(resultatNet, totalActif.compareTo(ZERO) != 0 ? totalActif : BigDecimal.ONE).multiply(CENT);
        rentabilite.add(ratio("RENT_ROA", "Rentabilité des actifs (ROA)",
            "Résultat net / Total actif × 100", roa, "%",
            roa.compareTo(BigDecimal.valueOf(5)) >= 0 ? "BON"
            : roa.compareTo(BigDecimal.ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal caf100 = divSafe(caf, chiffreAffaires).multiply(CENT);
        rentabilite.add(ratio("RENT_CAF", "Taux de CAF",
            "CAF / CA × 100", caf100, "%",
            caf100.compareTo(BigDecimal.valueOf(8)) >= 0 ? "BON"
            : caf100.compareTo(BigDecimal.ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        // ── Groupe 4 : Équilibre financier ───────────────────────────────────
        List<RatiosDto.Ratio> equilibre = new ArrayList<>();

        equilibre.add(ratio("EQ_FRNG", "Fonds de Roulement Net Global (FRNG)",
            "Ressources stables − Actif immobilisé", frng, "FCFA",
            frng.compareTo(ZERO) >= 0 ? "BON" : "FAIBLE"));

        equilibre.add(ratio("EQ_BFR", "Besoin en Fonds de Roulement (BFR)",
            "Stocks + Créances clients − Dettes fournisseurs − Dettes fisc.", bfr, "FCFA",
            bfr.compareTo(ZERO) <= 0 ? "BON"
            : bfr.compareTo(frng) <= 0 ? "MOYEN" : "FAIBLE"));

        equilibre.add(ratio("EQ_TN", "Trésorerie Nette (TN)",
            "FRNG − BFR", frng.subtract(bfr), "FCFA",
            frng.subtract(bfr).compareTo(ZERO) >= 0 ? "BON" : "FAIBLE"));

        BigDecimal ratioFRNG_CA = divSafe(frng, chiffreAffaires).multiply(CENT);
        equilibre.add(ratio("EQ_FRNG_CA", "FRNG en % du CA",
            "FRNG / CA × 100", ratioFRNG_CA, "%",
            ratioFRNG_CA.compareTo(BigDecimal.valueOf(15)) >= 0 ? "BON"
            : ratioFRNG_CA.compareTo(BigDecimal.ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        // ── Groupe 5 : Activité ──────────────────────────────────────────────
        List<RatiosDto.Ratio> activite = new ArrayList<>();

        BigDecimal delaiClients = chiffreAffaires.compareTo(ZERO) != 0
            ? creancesClients.multiply(TRSF).divide(chiffreAffaires, 1, RoundingMode.HALF_UP)
            : ZERO;
        activite.add(ratio("ACT_CLI", "Délai de règlement clients",
            "Clients / CA × 365", delaiClients, "jours",
            delaiClients.compareTo(BigDecimal.valueOf(45)) <= 0 ? "BON"
            : delaiClients.compareTo(BigDecimal.valueOf(90)) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal delaisFourn = achats.compareTo(ZERO) != 0
            ? dettesFournisseurs.multiply(TRSF).divide(achats, 1, RoundingMode.HALF_UP)
            : ZERO;
        activite.add(ratio("ACT_FNR", "Délai de règlement fournisseurs",
            "Fournisseurs / Achats × 365", delaisFourn, "jours",
            delaisFourn.compareTo(BigDecimal.valueOf(30)) >= 0 ? "BON"
            : delaisFourn.compareTo(BigDecimal.valueOf(15)) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal rotationStocks = achats.compareTo(ZERO) != 0 && stocks.compareTo(ZERO) != 0
            ? stocks.multiply(TRSF).divide(achats, 1, RoundingMode.HALF_UP)
            : ZERO;
        activite.add(ratio("ACT_STK", "Durée de rotation des stocks",
            "Stocks / Achats × 365", rotationStocks, "jours",
            rotationStocks.compareTo(BigDecimal.valueOf(30)) <= 0 ? "BON"
            : rotationStocks.compareTo(BigDecimal.valueOf(90)) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal ratioChargesPerso = chiffreAffaires.compareTo(ZERO) != 0
            ? chargesPersonnel.multiply(CENT).divide(chiffreAffaires, 1, RoundingMode.HALF_UP)
            : ZERO;
        activite.add(ratio("ACT_CHR", "Charges de personnel / CA",
            "Charges personnel / CA × 100", ratioChargesPerso, "%",
            ratioChargesPerso.compareTo(BigDecimal.valueOf(50)) <= 0 ? "BON"
            : ratioChargesPerso.compareTo(BigDecimal.valueOf(70)) <= 0 ? "MOYEN" : "FAIBLE"));

        List<RatiosDto.Groupe> groupes = List.of(
            new RatiosDto.Groupe("Liquidité",            liquidite),
            new RatiosDto.Groupe("Solvabilité",          solvabilite),
            new RatiosDto.Groupe("Rentabilité",          rentabilite),
            new RatiosDto.Groupe("Équilibre financier",  equilibre),
            new RatiosDto.Groupe("Activité",             activite)
        );

        return new RatiosDto.Response(exercice, groupes, totalActif, chiffreAffaires,
            resultatNet, capitauxPropres, dettesFinancieres, frng, bfr, tresorerieNette);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private BigDecimal soldeDebit(List<Object[]> rows, String... prefixes) {
        BigDecimal total = ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            if (!matchesAny(num, prefixes)) continue;
            BigDecimal d = (BigDecimal) r[3];
            BigDecimal c = (BigDecimal) r[4];
            BigDecimal net = d.subtract(c);
            if (net.compareTo(ZERO) > 0) total = total.add(net);
        }
        return total;
    }

    private BigDecimal soldeCredit(List<Object[]> rows, String... prefixes) {
        BigDecimal total = ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            if (!matchesAny(num, prefixes)) continue;
            BigDecimal d = (BigDecimal) r[3];
            BigDecimal c = (BigDecimal) r[4];
            BigDecimal net = c.subtract(d);
            if (net.compareTo(ZERO) > 0) total = total.add(net);
        }
        return total;
    }

    private boolean matchesAny(String num, String... prefixes) {
        for (String p : prefixes) { if (num.startsWith(p)) return true; }
        return false;
    }

    private BigDecimal divSafe(BigDecimal a, BigDecimal b) {
        if (b == null || b.compareTo(ZERO) == 0) return ZERO;
        return a.divide(b, 4, RoundingMode.HALF_UP);
    }

    private String pct(boolean asPercent) { return asPercent ? "%" : "×"; }

    private RatiosDto.Ratio ratio(String code, String libelle, String formule,
                                   BigDecimal valeur, String unite, String niveau) {
        String interp = switch (niveau) {
            case "BON"   -> "Satisfaisant";
            case "MOYEN" -> "À surveiller";
            case "FAIBLE"-> "Insuffisant";
            default      -> "";
        };
        return new RatiosDto.Ratio(code, libelle, formule,
            valeur.setScale(2, RoundingMode.HALF_UP), unite + " — " + interp, niveau);
    }
}
