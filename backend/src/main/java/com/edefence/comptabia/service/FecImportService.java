package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.fec.FecImportDto;
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
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FecImportService {

    private static final String    SEP          = "\t";
    private static final int       MIN_COLS     = 13;
    private static final int       MAX_ECRITURES = 2000;
    private static final DateTimeFormatter FEC_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    // FEC column indices
    private static final int COL_JOURNAL_CODE  = 0;
    private static final int COL_ECRITURE_NUM  = 2;
    private static final int COL_ECRITURE_DATE = 3;
    private static final int COL_COMPTE_NUM    = 4;
    private static final int COL_COMPTE_LIB    = 5;
    private static final int COL_PIECE_REF     = 8;
    private static final int COL_ECRITURE_LIB  = 10;
    private static final int COL_DEBIT         = 11;
    private static final int COL_CREDIT        = 12;
    private static final int COL_LETTRE        = 13;

    private final EcritureComptableRepository ecritureRepo;
    private final CompteComptableRepository   compteRepo;
    private final EntrepriseRepository        entrepriseRepo;
    private final UtilisateurRepository       utilisateurRepo;

    @Transactional
    public FecImportDto.Result importer(UUID entrepriseId, String userEmail, byte[] fecBytes) {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable."));
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));

        // Parse all rows, auto-creating comptes as needed
        Map<String, CompteComptable> compteCache = new HashMap<>();
        int comptesCrees = 0;

        List<FecRow> rows = parseRows(fecBytes);

        // Pre-load existing comptes
        compteRepo.findByEntrepriseIdOrderByNumeroAsc(entrepriseId)
                .forEach(c -> compteCache.put(c.getNumero(), c));

        // Create missing comptes
        for (FecRow row : rows) {
            if (!compteCache.containsKey(row.compteNum())) {
                int classe = row.compteNum().isEmpty() ? 0 : Character.getNumericValue(row.compteNum().charAt(0));
                CompteComptable newCompte = compteRepo.save(CompteComptable.builder()
                        .numero(row.compteNum())
                        .intitule(row.compteLib().isBlank() ? "Compte " + row.compteNum() : row.compteLib())
                        .classe(classe)
                        .entreprise(entreprise)
                        .build());
                compteCache.put(row.compteNum(), newCompte);
                comptesCrees++;
            }
        }

        // Group by EcritureNum
        Map<String, List<FecRow>> groups = new LinkedHashMap<>();
        for (FecRow row : rows) {
            groups.computeIfAbsent(row.ecritureNum(), k -> new ArrayList<>()).add(row);
        }

        if (groups.size() > MAX_ECRITURES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Le fichier contient " + groups.size() + " écritures (max " + MAX_ECRITURES + ").");
        }

        int created = 0;
        int skipped = 0;
        List<FecImportDto.LineError> errors = new ArrayList<>();

        for (Map.Entry<String, List<FecRow>> entry : groups.entrySet()) {
            String ecritureNum = entry.getKey();
            List<FecRow> group = entry.getValue();
            int firstLine = group.get(0).lineNum();

            // Skip duplicates
            if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(ecritureNum, entrepriseId)) {
                skipped++;
                continue;
            }

            // Validate balance
            BigDecimal sumD = group.stream().map(FecRow::debit).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal sumC = group.stream().map(FecRow::credit).reduce(BigDecimal.ZERO, BigDecimal::add);
            if (sumD.compareTo(sumC) != 0) {
                errors.add(new FecImportDto.LineError(firstLine, ecritureNum,
                        "Déséquilibre : Débit=" + sumD + " Crédit=" + sumC));
                continue;
            }

            FecRow first = group.get(0);
            EcritureComptable.Journal journal = parseJournal(first.journalCode());

            EcritureComptable ecriture = EcritureComptable.builder()
                    .numeroPiece(ecritureNum)
                    .dateEcriture(first.ecritureDate())
                    .libelle(first.ecritureLib().isBlank() ? first.pieceRef() : first.ecritureLib())
                    .journal(journal)
                    .statut(EcritureComptable.Statut.VALIDEE)
                    .entreprise(entreprise)
                    .createdBy(auteur)
                    .build();

            for (FecRow row : group) {
                CompteComptable compte = compteCache.get(row.compteNum());
                LigneEcriture ligne = LigneEcriture.builder()
                        .ecriture(ecriture)
                        .compte(compte)
                        .libelle(row.ecritureLib().isBlank() ? row.pieceRef() : row.ecritureLib())
                        .debit(row.debit())
                        .credit(row.credit())
                        .build();
                // Preserve lettering if present
                if (row.lettre() != null && !row.lettre().isBlank()) {
                    ligne.setLettre(row.lettre());
                    ligne.setLettreDate(LocalDate.now());
                }
                ecriture.getLignes().add(ligne);
            }

            ecritureRepo.save(ecriture);
            created++;
        }

        log.info("FEC import entreprise={} : created={} skipped={} comptesCrees={} errors={}",
                entrepriseId, created, skipped, comptesCrees, errors.size());
        return new FecImportDto.Result(created, skipped, comptesCrees, errors);
    }

    // ─── Parsing ──────────────────────────────────────────────────────────────

    private List<FecRow> parseRows(byte[] bytes) {
        List<FecRow> rows = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {

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
                if (cols.length < MIN_COLS) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Ligne " + lineNum + " : " + cols.length + " colonnes (min " + MIN_COLS + " attendues).");
                }

                try {
                    rows.add(new FecRow(
                            lineNum,
                            col(cols, COL_JOURNAL_CODE),
                            col(cols, COL_ECRITURE_NUM),
                            parseDate(col(cols, COL_ECRITURE_DATE)),
                            col(cols, COL_COMPTE_NUM),
                            col(cols, COL_COMPTE_LIB),
                            col(cols, COL_PIECE_REF),
                            col(cols, COL_ECRITURE_LIB),
                            parseMontant(col(cols, COL_DEBIT)),
                            parseMontant(col(cols, COL_CREDIT)),
                            cols.length > COL_LETTRE ? col(cols, COL_LETTRE) : ""
                    ));
                } catch (ResponseStatusException e) {
                    throw e;
                } catch (Exception e) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Ligne " + lineNum + " : format invalide — " + e.getMessage());
                }
            }
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erreur de lecture : " + e.getMessage());
        }
        return rows;
    }

    private String col(String[] cols, int idx) {
        return idx < cols.length ? cols[idx].trim() : "";
    }

    private LocalDate parseDate(String s) {
        if (s.isBlank()) throw new IllegalArgumentException("Date vide");
        return LocalDate.parse(s, FEC_DATE);
    }

    private BigDecimal parseMontant(String s) {
        if (s.isBlank() || s.equals("0") || s.equals("0,00") || s.equals("0.00"))
            return BigDecimal.ZERO;
        return new BigDecimal(s.replace(",", ".").replace(" ", "").replace(" ", ""));
    }

    private EcritureComptable.Journal parseJournal(String code) {
        return switch (code.toUpperCase()) {
            case "BQ", "BNQ", "BAN", "CB"       -> EcritureComptable.Journal.BQ;
            case "VT", "VTE", "VEN", "FA", "FAC" -> EcritureComptable.Journal.VT;
            case "AC", "ACH", "FOU"               -> EcritureComptable.Journal.AC;
            default                               -> EcritureComptable.Journal.OD;
        };
    }

    // ─── Internal row ─────────────────────────────────────────────────────────

    private record FecRow(
            int lineNum,
            String journalCode,
            String ecritureNum,
            LocalDate ecritureDate,
            String compteNum,
            String compteLib,
            String pieceRef,
            String ecritureLib,
            BigDecimal debit,
            BigDecimal credit,
            String lettre
    ) {}
}
