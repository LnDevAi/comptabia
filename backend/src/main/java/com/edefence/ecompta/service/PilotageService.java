package com.edefence.ecompta.service;

import com.edefence.ecompta.dto.pilotage.PilotageDto;
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
public class PilotageService {

    private final LigneEcritureRepository ligneRepo;
    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal CENT = BigDecimal.valueOf(100);

    @Transactional(readOnly = true)
    public PilotageDto.Response getTableauBord(UUID entrepriseId, int exercice) {
        List<PilotageDto.KpiAnnuel> evolution = new ArrayList<>();
        for (int y = exercice - 3; y <= exercice; y++) {
            evolution.add(computeKpi(entrepriseId, y));
        }

        PilotageDto.KpiAnnuel cur = evolution.get(evolution.size() - 1);
        List<PilotageDto.ChargePoste> charges = computeCharges(entrepriseId, exercice);
        List<PilotageDto.RatioCle> ratios = computeRatiosCles(entrepriseId, exercice, cur);

        return new PilotageDto.Response(
                exercice, evolution, charges, ratios,
                cur.ca(), cur.resultatNet(), cur.frng(), cur.bfr(), cur.tn()
        );
    }

    private PilotageDto.KpiAnnuel computeKpi(UUID entrepriseId, int year) {
        var bal = ligneRepo.balanceParCompte(entrepriseId,
                LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31));

        BigDecimal ca = ZERO, charges = ZERO;
        BigDecimal stocks = ZERO, clients = ZERO;
        BigDecimal cp = ZERO, immos = ZERO, dettesLT = ZERO;
        BigDecimal fourn = ZERO, dettesFisc = ZERO;

        for (Object[] r : bal) {
            String num = (String) r[0];
            BigDecimal d = (BigDecimal) r[3];
            BigDecimal c = (BigDecimal) r[4];
            BigDecimal sd = d.subtract(c).max(ZERO);
            BigDecimal sc = c.subtract(d).max(ZERO);

            if      (num.startsWith("2"))  immos    = immos.add(sd);
            else if (num.startsWith("3"))  stocks   = stocks.add(sd);
            else if (num.startsWith("41")) clients  = clients.add(sd);
            else if (num.startsWith("10") || num.startsWith("11") || num.startsWith("12")
                  || num.startsWith("13") || num.startsWith("14") || num.startsWith("15"))
                cp = cp.add(sc);
            else if (num.startsWith("16") || num.startsWith("17")) dettesLT = dettesLT.add(sc);
            else if (num.startsWith("40")) fourn     = fourn.add(sc);
            else if (num.startsWith("42") || num.startsWith("43") || num.startsWith("44"))
                dettesFisc = dettesFisc.add(sc);
            else if (num.startsWith("6")) charges = charges.add(sd);
            else if (num.startsWith("7")) ca      = ca.add(sc);
        }

        BigDecimal resultatNet = ca.subtract(charges);
        BigDecimal marge = ca.compareTo(ZERO) > 0
                ? resultatNet.divide(ca, 4, RoundingMode.HALF_UP).multiply(CENT)
                : ZERO;
        BigDecimal frng = cp.add(dettesLT).subtract(immos);
        BigDecimal bfr  = stocks.add(clients).subtract(fourn).subtract(dettesFisc);

