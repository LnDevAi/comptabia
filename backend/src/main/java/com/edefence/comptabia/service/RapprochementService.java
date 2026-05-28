package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.rapprochement.RapprochementDto;
import com.edefence.comptabia.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RapprochementService {

    private static final String SEP = ";";

    private final ReleveBancaireRepository  releveRepo;
    private final LigneEcritureRepository   ligneRepo;
    private final EntrepriseRepository      entrepriseRepo;
    private final CompteComptableRepository compteRepo;

    // ─── Comptes avec relevés ─────────────────────────────────────────────────

    public List<String> getComptes(UUID entrepriseId) {
        return releveRepo.findComptesWithReleve(entrepriseId);
    }

    // ─── État de rapprochement ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public RapprochementDto.EtatRapprochement getEtat(UUID entrepriseId, String compteNumero) {
        List<ReleveBancaire> releves = releveRepo
                .findByEntrepriseIdAndCompteNumeroOrderByDateReleveAsc(entrepriseId, compteNumero);

        // Accounting lines for this account (validated entries only)
        List<Object[]> ecritureRows = ligneRepo.balanceParCompte(entrepriseId,
                LocalDate.of(2000, 1, 1), LocalDate.of(2099, 12, 31));

        // Get all ligne_ecriture ids already matched
        Set<UUID> matchedLigneIds = releves.stream()
                .filter(r -> r.getLigneEcritureId() != null)
                .map(ReleveBancaire::getLigneEcritureId)
                .collect(Collectors.toSet());

        // Fetch all accounting lines for this compte
        List<RapprochementDto.LigneEcriture> lignesEcriture =
                ligneRepo.findLignesForCompte(entrepriseId, compteNumero).stream()
                        .map(row -> new RapprochementDto.LigneEcriture(
                                (UUID) row[0],
                                (LocalDate) row[1],
                                (String) row[2],
                                (String) row[3],
                                (BigDecimal) row[4],
                                (BigDecimal) row[5],
                                matchedLigneIds.contains(row[0])
                        )).toList();

        List<RapprochementDto.LigneReleve> lignesReleve = releves.stream()
                .map(r -> new RapprochementDto.LigneReleve(
                        r.getId(), r.getDateReleve(), r.getReference(),
                        r.getLibelle(), r.getMontant(), r.getSens().name(),
                        r.getStatut().name(), r.getLigneEcritureId()))
                .toList();

        BigDecimal soldeReleve    = releveRepo.soldeReleve(entrepriseId, compteNumero);
        BigDecimal soldeComptable = computeSoldeComptable(lignesEcriture);
        BigDecimal ecart          = soldeReleve.subtract(soldeComptable);

        long nonRapprochesReleve    = releves.stream().filter(r -> r.getStatut() == ReleveBancaire.Statut.NON_RAPPROCHE).count();
        long nonRapprochesEcriture  = lignesEcriture.stream().filter(l -> !l.rapprochee()).count();

        return new RapprochementDto.EtatRapprochement(
                compteNumero, soldeComptable, soldeReleve, ecart,
                nonRapprochesReleve, nonRapprochesEcriture,
                lignesReleve, lignesEcriture);
    }

    // ─── Import CSV ───────────────────────────────────────────────────────────

    @Transactional
    public RapprochementDto.ImportResult importerReleve(UUID entrepriseId, String compteNumero, byte[] csvBytes) {
        if (!compteRepo.existsByNumeroAndEntrepriseId(compteNumero, entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Compte " + compteNumero + " introuvable dans le plan de comptes.");
        }
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));

        int imported = 0, skipped = 0;

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(csvBytes), StandardCharsets.UTF_8))) {

            String line;
            int lineNum = 0;
            boolean headerSkipped = false;

            while ((line = reader.readLine()) != null) {
                lineNum++;
                if (lineNum == 1) line = line.replace("﻿", "").trim();
                else              line = line.trim();
                if (line.isBlank()) continue;
                if (!headerSkipped) { headerSkipped = true; continue; }

                String[] cols = line.split(SEP, -1);
                if (cols.length < 4) { skipped++; continue; }

                try {
                    LocalDate   date    = LocalDate.parse(cols[0].trim());
                    String      libelle = cols[1].trim();
                    BigDecimal  debit   = parseMontant(cols[2].trim());
                    BigDecimal  credit  = parseMontant(cols[3].trim());
                    String      ref     = cols.length > 4 ? cols[4].trim() : null;

                    // debit > 0 → sens DEBIT (sortie banque) ; credit > 0 → CREDIT (entrée)
                    BigDecimal montant;
                    ReleveBancaire.Sens sens;
                    if (credit.compareTo(BigDecimal.ZERO) > 0) {
                        montant = credit; sens = ReleveBancaire.Sens.CREDIT;
                    } else {
                        montant = debit;  sens = ReleveBancaire.Sens.DEBIT;
                    }
                    if (montant.compareTo(BigDecimal.ZERO) == 0) { skipped++; continue; }

                    releveRepo.save(ReleveBancaire.builder()
                            .entreprise(entreprise)
                            .compteNumero(compteNumero)
                            .dateReleve(date)
                            .libelle(libelle)
                            .montant(montant)
                            .sens(sens)
                            .reference(ref)
                            .build());
                    imported++;
                } catch (Exception e) {
                    skipped++;
                }
            }
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erreur lecture CSV : " + e.getMessage());
        }

        log.info("Import relevé compte={} imported={} skipped={}", compteNumero, imported, skipped);
        return new RapprochementDto.ImportResult(imported, skipped);
    }

    // ─── Rapprocher ───────────────────────────────────────────────────────────

    @Transactional
    public void rapprocher(UUID entrepriseId, UUID releveLigneId, UUID ecritureLigneId) {
        ReleveBancaire releve = findReleveOrThrow(releveLigneId, entrepriseId);
        if (releve.getStatut() == ReleveBancaire.Statut.RAPPROCHE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cette ligne est déjà rapprochée.");
        }
        releve.setStatut(ReleveBancaire.Statut.RAPPROCHE);
        releve.setLigneEcritureId(ecritureLigneId);
        releveRepo.save(releve);
    }

    @Transactional
    public void derapprocher(UUID entrepriseId, UUID releveLigneId) {
        ReleveBancaire releve = findReleveOrThrow(releveLigneId, entrepriseId);
        releve.setStatut(ReleveBancaire.Statut.NON_RAPPROCHE);
        releve.setLigneEcritureId(null);
        releveRepo.save(releve);
    }

    @Transactional
    public void supprimerReleve(UUID entrepriseId, UUID releveLigneId) {
        ReleveBancaire releve = findReleveOrThrow(releveLigneId, entrepriseId);
        releveRepo.delete(releve);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private ReleveBancaire findReleveOrThrow(UUID id, UUID entrepriseId) {
        return releveRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ligne relevé introuvable"));
    }

    private BigDecimal parseMontant(String s) {
        if (s == null || s.isBlank() || s.equals("0")) return BigDecimal.ZERO;
        return new BigDecimal(s.replace(",", ".").replace(" ", "").replace(" ", ""));
    }

    private BigDecimal computeSoldeComptable(List<RapprochementDto.LigneEcriture> lignes) {
        BigDecimal solde = BigDecimal.ZERO;
        for (var l : lignes) {
            solde = solde.add(l.credit()).subtract(l.debit());
        }
        return solde;
    }
}
