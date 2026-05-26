package com.edefence.ecompta.service;

import com.edefence.ecompta.dto.ratios.RatiosDto;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RatiosFinanciersService {

    private final LigneEcritureRepository ligneRepo;

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal CENT = BigDecimal.valueOf(100);
    private static final BigDecimal TRSF = BigDecimal.valueOf(365);

    private record Agg(
        BigDecimal immos,           BigDecimal stocks,          BigDecimal creancesClients,
        BigDecimal autresCreances,  BigDecimal valEncaisser,    BigDecimal disponibilites,
        BigDecimal capitauxPropres, BigDecimal dettesLT,
        BigDecimal dettesFournisseurs, BigDecimal dettesFiscSoc, BigDecimal autresDettesCirc,
        BigDecimal chiffreAffaires, BigDecimal achats,          BigDecimal chargesPersonnel,
        BigDecimal resultatNet,     BigDecimal caf,
        BigDecimal actifCirculant,  BigDecimal passifCirculant, BigDecimal totalActif,
        BigDecimal frng,            BigDecimal bfr,             BigDecimal tresorerieNette,
        BigDecimal dettesFinancieres
    ) {}

    @Transactional(readOnly = true)
    public RatiosDto.Response calculer(UUID entrepriseId, int exercice) {
        Agg agN  = computeAgg(entrepriseId, exercice);
        Agg agN1 = computeAgg(entrepriseId, exercice - 1);

        List<RatiosDto.Groupe> groupesN  = buildGroupes(agN,  agN1);
        List<RatiosDto.Groupe> groupesN1 = buildGroupes(agN1, null);

        Map<String, Integer> scoresN  = computeScores(groupesN);
        Map<String, Integer> scoresN1 = computeScores(groupesN1);
        int scoreGlobal = computeScoreGlobal(scoresN);

        return new RatiosDto.Response(
            exercice, groupesN,
            agN.totalActif(), agN.chiffreAffaires(), agN.resultatNet(),
            agN.capitauxPropres(), agN.dettesFinancieres(),
            agN.frng(), agN.bfr(), agN.tresorerieNette(),
            scoreGlobal, scoresN, scoresN1);
    }

    private Agg computeAgg(UUID eid, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> rows = ligneRepo.balanceParCompte(eid, from, to);

        BigDecimal immos              = soldeDebit (rows, "2");
        BigDecimal stocks             = soldeDebit (rows, "3");
        BigDecimal creancesClients    = soldeDebit (rows, "41");
        BigDecimal autresCreances     = soldeDebit (rows, "44","45","46","47","48");
        BigDecimal valEncaisser       = soldeDebit (rows, "50","57");
        BigDecimal disponibilites     = soldeDebit (rows, "51","52","53");

        BigDecimal capitauxPropres    = soldeCredit(rows, "10","11","12","13","14","15");
        BigDecimal dettesLT           = soldeCredit(rows, "16","17");
        BigDecimal dettesFournisseurs = soldeCredit(rows, "40");
        BigDecimal dettesFiscSoc      = soldeCredit(rows, "42","43","44");
        BigDecimal autresDettesCirc   = soldeCredit(rows, "46","47","48");

        BigDecimal chiffreAffaires    = soldeCredit(rows, "70","71","72","73","74");
        BigDecimal achats             = soldeDebit (rows, "60","61","62","63","64","65");
        BigDecimal chargesPersonnel   = soldeDebit (rows, "66");
        BigDecimal produitsTotaux     = soldeCredit(rows, "7");
        BigDecimal chargesTotales     = soldeDebit (rows, "6","8");
        BigDecimal dotations          = soldeDebit (rows, "68","69");
        BigDecimal reprises           = soldeCredit(rows, "78","79");

        BigDecimal resultatNet       = produitsTotaux.subtract(chargesTotales);
        BigDecimal caf               = resultatNet.add(dotations).subtract(reprises);
        BigDecimal actifCirculant    = stocks.add(creancesClients).add(autresCreances)
                                            .add(valEncaisser).add(disponibilites);
        BigDecimal passifCirculant   = dettesFournisseurs.add(dettesFiscSoc).add(autresDettesCirc);
        BigDecimal totalActif        = immos.add(actifCirculant);
        BigDecimal frng              = capitauxPropres.add(dettesLT).subtract(immos);
        BigDecimal bfr               = stocks.add(creancesClients)
                                            .subtract(dettesFournisseurs).subtract(dettesFiscSoc);
        BigDecimal tresorerieNette   = disponibilites;
        BigDecimal dettesFinancieres = dettesLT;

        return new Agg(immos, stocks, creancesClients, autresCreances, valEncaisser, disponibilites,
            capitauxPropres, dettesLT, dettesFournisseurs, dettesFiscSoc, autresDettesCirc,
            chiffreAffaires, achats, chargesPersonnel, resultatNet, caf,
            actifCirculant, passifCirculant, totalActif, frng, bfr, tresorerieNette, dettesFinancieres);
    }

    private List<RatiosDto.Groupe> buildGroupes(Agg n, Agg n1) {

        // ── Groupe 1 : Liquidité ──────────────────────────────────────────────
        List<RatiosDto.Ratio> liquidite = new ArrayList<>();

        BigDecimal liqGenN  = divSafe(n.actifCirculant(), n.passifCirculant());
        BigDecimal liqGenN1 = n1 != null ? divSafe(n1.actifCirculant(), n1.passifCirculant()) : null;
        liquidite.add(ratio("LIQ_GEN", "Liquidité générale",
            "Actif circulant / Passif circulant", liqGenN, liqGenN1,
            liqGenN.compareTo(BigDecimal.valueOf(1.5)) >= 0 ? "BON"
            : liqGenN.compareTo(BigDecimal.ONE) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal liqRedN  = divSafe(n.actifCirculant().subtract(n.stocks()), n.passifCirculant());
        BigDecimal liqRedN1 = n1 != null
            ? divSafe(n1.actifCirculant().subtract(n1.stocks()), n1.passifCirculant()) : null;
        liquidite.add(ratio("LIQ_RED", "Liquidité réduite",
            "(Actif circulant − Stocks) / Passif circulant", liqRedN, liqRedN1,
            liqRedN.compareTo(BigDecimal.ONE) >= 0 ? "BON"
            : liqRedN.compareTo(new BigDecimal("0.5")) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal liqImmN  = divSafe(n.disponibilites(), n.passifCirculant());
        BigDecimal liqImmN1 = n1 != null ? divSafe(n1.disponibilites(), n1.passifCirculant()) : null;
        liquidite.add(ratio("LIQ_IMM", "Liquidité immédiate",
            "Disponibilités / Passif circulant", liqImmN, liqImmN1,
            liqImmN.compareTo(new BigDecimal("0.2")) >= 0 ? "BON"
            : liqImmN.compareTo(new BigDecimal("0.1")) >= 0 ? "MOYEN" : "FAIBLE"));

        // ── Groupe 2 : Solvabilité ────────────────────────────────────────────
        List<RatiosDto.Ratio> solvabilite = new ArrayList<>();

        BigDecimal autN  = divSafe(n.capitauxPropres(), n.totalActif()).multiply(CENT);
        BigDecimal autN1 = n1 != null
            ? divSafe(n1.capitauxPropres(), n1.totalActif()).multiply(CENT) : null;
        solvabilite.add(ratio("SOL_AUT", "Autonomie financière",
            "Capitaux propres / Total actif × 100", autN, autN1,
            autN.compareTo(BigDecimal.valueOf(40)) >= 0 ? "BON"
            : autN.compareTo(BigDecimal.valueOf(20)) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal endN  = divSafe(n.dettesFinancieres(), n.capitauxPropres());
        BigDecimal endN1 = n1 != null
            ? divSafe(n1.dettesFinancieres(), n1.capitauxPropres()) : null;
        solvabilite.add(ratio("SOL_END", "Ratio d'endettement",
            "Dettes financières / Capitaux propres", endN, endN1,
            endN.compareTo(BigDecimal.ONE) <= 0 ? "BON"
            : endN.compareTo(BigDecimal.valueOf(2)) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal capN  = divSafe(n.dettesFinancieres(), n.caf());
        BigDecimal capN1 = n1 != null ? divSafe(n1.dettesFinancieres(), n1.caf()) : null;
        solvabilite.add(ratio("SOL_CAP", "Capacité de remboursement",
            "Dettes financières / CAF (années)", capN, capN1,
            capN.compareTo(BigDecimal.valueOf(3)) <= 0 ? "BON"
            : capN.compareTo(BigDecimal.valueOf(5)) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal solvGenN  = divSafe(n.totalActif(), n.passifCirculant().add(n.dettesLT()));
        BigDecimal solvGenN1 = n1 != null
            ? divSafe(n1.totalActif(), n1.passifCirculant().add(n1.dettesLT())) : null;
        solvabilite.add(ratio("SOL_GEN", "Solvabilité générale",
            "Total actif / Total dettes", solvGenN, solvGenN1,
            solvGenN.compareTo(BigDecimal.valueOf(2)) >= 0 ? "BON"
            : solvGenN.compareTo(BigDecimal.ONE) >= 0 ? "MOYEN" : "FAIBLE"));

        // ── Groupe 3 : Rentabilité ────────────────────────────────────────────
        List<RatiosDto.Ratio> rentabilite = new ArrayList<>();

        BigDecimal mnN  = divSafe(n.resultatNet(), n.chiffreAffaires()).multiply(CENT);
        BigDecimal mnN1 = n1 != null
            ? divSafe(n1.resultatNet(), n1.chiffreAffaires()).multiply(CENT) : null;
        rentabilite.add(ratio("RENT_MN", "Marge nette",
            "Résultat net / CA × 100", mnN, mnN1,
            mnN.compareTo(BigDecimal.valueOf(5)) >= 0 ? "BON"
            : mnN.compareTo(ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal roeN  = divSafe(n.resultatNet(), n.capitauxPropres()).multiply(CENT);
        BigDecimal roeN1 = n1 != null
            ? divSafe(n1.resultatNet(), n1.capitauxPropres()).multiply(CENT) : null;
        rentabilite.add(ratio("RENT_ROE", "Rentabilité des CP (ROE)",
            "Résultat net / Capitaux propres × 100", roeN, roeN1,
            roeN.compareTo(BigDecimal.valueOf(10)) >= 0 ? "BON"
            : roeN.compareTo(ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal roaN  = divSafe(n.resultatNet(), n.totalActif()).multiply(CENT);
        BigDecimal roaN1 = n1 != null
            ? divSafe(n1.resultatNet(), n1.totalActif()).multiply(CENT) : null;
        rentabilite.add(ratio("RENT_ROA", "Rentabilité des actifs (ROA)",
            "Résultat net / Total actif × 100", roaN, roaN1,
            roaN.compareTo(BigDecimal.valueOf(5)) >= 0 ? "BON"
            : roaN.compareTo(ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal cafN  = divSafe(n.caf(), n.chiffreAffaires()).multiply(CENT);
        BigDecimal cafN1 = n1 != null
            ? divSafe(n1.caf(), n1.chiffreAffaires()).multiply(CENT) : null;
        rentabilite.add(ratio("RENT_CAF", "Taux de CAF",
            "CAF / CA × 100", cafN, cafN1,
            cafN.compareTo(BigDecimal.valueOf(8)) >= 0 ? "BON"
            : cafN.compareTo(ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        // ── Groupe 4 : Équilibre financier ───────────────────────────────────
        List<RatiosDto.Ratio> equilibre = new ArrayList<>();

        equilibre.add(ratio("EQ_FRNG", "Fonds de Roulement Net Global (FRNG)",
            "Ressources stables − Actif immobilisé",
            n.frng(), n1 != null ? n1.frng() : null,
            n.frng().compareTo(ZERO) >= 0 ? "BON" : "FAIBLE"));

        equilibre.add(ratio("EQ_BFR", "Besoin en Fonds de Roulement (BFR)",
            "Stocks + Créances clients − Dettes fournisseurs − Dettes fisc.",
            n.bfr(), n1 != null ? n1.bfr() : null,
            n.bfr().compareTo(ZERO) <= 0 ? "BON"
            : n.bfr().compareTo(n.frng()) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal tnN  = n.frng().subtract(n.bfr());
        BigDecimal tnN1 = n1 != null ? n1.frng().subtract(n1.bfr()) : null;
        equilibre.add(ratio("EQ_TN", "Trésorerie Nette (TN)",
            "FRNG − BFR", tnN, tnN1,
            tnN.compareTo(ZERO) >= 0 ? "BON" : "FAIBLE"));

        BigDecimal frngCaN  = divSafe(n.frng(), n.chiffreAffaires()).multiply(CENT);
        BigDecimal frngCaN1 = n1 != null
            ? divSafe(n1.frng(), n1.chiffreAffaires()).multiply(CENT) : null;
        equilibre.add(ratio("EQ_FRNG_CA", "FRNG en % du CA",
            "FRNG / CA × 100", frngCaN, frngCaN1,
            frngCaN.compareTo(BigDecimal.valueOf(15)) >= 0 ? "BON"
            : frngCaN.compareTo(ZERO) >= 0 ? "MOYEN" : "FAIBLE"));

        // ── Groupe 5 : Activité ──────────────────────────────────────────────
        List<RatiosDto.Ratio> activite = new ArrayList<>();

        BigDecimal cliN  = n.chiffreAffaires().compareTo(ZERO) != 0
            ? n.creancesClients().multiply(TRSF).divide(n.chiffreAffaires(), 1, RoundingMode.HALF_UP)
            : ZERO;
        BigDecimal cliN1 = n1 != null && n1.chiffreAffaires().compareTo(ZERO) != 0
            ? n1.creancesClients().multiply(TRSF).divide(n1.chiffreAffaires(), 1, RoundingMode.HALF_UP)
            : null;
        activite.add(ratio("ACT_CLI", "Délai de règlement clients",
            "Clients / CA × 365", cliN, cliN1,
            cliN.compareTo(BigDecimal.valueOf(45)) <= 0 ? "BON"
            : cliN.compareTo(BigDecimal.valueOf(90)) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal fnrN  = n.achats().compareTo(ZERO) != 0
            ? n.dettesFournisseurs().multiply(TRSF).divide(n.achats(), 1, RoundingMode.HALF_UP)
            : ZERO;
        BigDecimal fnrN1 = n1 != null && n1.achats().compareTo(ZERO) != 0
            ? n1.dettesFournisseurs().multiply(TRSF).divide(n1.achats(), 1, RoundingMode.HALF_UP)
            : null;
        activite.add(ratio("ACT_FNR", "Délai de règlement fournisseurs",
            "Fournisseurs / Achats × 365", fnrN, fnrN1,
            fnrN.compareTo(BigDecimal.valueOf(30)) >= 0 ? "BON"
            : fnrN.compareTo(BigDecimal.valueOf(15)) >= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal stkN  = n.achats().compareTo(ZERO) != 0 && n.stocks().compareTo(ZERO) != 0
            ? n.stocks().multiply(TRSF).divide(n.achats(), 1, RoundingMode.HALF_UP)
            : ZERO;
        BigDecimal stkN1 = n1 != null && n1.achats().compareTo(ZERO) != 0 && n1.stocks().compareTo(ZERO) != 0
            ? n1.stocks().multiply(TRSF).divide(n1.achats(), 1, RoundingMode.HALF_UP)
            : null;
        activite.add(ratio("ACT_STK", "Durée de rotation des stocks",
            "Stocks / Achats × 365", stkN, stkN1,
            stkN.compareTo(BigDecimal.valueOf(30)) <= 0 ? "BON"
            : stkN.compareTo(BigDecimal.valueOf(90)) <= 0 ? "MOYEN" : "FAIBLE"));

        BigDecimal chrN  = n.chiffreAffaires().compareTo(ZERO) != 0
            ? n.chargesPersonnel().multiply(CENT).divide(n.chiffreAffaires(), 1, RoundingMode.HALF_UP)
            : ZERO;
        BigDecimal chrN1 = n1 != null && n1.chiffreAffaires().compareTo(ZERO) != 0
            ? n1.chargesPersonnel().multiply(CENT).divide(n1.chiffreAffaires(), 1, RoundingMode.HALF_UP)
            : null;
        activite.add(ratio("ACT_CHR", "Charges de personnel / CA",
            "Charges personnel / CA × 100", chrN, chrN1,
            chrN.compareTo(BigDecimal.valueOf(50)) <= 0 ? "BON"
            : chrN.compareTo(BigDecimal.valueOf(70)) <= 0 ? "MOYEN" : "FAIBLE"));

        return List.of(
            new RatiosDto.Groupe("Liquidité",           liquidite),
            new RatiosDto.Groupe("Solvabilité",         solvabilite),
            new RatiosDto.Groupe("Rentabilité",         rentabilite),
            new RatiosDto.Groupe("Équilibre financier", equilibre),
            new RatiosDto.Groupe("Activité",            activite)
        );
    }

    private Map<String, Integer> computeScores(List<RatiosDto.Groupe> groupes) {
        Map<String, Integer> map = new LinkedHashMap<>();
        for (RatiosDto.Groupe g : groupes) {
            int sum = 0, count = 0;
            for (RatiosDto.Ratio r : g.ratios()) {
                sum += switch (r.niveau()) {
                    case "BON"   -> 100;
                    case "MOYEN" -> 50;
                    default      -> 0;
                };
                count++;
            }
            map.put(g.titre(), count > 0 ? sum / count : 0);
        }
        return map;
    }

    private int computeScoreGlobal(Map<String, Integer> scores) {
        int[] poids = {20, 25, 30, 15, 10};
        int i = 0; long total = 0;
        for (int s : scores.values()) {
            total += (long) s * poids[i++];
            if (i >= poids.length) break;
        }
        return (int)(total / 100);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private BigDecimal soldeDebit(List<Object[]> rows, String... prefixes) {
        BigDecimal total = ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            if (!matchesAny(num, prefixes)) continue;
            BigDecimal net = ((BigDecimal) r[3]).subtract((BigDecimal) r[4]);
            if (net.compareTo(ZERO) > 0) total = total.add(net);
        }
        return total;
    }

    private BigDecimal soldeCredit(List<Object[]> rows, String... prefixes) {
        BigDecimal total = ZERO;
        for (Object[] r : rows) {
            String num = (String) r[0];
            if (!matchesAny(num, prefixes)) continue;
            BigDecimal net = ((BigDecimal) r[4]).subtract((BigDecimal) r[3]);
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

    private RatiosDto.Ratio ratio(String code, String libelle, String formule,
                                   BigDecimal valN, BigDecimal valN1, String niveau) {
        String interp = switch (niveau) {
            case "BON"    -> "Satisfaisant";
            case "MOYEN"  -> "À surveiller";
            case "FAIBLE" -> "Insuffisant";
            default       -> "";
        };
        double evo = 0;
        if (valN1 != null && valN1.compareTo(ZERO) != 0) {
            evo = valN.subtract(valN1)
                      .divide(valN1.abs(), 4, RoundingMode.HALF_UP)
                      .multiply(CENT).doubleValue();
        }
        return new RatiosDto.Ratio(code, libelle, formule,
            valN.setScale(2, RoundingMode.HALF_UP), interp, niveau,
            valN1 != null ? valN1.setScale(2, RoundingMode.HALF_UP) : null,
            evo);
    }
}
