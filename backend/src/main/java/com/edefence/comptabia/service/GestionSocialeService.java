package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.DeclarationSociale;
import com.edefence.comptabia.domain.RefCotisationSociale;
import com.edefence.comptabia.dto.social.SocialDto;
import com.edefence.comptabia.repository.DeclarationSocialeRepository;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.RefCotisationSocialeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GestionSocialeService {

    private final RefCotisationSocialeRepository refRepo;
    private final DeclarationSocialeRepository   declRepo;
    private final EntrepriseRepository           entrepriseRepo;

    // ── Référentiel ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SocialDto.CotisationRefResponse> refParPays(String codePays) {
        return refRepo.findByPays(codePays).stream().map(this::toRefResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SocialDto.OrganismeResume> organismesByPays(String codePays) {
        List<RefCotisationSociale> all = refRepo.findByPays(codePays);
        Map<String, SocialDto.OrganismeResume> map = new LinkedHashMap<>();
        for (RefCotisationSociale r : all) {
            map.merge(r.getCodeOrganisme(),
                    new SocialDto.OrganismeResume(r.getCodeOrganisme(), r.getLibelleOrganisme(),
                            r.getTauxSalarie(), r.getTauxPatronal(), r.getPlafondMensuel()),
                    (a, b) -> new SocialDto.OrganismeResume(a.codeOrganisme(), a.libelleOrganisme(),
                            a.tauxSalarieTotal().add(b.tauxSalarieTotal()),
                            a.tauxPatronalTotal().add(b.tauxPatronalTotal()),
                            a.plafondMensuel()));
        }
        return new ArrayList<>(map.values());
    }

    // ── Calcul ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SocialDto.CalculResult calculer(String codePays, SocialDto.CalculRequest req) {
        List<RefCotisationSociale> refs = refRepo.findByPaysAndOrganisme(codePays, req.codeOrganisme());
        if (refs.isEmpty()) throw new EntityNotFoundException("Organisme introuvable : " + req.codeOrganisme());

        BigDecimal masseBrute = req.masseSalariale();
        BigDecimal plafondMensuel = refs.get(0).getPlafondMensuel();
        boolean plafonneApplique = false;
        BigDecimal baseCalcul = masseBrute;

        if (plafondMensuel != null) {
            BigDecimal plafondTotal = plafondMensuel.multiply(BigDecimal.valueOf(req.nbEmployes()));
            if (masseBrute.compareTo(plafondTotal) > 0) {
                baseCalcul = plafondTotal;
                plafonneApplique = true;
            }
        }

        BigDecimal totalSalarie  = BigDecimal.ZERO;
        BigDecimal totalPatronal = BigDecimal.ZERO;
        for (RefCotisationSociale r : refs) {
            BigDecimal base = plafondMensuel != null ? baseCalcul : masseBrute;
            totalSalarie  = totalSalarie.add(base.multiply(r.getTauxSalarie()).setScale(0, RoundingMode.HALF_UP));
            totalPatronal = totalPatronal.add(base.multiply(r.getTauxPatronal()).setScale(0, RoundingMode.HALF_UP));
        }

        String libelle = refs.get(0).getLibelleOrganisme();
        return new SocialDto.CalculResult(req.codeOrganisme(), libelle,
                masseBrute, baseCalcul, totalSalarie, totalPatronal,
                totalSalarie.add(totalPatronal), plafonneApplique);
    }

    // ── Déclarations ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<SocialDto.DeclarationResponse> findAll(UUID eid) {
        return declRepo.findAllByEntreprise(eid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SocialDto.DeclarationResponse> findByAnnee(UUID eid, int annee) {
        return declRepo.findByAnnee(eid, String.valueOf(annee)).stream().map(this::toResponse).toList();
    }

    @Transactional
    public SocialDto.DeclarationResponse create(UUID eid, SocialDto.DeclarationSaveRequest req) {
        BigDecimal total = req.montantSalarie().add(req.montantPatronal());
        DeclarationSociale d = DeclarationSociale.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .codeOrganisme(req.codeOrganisme())
                .libelleOrganisme(req.libelleOrganisme())
                .periode(req.periode())
                .dateEcheance(req.dateEcheance())
                .nbEmployes(req.nbEmployes())
                .masseSalariale(req.masseSalariale())
                .montantSalarie(req.montantSalarie())
                .montantPatronal(req.montantPatronal())
                .montantTotal(total)
                .notes(req.notes())
                .build();
        return toResponse(declRepo.save(d));
    }

    @Transactional
    public SocialDto.DeclarationResponse update(UUID id, UUID eid, SocialDto.DeclarationUpdateRequest req) {
        DeclarationSociale d = findOrThrow(id, eid);
        if (req.statut() != null)            d.setStatut(req.statut());
        if (req.referencePaiement() != null) d.setReferencePaiement(req.referencePaiement());
        if (req.notes() != null)             d.setNotes(req.notes());
        return toResponse(declRepo.save(d));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        declRepo.delete(findOrThrow(id, eid));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private DeclarationSociale findOrThrow(UUID id, UUID eid) {
        return declRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Déclaration sociale introuvable"));
    }

    private SocialDto.CotisationRefResponse toRefResponse(RefCotisationSociale r) {
        return new SocialDto.CotisationRefResponse(r.getId(), r.getCodePays(), r.getCodeOrganisme(),
                r.getLibelleOrganisme(), r.getCodeCotisation(), r.getLibelleCotisation(),
                r.getSecteur(), r.getTauxSalarie(), r.getTauxPatronal(),
                r.getPlafondMensuel(), r.getFrequence(), r.getDelaiJours());
    }

    private SocialDto.DeclarationResponse toResponse(DeclarationSociale d) {
        return new SocialDto.DeclarationResponse(d.getId(), d.getCodeOrganisme(), d.getLibelleOrganisme(),
                d.getPeriode(), d.getDateEcheance(), d.getNbEmployes(), d.getMasseSalariale(),
                d.getMontantSalarie(), d.getMontantPatronal(), d.getMontantTotal(),
                d.getStatut(), d.getReferencePaiement(), d.getNotes(), d.getCreatedAt());
    }
}
