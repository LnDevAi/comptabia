package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.AxeAnalytique;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.LigneEcriture;
import com.edefence.ecompta.dto.analytique.AnalytiqueDto;
import com.edefence.ecompta.repository.AxeAnalytiqueRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalytiqueService {

    private final AxeAnalytiqueRepository axeRepo;
    private final LigneEcritureRepository ligneRepo;
    private final EntrepriseRepository entrepriseRepo;

    // ─── CRUD axes ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AnalytiqueDto.AxeResponse> listerAxes(UUID entrepriseId) {
        return axeRepo.findByEntrepriseIdOrderByCodeAsc(entrepriseId)
                .stream().map(this::toAxeResponse).toList();
    }

    @Transactional
    public AnalytiqueDto.AxeResponse creerAxe(UUID entrepriseId, AnalytiqueDto.AxeRequest req) {
        if (axeRepo.existsByCodeAndEntrepriseId(req.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un axe avec le code '" + req.code() + "' existe déjà.");
        }
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        AxeAnalytique axe = AxeAnalytique.builder()
                .entreprise(entreprise)
                .code(req.code().toUpperCase())
                .intitule(req.intitule())
                .build();
        return toAxeResponse(axeRepo.save(axe));
    }

    @Transactional
    public AnalytiqueDto.AxeResponse modifierAxe(UUID entrepriseId, UUID axeId,
                                                  AnalytiqueDto.AxeRequest req) {
        AxeAnalytique axe = axeRepo.findByIdAndEntrepriseId(axeId, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Axe introuvable"));
        axe.setIntitule(req.intitule());
        return toAxeResponse(axeRepo.save(axe));
    }

    @Transactional
    public void toggleActif(UUID entrepriseId, UUID axeId) {
        AxeAnalytique axe = axeRepo.findByIdAndEntrepriseId(axeId, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Axe introuvable"));
        axe.setActif(!axe.isActif());
        axeRepo.save(axe);
    }

    @Transactional
    public void supprimerAxe(UUID entrepriseId, UUID axeId) {
        AxeAnalytique axe = axeRepo.findByIdAndEntrepriseId(axeId, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Axe introuvable"));
        axeRepo.delete(axe);
    }

    // ─── Ventilation ─────────────────────────────────────────────────────────

    @Transactional
    public void ventiler(UUID entrepriseId, List<UUID> ligneIds, UUID axeId) {
        AxeAnalytique axe = axeId != null
                ? axeRepo.findByIdAndEntrepriseId(axeId, entrepriseId)
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Axe introuvable"))
                : null;

        List<LigneEcriture> lignes = ligneRepo.findByIdsAndEntreprise(ligneIds, entrepriseId);
        if (lignes.size() != ligneIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Certaines lignes sont introuvables.");
        }
        lignes.forEach(l -> l.setAxeAnalytique(axe));
        ligneRepo.saveAll(lignes);
    }

    // ─── Rapport analytique ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public AnalytiqueDto.RapportResponse rapport(UUID entrepriseId, LocalDate debut, LocalDate fin) {
        List<Object[]> rows = axeRepo.rapportParAxe(entrepriseId, debut, fin);

        // Group by axe
        Map<UUID, AnalytiqueDto.RapportAxe> map = new LinkedHashMap<>();
        Map<UUID, List<AnalytiqueDto.LigneRapport>> lignesMap = new LinkedHashMap<>();
        Map<UUID, BigDecimal[]> totauxMap = new LinkedHashMap<>();

        for (Object[] r : rows) {
            UUID axeId       = (UUID)       r[0];
            String axeCode   = (String)     r[1];
            String axeIntit  = (String)     r[2];
            String cNumero   = (String)     r[3];
            String cIntit    = (String)     r[4];
            BigDecimal dbt   = (BigDecimal) r[5];
            BigDecimal crd   = (BigDecimal) r[6];
            BigDecimal solde = dbt.subtract(crd);

            lignesMap.computeIfAbsent(axeId, k -> new ArrayList<>())
                     .add(new AnalytiqueDto.LigneRapport(cNumero, cIntit, dbt, crd, solde));

            BigDecimal[] tot = totauxMap.computeIfAbsent(axeId, k -> new BigDecimal[]{
                    BigDecimal.ZERO, BigDecimal.ZERO, axeId != null ? null : null,
            });
            // tot[0] = totalDebit, tot[1] = totalCredit
            tot[0] = tot[0].add(dbt);
            tot[1] = tot[1].add(crd);

            map.putIfAbsent(axeId, new AnalytiqueDto.RapportAxe(
                    axeId, axeCode, axeIntit, null, null, null, null));
        }

        List<AnalytiqueDto.RapportAxe> axes = new ArrayList<>();
        for (Map.Entry<UUID, AnalytiqueDto.RapportAxe> e : map.entrySet()) {
            UUID axeId = e.getKey();
            BigDecimal[] tot = totauxMap.get(axeId);
            BigDecimal td = tot[0], tc = tot[1];
            axes.add(new AnalytiqueDto.RapportAxe(
                    e.getValue().axeId(), e.getValue().axeCode(), e.getValue().axeIntitule(),
                    lignesMap.get(axeId), td, tc, td.subtract(tc)));
        }

        return new AnalytiqueDto.RapportResponse(debut.toString(), fin.toString(), axes);
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────

    private AnalytiqueDto.AxeResponse toAxeResponse(AxeAnalytique a) {
        return new AnalytiqueDto.AxeResponse(a.getId(), a.getCode(), a.getIntitule(), a.isActif());
    }
}
