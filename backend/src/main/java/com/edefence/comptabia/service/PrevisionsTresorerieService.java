package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.Facture;
import com.edefence.comptabia.domain.FluxTresoreriePrevision;
import com.edefence.comptabia.dto.previsions.PrevisionsTresorerieDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.FactureRepository;
import com.edefence.comptabia.repository.FluxTresoreriePrevisionRepository;
import com.edefence.comptabia.repository.LigneEcritureRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PrevisionsTresorerieService {

    private final LigneEcritureRepository          ligneRepo;
    private final FactureRepository                factureRepo;
    private final FluxTresoreriePrevisionRepository fluxRepo;
    private final EntrepriseRepository             entrepriseRepo;

    private static final DateTimeFormatter FMT_SEMAINE = DateTimeFormatter.ofPattern("dd/MM");

    // ─── Projection ──────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PrevisionsTresorerieDto.Response getProjection(UUID eid, int semaines, BigDecimal seuilAlerte) {
        LocalDate today   = LocalDate.now();
        LocalDate horizon = today.plusWeeks(semaines);

        BigDecimal soldeCourant = computeSoldeCourant(eid, today);

        List<Facture> facturesEmises = factureRepo.findAllEmises(eid);
        BigDecimal totalCreances = facturesEmises.stream()
                .map(Facture::getMontantTtc)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<FluxTresoreriePrevision> fluxManuels = fluxRepo.findByPeriode(eid, today, horizon);

        List<PrevisionsTresorerieDto.FluxItem> fluxDetails = new ArrayList<>();

        for (Facture f : facturesEmises) {
            LocalDate datePrevu = f.getDateEcheance() != null
                    ? f.getDateEcheance()
                    : f.getDateFacture().plusDays(30);
            if (!datePrevu.isAfter(horizon)) {
                String lib = "Facture " + f.getNumero()
                        + (f.getNomTiers() != null ? " – " + f.getNomTiers() : "");
                fluxDetails.add(new PrevisionsTresorerieDto.FluxItem(
                        f.getId(), datePrevu, "ENCAISSEMENT", lib, f.getMontantTtc(), "FACTURE", null));
            }
        }

        for (FluxTresoreriePrevision fx : fluxManuels) {
            fluxDetails.add(new PrevisionsTresorerieDto.FluxItem(
                    fx.getId(), fx.getDateFlux(), fx.getTypeFlux().name(),
                    fx.getLibelle(), fx.getMontant(), "MANUEL", fx.getCategorie()));
        }

        fluxDetails.sort(Comparator.comparing(PrevisionsTresorerieDto.FluxItem::date));

        List<PrevisionsTresorerieDto.SemaineProjection> projections = new ArrayList<>();
        BigDecimal soldeRunning = soldeCourant;

        for (int i = 0; i < semaines; i++) {
            LocalDate debut = today.plusWeeks(i);
            LocalDate fin   = debut.plusDays(6);

            BigDecimal entrees = BigDecimal.ZERO;
            BigDecimal sorties = BigDecimal.ZERO;

            for (PrevisionsTresorerieDto.FluxItem item : fluxDetails) {
                if (!item.date().isBefore(debut) && !item.date().isAfter(fin)) {
                    if ("ENCAISSEMENT".equals(item.type())) {
                        entrees = entrees.add(item.montant());
                    } else {
                        sorties = sorties.add(item.montant());
                    }
                }
            }

            soldeRunning = soldeRunning.add(entrees).subtract(sorties);
            String label = "S" + (i + 1) + " (" + debut.format(FMT_SEMAINE) + ")";

            projections.add(new PrevisionsTresorerieDto.SemaineProjection(
                    debut, fin, label, entrees, sorties, soldeRunning,
                    soldeRunning.compareTo(seuilAlerte) < 0));
        }

        return new PrevisionsTresorerieDto.Response(
                today, soldeCourant, totalCreances, projections, fluxDetails, seuilAlerte);
    }

    private BigDecimal computeSoldeCourant(UUID eid, LocalDate today) {
        List<Object[]> balance = ligneRepo.balanceParCompte(eid, LocalDate.of(1900, 1, 1), today);
        BigDecimal solde = BigDecimal.ZERO;
        for (Object[] row : balance) {
            String numero = (String) row[0];
            if (numero.startsWith("51") || numero.startsWith("52") || numero.startsWith("53")) {
                BigDecimal debit  = (BigDecimal) row[3];
                BigDecimal credit = (BigDecimal) row[4];
                solde = solde.add(debit).subtract(credit);
            }
        }
        return solde;
    }

    // ─── Flux manuels CRUD ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PrevisionsTresorerieDto.FluxResponse> listFlux(UUID eid) {
        return fluxRepo.findAllActifs(eid).stream().map(this::toFluxResponse).toList();
    }

    @Transactional
    public PrevisionsTresorerieDto.FluxResponse saveFlux(UUID eid, PrevisionsTresorerieDto.FluxRequest req) {
        Entreprise entreprise = entrepriseRepo.getReferenceById(eid);
        FluxTresoreriePrevision flux = FluxTresoreriePrevision.builder()
                .entreprise(entreprise)
                .dateFlux(req.dateFlux())
                .typeFlux(FluxTresoreriePrevision.TypeFlux.valueOf(req.typeFlux()))
                .libelle(req.libelle())
                .montant(req.montant())
                .recurrent(req.recurrent())
                .periodicite(req.periodicite())
                .categorie(req.categorie())
                .build();
        return toFluxResponse(fluxRepo.save(flux));
    }

    @Transactional
    public void deleteFlux(UUID eid, UUID fluxId) {
        FluxTresoreriePrevision flux = fluxRepo.findById(fluxId)
                .filter(f -> f.getEntreprise().getId().equals(eid))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flux introuvable"));
        flux.setActif(false);
        fluxRepo.save(flux);
    }

    private PrevisionsTresorerieDto.FluxResponse toFluxResponse(FluxTresoreriePrevision f) {
        return new PrevisionsTresorerieDto.FluxResponse(
                f.getId(), f.getDateFlux(), f.getTypeFlux().name(),
                f.getLibelle(), f.getMontant(), f.isRecurrent(),
                f.getPeriodicite(), f.getCategorie(), f.isActif());
    }
}
