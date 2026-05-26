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
import java.math.RoundingMode;
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

    @Transactional(readOnly = true)
    public List<AnalytiqueDto.AxeResponse> listerAxesParType(UUID entrepriseId, String type) {
        return axeRepo.findByEntrepriseIdOrderByCodeAsc(entrepriseId).stream()
                .filter(a -> type == null || type.isBlank() || type.equalsIgnoreCase(a.getType()))
                .map(this::toAxeResponse).toList();
    }

    @Transactional
    public AnalytiqueDto.AxeResponse creerAxe(UUID entrepriseId, AnalytiqueDto.AxeRequest req) {
        if (axeRepo.existsByCodeAndEntrepriseId(req.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un axe avec le code '" + req.code() + "' existe déjà.");
        }
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        AxeAnalytique parent = resolveParent(req.parentId(), entrepriseId);

        AxeAnalytique axe = AxeAnalytique.builder()
                .entreprise(entreprise)
                .code(req.code().toUpperCase())
                .intitule(req.intitule())
                .type(req.type() != null ? req.type().toUpperCase() : "AUTRE")
                .montantBudget(req.montantBudget())
                .parent(parent)
                .build();
        return toAxeResponse(axeRepo.save(axe));
    }

    @Transactional
    public AnalytiqueDto.AxeResponse modifierAxe(UUID entrepriseId, UUID axeId,
                                                  AnalytiqueDto.AxeRequest req) {
        AxeAnalytique axe = axeRepo.findByIdAndEntrepriseId(axeId, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Axe introuvable"));
        axe.setIntitule(req.intitule());
        if (req.type() != null) axe.setType(req.type().toUpperCase());
        axe.setMontantBudget(req.montantBudget());
        axe.setParent(resolveParent(req.parentId(), entrepriseId));
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
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Certaines lignes sont introuvables.");
        }
        lignes.forEach(l -> l.setAxeAnalytique(axe));
        ligneRepo.saveAll(lignes);
    }

    // ─── Rapport analytique général ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public AnalytiqueDto.RapportResponse rapport(UUID entrepriseId, LocalDate debut, LocalDate fin) {
        List<Object[]> rows = axeRepo.rapportParAxe(entrepriseId, debut, fin);

        Map<UUID, AnalytiqueDto.RapportAxe>         map      = new LinkedHashMap<>();
        Map<UUID, List<AnalytiqueDto.LigneRapport>> lignesMap = new LinkedHashMap<>();
        Map<UUID, BigDecimal[]>                      totaux   = new LinkedHashMap<>();
        Map<UUID, String[]>                          metaMap  = new LinkedHashMap<>();

        for (Object[] r : rows) {
            UUID       axeId     = (UUID)       r[0];
            String     axeCode   = (String)     r[1];
            String     axeIntit  = (String)     r[2];
            String     axeType   = (String)     r[3];
            BigDecimal axeBudget = (BigDecimal) r[4];
            String     cNumero   = (String)     r[5];
            String     cIntit    = (String)     r[6];
            BigDecimal dbt       = (BigDecimal) r[7];
            BigDecimal crd       = (BigDecimal) r[8];

            lignesMap.computeIfAbsent(axeId, k -> new ArrayList<>())
                     .add(new AnalytiqueDto.LigneRapport(cNumero, cIntit, dbt, crd, dbt.subtract(crd)));

            BigDecimal[] tot = totaux.computeIfAbsent(axeId, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});
            tot[0] = tot[0].add(dbt);
            tot[1] = tot[1].add(crd);

            metaMap.putIfAbsent(axeId, new String[]{axeCode, axeIntit, axeType,
                    axeBudget != null ? axeBudget.toPlainString() : null});
            map.putIfAbsent(axeId, null);
        }

        List<AnalytiqueDto.RapportAxe> axes = new ArrayList<>();
        for (UUID axeId : map.keySet()) {
            BigDecimal[] tot  = totaux.get(axeId);
            String[]     meta = metaMap.get(axeId);
            BigDecimal   td   = tot[0], tc = tot[1], solde = td.subtract(tc);
            BigDecimal   budget = meta[3] != null ? new BigDecimal(meta[3]) : null;
            Double taux = (budget != null && budget.compareTo(BigDecimal.ZERO) > 0)
                    ? td.multiply(BigDecimal.valueOf(100))
                        .divide(budget, 1, RoundingMode.HALF_UP).doubleValue()
                    : null;
            axes.add(new AnalytiqueDto.RapportAxe(
                    axeId, meta[0], meta[1], meta[2],
                    lignesMap.get(axeId), td, tc, solde, budget, taux));
        }
        return new AnalytiqueDto.RapportResponse(debut.toString(), fin.toString(), axes);
    }

    // ─── Rapport bailleur hiérarchique ───────────────────────────────────────

    @Transactional(readOnly = true)
    public AnalytiqueDto.RapportBailleurResponse rapportBailleur(UUID eid, LocalDate debut, LocalDate fin) {
        List<AxeAnalytique> bailleurs = axeRepo.findByEntrepriseIdAndTypeOrderByCodeAsc(eid, "BAILLEUR");
        List<AnalytiqueDto.RapportBailleur> result = new ArrayList<>();

        for (AxeAnalytique b : bailleurs) {
            List<AnalytiqueDto.SousAxe> sousAxes = new ArrayList<>();
            BigDecimal totalDebit  = BigDecimal.ZERO;
            BigDecimal totalCredit = BigDecimal.ZERO;

            // Dépenses directement sur le bailleur
            List<Object[]> directRows = axeRepo.lignesParAxe(eid, b.getId(), debut, fin);
            if (!directRows.isEmpty()) {
                List<AnalytiqueDto.LigneBailleur> lignes = toLignes(directRows);
                BigDecimal td = sum(lignes, true), tc = sum(lignes, false);
                sousAxes.add(new AnalytiqueDto.SousAxe(
                        b.getId(), "—", "Dépenses directes", "BAILLEUR",
                        null, lignes, td, tc, td.subtract(tc), null));
                totalDebit  = totalDebit.add(td);
                totalCredit = totalCredit.add(tc);
            }

            // Axes enfants (projets / activités liés au bailleur)
            for (AxeAnalytique child : axeRepo.findByParentIdOrderByCodeAsc(b.getId())) {
                List<Object[]> childRows = axeRepo.lignesParAxe(eid, child.getId(), debut, fin);
                if (childRows.isEmpty()) continue;
                List<AnalytiqueDto.LigneBailleur> lignes = toLignes(childRows);
                BigDecimal td = sum(lignes, true), tc = sum(lignes, false);
                Double taux = taux(td, child.getMontantBudget());
                sousAxes.add(new AnalytiqueDto.SousAxe(
                        child.getId(), child.getCode(), child.getIntitule(), child.getType(),
                        child.getMontantBudget(), lignes, td, tc, td.subtract(tc), taux));
                totalDebit  = totalDebit.add(td);
                totalCredit = totalCredit.add(tc);
            }

            result.add(new AnalytiqueDto.RapportBailleur(
                    b.getId(), b.getCode(), b.getIntitule(), b.getMontantBudget(),
                    sousAxes, totalDebit, totalCredit, totalDebit.subtract(totalCredit),
                    taux(totalDebit, b.getMontantBudget())));
        }
        return new AnalytiqueDto.RapportBailleurResponse(debut.toString(), fin.toString(), result);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private AxeAnalytique resolveParent(UUID parentId, UUID entrepriseId) {
        if (parentId == null) return null;
        return axeRepo.findByIdAndEntrepriseId(parentId, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Axe parent introuvable"));
    }

    private List<AnalytiqueDto.LigneBailleur> toLignes(List<Object[]> rows) {
        return rows.stream().map(r -> {
            BigDecimal dbt = (BigDecimal) r[2];
            BigDecimal crd = (BigDecimal) r[3];
            return new AnalytiqueDto.LigneBailleur((String) r[0], (String) r[1], dbt, crd, dbt.subtract(crd));
        }).toList();
    }

    private BigDecimal sum(List<AnalytiqueDto.LigneBailleur> lignes, boolean debit) {
        return lignes.stream()
                .map(l -> debit ? l.debit() : l.credit())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Double taux(BigDecimal realise, BigDecimal budget) {
        if (budget == null || budget.compareTo(BigDecimal.ZERO) == 0) return null;
        return realise.multiply(BigDecimal.valueOf(100))
                .divide(budget, 1, RoundingMode.HALF_UP).doubleValue();
    }

    private AnalytiqueDto.AxeResponse toAxeResponse(AxeAnalytique a) {
        return new AnalytiqueDto.AxeResponse(
                a.getId(), a.getCode(), a.getIntitule(), a.isActif(),
                a.getType(), a.getMontantBudget(),
                a.getParent() != null ? a.getParent().getId() : null);
    }
}
