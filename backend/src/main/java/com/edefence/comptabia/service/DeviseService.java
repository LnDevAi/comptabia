package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.LigneEcriture;
import com.edefence.comptabia.domain.TauxChange;
import com.edefence.comptabia.dto.devise.DeviseDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.LigneEcritureRepository;
import com.edefence.comptabia.repository.TauxChangeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DeviseService {

    private static final String XOF = "XOF";

    private final TauxChangeRepository    tauxRepo;
    private final LigneEcritureRepository ligneRepo;
    private final EntrepriseRepository    entrepriseRepo;

    // ─── Taux de change ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DeviseDto.TauxResponse> listTaux(UUID eid) {
        return tauxRepo.findAllByEntreprise(eid).stream()
                .map(this::toTauxResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DeviseDto.TauxLatest> tauxLatest(UUID eid) {
        LocalDate today = LocalDate.now();
        return tauxRepo.findDevisesActives(eid).stream()
                .map(d -> tauxRepo.findLatest(eid, d, today)
                        .map(t -> new DeviseDto.TauxLatest(t.getDevise(), t.getTaux(), t.getDateTaux()))
                        .orElse(null))
                .filter(t -> t != null)
                .toList();
    }

    @Transactional
    public DeviseDto.TauxResponse upsertTaux(UUID eid, DeviseDto.TauxRequest req) {
        String devise = req.devise().toUpperCase().trim();
        TauxChange taux = tauxRepo
                .findByEntrepriseIdAndDeviseAndDateTaux(eid, devise, req.dateTaux())
                .orElseGet(() -> TauxChange.builder()
                        .entreprise(entrepriseRepo.getReferenceById(eid))
                        .devise(devise)
                        .dateTaux(req.dateTaux())
                        .build());
        taux.setTaux(req.taux());
        return toTauxResponse(tauxRepo.save(taux));
    }

    @Transactional
    public void deleteTaux(UUID id, UUID eid) {
        TauxChange t = tauxRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Taux introuvable"));
        if (!t.getEntreprise().getId().equals(eid)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
        tauxRepo.delete(t);
    }

    // ─── Soldes par devise ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DeviseDto.SoldeDevise> soldesParDevise(UUID eid) {
        LocalDate today = LocalDate.now();
        List<LigneEcriture> lignes = ligneRepo.findWithDevise(eid);

        Map<String, List<LigneEcriture>> parDevise = lignes.stream()
                .filter(l -> l.getDevise() != null && !l.getDevise().isBlank())
                .collect(Collectors.groupingBy(LigneEcriture::getDevise));

        return parDevise.entrySet().stream().map(entry -> {
            String devise = entry.getKey();
            List<LigneEcriture> ls = entry.getValue();

            BigDecimal debitDevise = ls.stream()
                    .filter(l -> l.getDebit().compareTo(BigDecimal.ZERO) > 0
                              && l.getMontantDevise() != null)
                    .map(LigneEcriture::getMontantDevise)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal creditDevise = ls.stream()
                    .filter(l -> l.getCredit().compareTo(BigDecimal.ZERO) > 0
                              && l.getMontantDevise() != null)
                    .map(LigneEcriture::getMontantDevise)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal soldeDevise = debitDevise.subtract(creditDevise);

            BigDecimal tauxActuel = tauxRepo.findLatest(eid, devise, today)
                    .map(TauxChange::getTaux)
                    .orElse(BigDecimal.ONE);

            BigDecimal soldeXof = soldeDevise.multiply(tauxActuel)
                    .setScale(2, RoundingMode.HALF_UP);

            return new DeviseDto.SoldeDevise(devise, debitDevise, creditDevise,
                    soldeDevise, tauxActuel, soldeXof);
        }).toList();
    }

    // ─── Conversion ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DeviseDto.ConversionResponse convertir(UUID eid, DeviseDto.ConversionRequest req) {
        if (req.deviseSource().equalsIgnoreCase(XOF)) {
            BigDecimal taux = findTaux(eid, req.deviseCible(), req.date());
            BigDecimal montantCible = req.montant().divide(taux, 6, RoundingMode.HALF_UP)
                    .setScale(2, RoundingMode.HALF_UP);
            return new DeviseDto.ConversionResponse(req.montant(), XOF,
                    montantCible, req.deviseCible(), taux, req.date());
        }

        BigDecimal tauxSource = findTaux(eid, req.deviseSource(), req.date());
        BigDecimal montantXof = req.montant().multiply(tauxSource).setScale(2, RoundingMode.HALF_UP);

        if (req.deviseCible().equalsIgnoreCase(XOF)) {
            return new DeviseDto.ConversionResponse(req.montant(), req.deviseSource(),
                    montantXof, XOF, tauxSource, req.date());
        }

        BigDecimal tauxCible = findTaux(eid, req.deviseCible(), req.date());
        BigDecimal montantCible = montantXof.divide(tauxCible, 6, RoundingMode.HALF_UP)
                .setScale(2, RoundingMode.HALF_UP);
        return new DeviseDto.ConversionResponse(req.montant(), req.deviseSource(),
                montantCible, req.deviseCible(), tauxSource, req.date());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private BigDecimal findTaux(UUID eid, String devise, LocalDate date) {
        return tauxRepo.findLatest(eid, devise, date)
                .map(TauxChange::getTaux)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Taux introuvable pour " + devise + " au " + date));
    }

    private DeviseDto.TauxResponse toTauxResponse(TauxChange t) {
        return new DeviseDto.TauxResponse(t.getId(), t.getDevise(),
                t.getDateTaux(), t.getTaux(), t.getCreatedAt());
    }
}
