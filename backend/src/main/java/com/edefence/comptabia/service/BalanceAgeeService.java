package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Tiers;
import com.edefence.comptabia.dto.balance.BalanceAgeeDto;
import com.edefence.comptabia.repository.LigneEcritureRepository;
import com.edefence.comptabia.repository.TiersRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BalanceAgeeService {

    private final LigneEcritureRepository ligneRepo;
    private final TiersRepository         tiersRepo;

    @Transactional(readOnly = true)
    public BalanceAgeeDto.Response calculer(UUID entrepriseId, String type) {
        boolean isClient = "CLIENT".equalsIgnoreCase(type);
        String  prefix   = isClient ? "41%" : "40%";

        List<Object[]> rows = ligneRepo.balanceAgeeRaw(entrepriseId, prefix);

        Map<String, Tiers> tiersMap = tiersRepo
            .search(entrepriseId,
                    isClient ? Tiers.TypeTiers.CLIENT : Tiers.TypeTiers.FOURNISSEUR,
                    null, false, Pageable.unpaged())
            .getContent()
            .stream()
            .filter(t -> t.getCompteNumero() != null)
            .collect(Collectors.toMap(Tiers::getCompteNumero, t -> t, (a, b) -> a));

        Map<String, String>       intituleMap = new LinkedHashMap<>();
        Map<String, BigDecimal[]> bucketsMap  = new LinkedHashMap<>();

        LocalDate today = LocalDate.now();

        for (Object[] row : rows) {
            String     numero   = (String)     row[0];
            String     intitule = (String)     row[1];
            LocalDate  date     = (LocalDate)  row[2];
            BigDecimal debit    = (BigDecimal) row[4];
            BigDecimal credit   = (BigDecimal) row[5];

            BigDecimal net = isClient
                ? debit.subtract(credit)
                : credit.subtract(debit);

            if (net.compareTo(BigDecimal.ZERO) == 0) continue;

            int age    = (int) ChronoUnit.DAYS.between(date, today);
            int bucket = age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3;

            intituleMap.putIfAbsent(numero, intitule);
            BigDecimal[] b = bucketsMap.computeIfAbsent(numero, k ->
                new BigDecimal[]{ BigDecimal.ZERO, BigDecimal.ZERO,
                                  BigDecimal.ZERO, BigDecimal.ZERO });
            b[bucket] = b[bucket].add(net);
        }

        List<BalanceAgeeDto.LigneTiers> lignes = new ArrayList<>();
        for (Map.Entry<String, BigDecimal[]> entry : bucketsMap.entrySet()) {
            String       numero = entry.getKey();
            BigDecimal[] b      = entry.getValue();
            BigDecimal   total  = b[0].add(b[1]).add(b[2]).add(b[3]);
            if (total.compareTo(BigDecimal.ZERO) == 0) continue;

            Tiers  t    = tiersMap.get(numero);
            String nom  = t != null ? t.getNom() : intituleMap.get(numero);
            String code = t != null ? t.getCode() : "";

            int    score  = computeScore(b, total);
            String niveau = scoreToNiveau(score);

            lignes.add(new BalanceAgeeDto.LigneTiers(nom, code, numero,
                new BalanceAgeeDto.Buckets(b[0], b[1], b[2], b[3], total),
                score, niveau));
        }

        lignes.sort(Comparator.comparing(BalanceAgeeDto.LigneTiers::nom));

        BalanceAgeeDto.Buckets totaux = lignes.stream()
            .map(BalanceAgeeDto.LigneTiers::buckets)
            .reduce(new BalanceAgeeDto.Buckets(
                        BigDecimal.ZERO, BigDecimal.ZERO,
                        BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO),
                    (acc, bk) -> new BalanceAgeeDto.Buckets(
                        acc.j0().add(bk.j0()),
                        acc.j30().add(bk.j30()),
                        acc.j60().add(bk.j60()),
                        acc.j90().add(bk.j90()),
                        acc.total().add(bk.total())));

        return new BalanceAgeeDto.Response(
            isClient ? "CLIENT" : "FOURNISSEUR", today, lignes, totaux);
    }

    /** Score 0-100 : j0=0pts, j30=20pts, j60=50pts, j90=100pts, pondéré par montant */
    private int computeScore(BigDecimal[] b, BigDecimal total) {
        if (total.compareTo(BigDecimal.ZERO) == 0) return 0;
        BigDecimal weighted = b[0].multiply(BigDecimal.ZERO)
            .add(b[1].multiply(BigDecimal.valueOf(20)))
            .add(b[2].multiply(BigDecimal.valueOf(50)))
            .add(b[3].multiply(BigDecimal.valueOf(100)));
        return weighted.divide(total, 0, RoundingMode.HALF_UP).intValue();
    }

    private String scoreToNiveau(int score) {
        if (score < 15)  return "FAIBLE";
        if (score < 40)  return "MOYEN";
        if (score < 70)  return "ELEVE";
        return "CRITIQUE";
    }
}