        return new PilotageDto.KpiAnnuel(year, ca, charges, resultatNet, marge, frng, bfr, frng.subtract(bfr));
    }

    private List<PilotageDto.ChargePoste> computeCharges(UUID entrepriseId, int year) {
        var bal = ligneRepo.balanceParCompte(entrepriseId,
                LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31));

        Map<String, String> labels = Map.of(
                "60", "Achats marchandises", "61", "Matières/fourn.",
                "62", "Transports", "63", "Services ext. A",
                "64", "Services ext. B", "65", "Autres charges",
                "66", "Charges personnel", "67", "Charges financières",
                "68", "Dotations amort.", "69", "Charges fiscales"
        );
        Map<String, BigDecimal> acc = new LinkedHashMap<>();

        for (Object[] r : bal) {
            String num = (String) r[0];
            if (!num.startsWith("6") || num.length() < 2) continue;
            String key = num.substring(0, 2);
            BigDecimal montant = ((BigDecimal) r[3]).subtract((BigDecimal) r[4]).max(ZERO);
            acc.merge(key, montant, BigDecimal::add);
        }

        BigDecimal total = acc.values().stream().reduce(ZERO, BigDecimal::add);
        if (total.compareTo(ZERO) == 0) return List.of();

        List<PilotageDto.ChargePoste> result = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> e : acc.entrySet()) {
            if (e.getValue().compareTo(ZERO) <= 0) continue;
            double pct = e.getValue().divide(total, 4, RoundingMode.HALF_UP)
                    .multiply(CENT).doubleValue();
            result.add(new PilotageDto.ChargePoste(
                    e.getKey(), labels.getOrDefault(e.getKey(), "Classe " + e.getKey()),
                    e.getValue(), pct));
        }
        result.sort((a, b) -> b.montant().compareTo(a.montant()));
        return result;
    }

    private List<PilotageDto.RatioCle> computeRatiosCles(UUID entrepriseId, int year, PilotageDto.KpiAnnuel kpi) {
        var bal = ligneRepo.balanceParCompte(entrepriseId,
                LocalDate.of(year, 1, 1), LocalDate.of(year, 12, 31));

        BigDecimal acCirc = ZERO, pcCirc = ZERO, cp = ZERO, actif = ZERO, stocks = ZERO;

        for (Object[] r : bal) {
            String num = (String) r[0];
            BigDecimal d = (BigDecimal) r[3];
            BigDecimal c = (BigDecimal) r[4];
            BigDecimal sd = d.subtract(c).max(ZERO);
            BigDecimal sc = c.subtract(d).max(ZERO);

            if (num.startsWith("3")) { stocks = stocks.add(sd); acCirc = acCirc.add(sd); }
            else if (num.startsWith("41") || num.startsWith("5")) acCirc = acCirc.add(sd);
            else if (num.startsWith("40") || num.startsWith("42")
                  || num.startsWith("43") || num.startsWith("44")) pcCirc = pcCirc.add(sc);
            else if (num.startsWith("10") || num.startsWith("11") || num.startsWith("12")
                  || num.startsWith("13") || num.startsWith("14") || num.startsWith("15"))
                cp = cp.add(sc);

            char first = num.charAt(0);
            if (first >= '1' && first <= '5') actif = actif.add(sd);
        }

        List<PilotageDto.RatioCle> result = new ArrayList<>();

        if (pcCirc.compareTo(ZERO) > 0) {
            double liq = acCirc.divide(pcCirc, 4, RoundingMode.HALF_UP).doubleValue();
            result.add(new PilotageDto.RatioCle("LIQ_GEN", "Liquidité générale", liq,
                    liq >= 2 ? "BON" : liq >= 1 ? "MOYEN" : "FAIBLE"));
        }
        if (actif.compareTo(ZERO) > 0) {
            double aut = cp.divide(actif, 4, RoundingMode.HALF_UP).multiply(CENT).doubleValue();
            result.add(new PilotageDto.RatioCle("AUT_FIN", "Autonomie financière", aut,
                    aut >= 40 ? "BON" : aut >= 20 ? "MOYEN" : "FAIBLE"));
        }
        double marge = kpi.margeNette().doubleValue();
        result.add(new PilotageDto.RatioCle("MARGE_NET", "Marge nette", marge,
                marge >= 10 ? "BON" : marge >= 3 ? "MOYEN" : "FAIBLE"));

        if (kpi.ca().compareTo(ZERO) > 0) {
            double txChg = kpi.charges().divide(kpi.ca(), 4, RoundingMode.HALF_UP)
                    .multiply(CENT).doubleValue();
            result.add(new PilotageDto.RatioCle("TX_CHARGES", "Taux de charges", txChg,
                    txChg <= 80 ? "BON" : txChg <= 90 ? "MOYEN" : "FAIBLE"));
        }

        return result;
    }
}
