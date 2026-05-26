package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.DeclarationFiscale;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.RefObligationFiscale;
import com.edefence.ecompta.dto.fiscal.FiscalDto;
import com.edefence.ecompta.repository.DeclarationFiscaleRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.RefObligationFiscaleRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GestionFiscaleService {

    private final RefObligationFiscaleRepository refRepo;
    private final DeclarationFiscaleRepository   declRepo;
    private final EntrepriseRepository           entrepriseRepo;

    // ── Référentiel ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FiscalDto.ObligationRefResponse> refParPays(String codePays) {
        return refRepo.findByPays(codePays).stream().map(this::toRefResponse).toList();
    }

    // ── Déclarations ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<FiscalDto.DeclarationResponse> findAll(UUID eid) {
        return declRepo.findAllByEntreprise(eid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FiscalDto.DeclarationResponse> findByAnnee(UUID eid, int annee) {
        return declRepo.findByAnnee(eid, String.valueOf(annee)).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FiscalDto.CalendrierItem> calendrier(UUID eid, int annee) {
        List<DeclarationFiscale> declarations = declRepo.findByAnnee(eid, String.valueOf(annee));
        Map<String, DeclarationFiscale> byKey = declarations.stream()
                .collect(Collectors.toMap(d -> d.getCodeImpot() + "_" + d.getPeriode(), d -> d));

        Entreprise entreprise = entrepriseRepo.findById(eid)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        String codePays = entreprise.getCodePays() != null ? entreprise.getCodePays() : "BF";
        List<RefObligationFiscale> refs = refRepo.findByPays(codePays);

        List<FiscalDto.CalendrierItem> items = new ArrayList<>();
        for (RefObligationFiscale ref : refs) {
            List<String> periodes = genererPeriodes(ref.getFrequence(), annee);
            for (String periode : periodes) {
                LocalDate echeance = calculerEcheance(ref.getFrequence(), periode, ref.getDelaiJours(), annee);
                String key = ref.getCodeImpot() + "_" + periode;
                DeclarationFiscale decl = byKey.get(key);
                items.add(new FiscalDto.CalendrierItem(
                        ref.getCodeImpot(), ref.getLibelle(), periode, echeance,
                        decl != null ? decl.getStatut() : null,
                        decl != null ? decl.getMontantImpot() : null,
                        decl != null ? decl.getId() : null));
            }
        }
        items.sort((a, b) -> a.dateEcheance().compareTo(b.dateEcheance()));
        return items;
    }

    @Transactional
    public FiscalDto.DeclarationResponse create(UUID eid, FiscalDto.DeclarationSaveRequest req) {
        DeclarationFiscale d = DeclarationFiscale.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .codeImpot(req.codeImpot())
                .libelle(req.libelle())
                .periode(req.periode())
                .dateEcheance(req.dateEcheance())
                .montantBase(req.montantBase())
                .montantImpot(req.montantImpot())
                .notes(req.notes())
                .build();
        return toResponse(declRepo.save(d));
    }

    @Transactional
    public FiscalDto.DeclarationResponse update(UUID id, UUID eid, FiscalDto.DeclarationUpdateRequest req) {
        DeclarationFiscale d = findOrThrow(id, eid);
        if (req.statut() != null)           d.setStatut(req.statut());
        if (req.montantBase() != null)      d.setMontantBase(req.montantBase());
        if (req.montantImpot() != null)     d.setMontantImpot(req.montantImpot());
        if (req.referencePaiement() != null) d.setReferencePaiement(req.referencePaiement());
        if (req.notes() != null)            d.setNotes(req.notes());
        return toResponse(declRepo.save(d));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        declRepo.delete(findOrThrow(id, eid));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private List<String> genererPeriodes(RefObligationFiscale.Frequence freq, int annee) {
        List<String> periodes = new ArrayList<>();
        switch (freq) {
            case MENSUEL -> {
                for (int m = 1; m <= 12; m++) periodes.add(String.format("%d-%02d", annee, m));
            }
            case TRIMESTRIEL -> {
                periodes.addAll(List.of(annee + "-Q1", annee + "-Q2", annee + "-Q3", annee + "-Q4"));
            }
            case SEMESTRIEL -> periodes.addAll(List.of(annee + "-S1", annee + "-S2"));
            case ANNUEL      -> periodes.add(String.valueOf(annee));
        }
        return periodes;
    }

    private LocalDate calculerEcheance(RefObligationFiscale.Frequence freq, String periode, int delaiJours, int annee) {
        return switch (freq) {
            case MENSUEL -> {
                int mois = Integer.parseInt(periode.substring(5));
                LocalDate finMois = LocalDate.of(annee, mois, 1).withDayOfMonth(
                        LocalDate.of(annee, mois, 1).lengthOfMonth());
                yield finMois.plusDays(delaiJours);
            }
            case TRIMESTRIEL -> {
                int q = Integer.parseInt(periode.substring(periode.length() - 1));
                LocalDate finTrimestre = LocalDate.of(annee, q * 3, 1).withDayOfMonth(
                        LocalDate.of(annee, q * 3, 1).lengthOfMonth());
                yield finTrimestre.plusDays(delaiJours);
            }
            case SEMESTRIEL -> {
                int s = Integer.parseInt(periode.substring(periode.length() - 1));
                LocalDate finSem = LocalDate.of(annee, s * 6, 1).withDayOfMonth(
                        LocalDate.of(annee, s * 6, 1).lengthOfMonth());
                yield finSem.plusDays(delaiJours);
            }
            case ANNUEL -> LocalDate.of(annee + 1, 1, 1).plusDays(delaiJours - 1);
        };
    }

    private DeclarationFiscale findOrThrow(UUID id, UUID eid) {
        return declRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Déclaration introuvable"));
    }

    private FiscalDto.ObligationRefResponse toRefResponse(RefObligationFiscale r) {
        return new FiscalDto.ObligationRefResponse(r.getId(), r.getCodePays(), r.getCodeImpot(),
                r.getLibelle(), r.getDescription(), r.getTaux(), r.getBaseCalcul(),
                r.getFrequence(), r.getDelaiJours(), r.getOrdre());
    }

    private FiscalDto.DeclarationResponse toResponse(DeclarationFiscale d) {
        return new FiscalDto.DeclarationResponse(d.getId(), d.getCodeImpot(), d.getLibelle(),
                d.getPeriode(), d.getDateEcheance(), d.getStatut(),
                d.getMontantBase(), d.getMontantImpot(), d.getReferencePaiement(),
                d.getNotes(), d.getCreatedAt());
    }
}
