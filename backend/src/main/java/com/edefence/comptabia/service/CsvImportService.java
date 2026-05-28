package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.ecriture.CsvImportDto;
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

@Service
@RequiredArgsConstructor
@Slf4j
public class CsvImportService {

    private static final String SEP          = ";";
    private static final int    MAX_LINES    = 500;
    private static final int    EXPECTED_COLS = 8;

    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository   compteRepo;
    private final EntrepriseRepository        entrepriseRepo;
    private final UtilisateurRepository       utilisateurRepo;

    // ─── Public entry point ───────────────────────────────────────────────────

    @Transactional
    public CsvImportDto.Result importer(UUID entrepriseId, String userEmail, byte[] csvBytes) {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable"));

        List<CsvRow> rows = parse(csvBytes);
        // Group rows by numeroPiece (preserving insertion order)
        Map<String, List<CsvRow>> groups = new LinkedHashMap<>();
        for (CsvRow row : rows) {
            groups.computeIfAbsent(row.numeroPiece(), k -> new ArrayList<>()).add(row);
        }

        int created = 0;
        int skipped = 0;
        List<CsvImportDto.LineError> errors = new ArrayList<>();

        for (Map.Entry<String, List<CsvRow>> entry : groups.entrySet()) {
            String piece = entry.getKey();
            List<CsvRow> group = entry.getValue();
            int firstLine = group.get(0).lineNum();

            // Skip if piece already exists
            if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(piece, entrepriseId)) {
                skipped++;
                continue;
            }

            // Validate
            Optional<String> validationError = validate(group, entrepriseId);
            if (validationError.isPresent()) {
                errors.add(new CsvImportDto.LineError(firstLine, piece, validationError.get()));
                continue;
            }

            // Build and save ecriture
            CsvRow first = group.get(0);
            EcritureComptable ecriture = EcritureComptable.builder()
                    .numeroPiece(piece)
                    .dateEcriture(first.date())
                    .libelle(first.libelle())
                    .journal(first.journal())
                    .statut(EcritureComptable.Statut.BROUILLON)
                    .entreprise(entreprise)
                    .createdBy(auteur)
                    .build();

            for (CsvRow row : group) {
                compteRepo.findByNumeroAndEntrepriseId(row.compteNumero(), entrepriseId)
                        .ifPresent(cc -> ecriture.getLignes().add(
                                LigneEcriture.builder()
                                        .ecriture(ecriture)
                                        .compte(cc)
                                        .libelle(row.libelleLigne())
                                        .debit(row.debit())
                                        .credit(row.credit())
                                        .build()));
            }

            ecritureRepo.save(ecriture);
            created++;
        }

        log.info("CSV import entreprise={} : created={} skipped={} errors={}", entrepriseId, created, skipped, errors.size());
        return new CsvImportDto.Result(created, skipped, errors);
    }

    // ─── Parsing ──────────────────────────────────────────────────────────────

    private List<CsvRow> parse(byte[] csvBytes) {
        List<CsvRow> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(csvBytes), StandardCharsets.UTF_8))) {

            String line;
            int lineNum = 0;
            boolean headerSkipped = false;

            while ((line = reader.readLine()) != null) {
                lineNum++;
                // Strip BOM if present
                if (lineNum == 1) line = line.replace("﻿", "").trim();
                else              line = line.trim();

                if (line.isBlank()) continue;
                if (!headerSkipped) { headerSkipped = true; continue; } // skip header

                if (rows.size() >= MAX_LINES)
                    throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                            "Le fichier dépasse " + MAX_LINES + " lignes de données.");

                String[] cols = line.split(SEP, -1);
                if (cols.length < EXPECTED_COLS) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Ligne " + lineNum + " : " + cols.length + " colonnes trouvées, " + EXPECTED_COLS + " attendues.");
                }

                try {
                    rows.add(new CsvRow(
                            lineNum,
                            LocalDate.parse(cols[0].trim()),
                            cols[1].trim(),
                            cols[2].trim(),
                            EcritureComptable.Journal.valueOf(cols[3].trim().toUpperCase()),
                            cols[4].trim(),
                            cols[5].trim(),
                            parseMontant(cols[6].trim()),
                            parseMontant(cols[7].trim())
                    ));
                } catch (Exception e) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Ligne " + lineNum + " : format invalide — " + e.getMessage());
                }
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erreur de lecture du fichier CSV : " + e.getMessage());
        }
        return rows;
    }

    private BigDecimal parseMontant(String s) {
        if (s.isBlank() || s.equals("0")) return BigDecimal.ZERO;
        return new BigDecimal(s.replace(",", ".").replace(" ", ""));
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    private Optional<String> validate(List<CsvRow> group, UUID entrepriseId) {
        BigDecimal sumDebit  = BigDecimal.ZERO;
        BigDecimal sumCredit = BigDecimal.ZERO;
        for (CsvRow row : group) {
            if (compteRepo.findByNumeroAndEntrepriseId(row.compteNumero(), entrepriseId).isEmpty()) {
                return Optional.of("Compte " + row.compteNumero() + " introuvable dans le plan de comptes.");
            }
            sumDebit  = sumDebit.add(row.debit());
            sumCredit = sumCredit.add(row.credit());
        }
        if (sumDebit.compareTo(sumCredit) != 0)
            return Optional.of("Déséquilibre : Débit=" + sumDebit + " Crédit=" + sumCredit);
        return Optional.empty();
    }

    // ─── Internal row ─────────────────────────────────────────────────────────

    private record CsvRow(
            int lineNum,
            LocalDate date,
            String numeroPiece,
            String libelle,
            EcritureComptable.Journal journal,
            String compteNumero,
            String libelleLigne,
            BigDecimal debit,
            BigDecimal credit
    ) {}
}
