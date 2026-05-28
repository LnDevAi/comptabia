package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.Relance;
import com.edefence.comptabia.domain.Tiers;
import com.edefence.comptabia.dto.relance.RelanceDto;
import com.edefence.comptabia.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RelanceService {

    private final RelanceRepository relanceRepo;
    private final TiersRepository tiersRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final LigneEcritureRepository ligneRepo;

    // ─── Impayés ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RelanceDto.ListeImpayes getImpayes(UUID entrepriseId) {
        // Créances non lettrées sur 411x
        List<Object[]> rows = ligneRepo.creancesImpayeesParCompte(entrepriseId);

        // Map compte → montant impayé
        Map<String, BigDecimal> montantsParCompte = new LinkedHashMap<>();
        for (Object[] r : rows) {
            montantsParCompte.put((String) r[0], (BigDecimal) r[1]);
        }

        // Résumé des relances existantes par tiers
        Map<UUID, Object[]> relanceInfo = new HashMap<>();
        for (Object[] r : relanceRepo.countParTiers(entrepriseId)) {
            relanceInfo.put((UUID) r[0], r);
        }

        // Clients avec compteNumero dans 411x ayant un impayé
        List<Tiers> clients = tiersRepo.search(entrepriseId, Tiers.TypeTiers.CLIENT,
                null, false, org.springframework.data.domain.Pageable.unpaged()).getContent();

        List<RelanceDto.TiersImpaye> result = new ArrayList<>();
        BigDecimal totalImpaye = BigDecimal.ZERO;
        LocalDate today = LocalDate.now();

        for (Tiers t : clients) {
            if (t.getCompteNumero() == null) continue;
            BigDecimal montant = montantsParCompte.get(t.getCompteNumero());
            if (montant == null || montant.compareTo(BigDecimal.ZERO) <= 0) continue;

            Object[] ri = relanceInfo.get(t.getId());
            int nbRelances = ri != null ? ((Long) ri[1]).intValue() : 0;
            LocalDate derniereRelance = ri != null ? ((java.time.LocalDate) ri[2]) : null;

            // Âge estimé en jours (dernière relance ou aujourd'hui)
            int nbJours = derniereRelance != null
                    ? (int) ChronoUnit.DAYS.between(derniereRelance, today)
                    : 0;

            result.add(new RelanceDto.TiersImpaye(
                    t.getId(), t.getCode(), t.getNom(), t.getEmail(),
                    t.getCompteNumero(), montant, nbJours, nbRelances, derniereRelance));
            totalImpaye = totalImpaye.add(montant);
        }

        result.sort(Comparator.comparing(RelanceDto.TiersImpaye::montantImpaye).reversed());
        return new RelanceDto.ListeImpayes(result, totalImpaye, result.size());
    }

    // ─── Historique relances ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<RelanceDto.RelanceRecord> lister(UUID entrepriseId) {
        return relanceRepo.findByEntrepriseIdOrderByDateRelanceDesc(entrepriseId)
                .stream().map(this::toRecord).toList();
    }

    @Transactional(readOnly = true)
    public List<RelanceDto.RelanceRecord> listerParTiers(UUID entrepriseId, UUID tiersId) {
        return relanceRepo.findByTiersIdAndEntrepriseIdOrderByDateRelanceDesc(tiersId, entrepriseId)
                .stream().map(this::toRecord).toList();
    }

    // ─── Créer relance ───────────────────────────────────────────────────────

    @Transactional
    public RelanceDto.RelanceRecord creer(UUID entrepriseId, RelanceDto.CreerRelanceRequest req) {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));
        Tiers tiers = tiersRepo.findByIdAndEntrepriseId(req.tiersId(), entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tiers introuvable"));

        Relance r = Relance.builder()
                .entreprise(entreprise)
                .tiers(tiers)
                .montantRelance(req.montantRelance())
                .niveau(req.niveau())
                .note(req.note())
                .dateRelance(LocalDate.now())
                .build();
        return toRecord(relanceRepo.save(r));
    }

    // ─── Supprimer ───────────────────────────────────────────────────────────

    @Transactional
    public void supprimer(UUID entrepriseId, UUID relanceId) {
        Relance r = relanceRepo.findByIdAndEntrepriseId(relanceId, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Relance introuvable"));
        relanceRepo.delete(r);
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────

    private RelanceDto.RelanceRecord toRecord(Relance r) {
        return new RelanceDto.RelanceRecord(
                r.getId(), r.getTiers().getId(), r.getTiers().getNom(),
                r.getMontantRelance(), r.getNiveau(), r.getNote(), r.getDateRelance());
    }
}
