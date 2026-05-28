package com.edefence.comptabia.service.migration;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.migration.ImportHistoriqueDto;
import com.edefence.comptabia.dto.migration.ImportResultDto;
import com.edefence.comptabia.dto.migration.ImportResultDto.LigneErreur;
import com.edefence.comptabia.dto.migration.PreviewDto;
import com.edefence.comptabia.dto.migration.PreviewDto.ColonneMapping;
import com.edefence.comptabia.repository.*;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.Charset;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MigrationService {

    // ── Champs cibles normalisés ──────────────────────────────────────────────
    public static final String F_JOURNAL    = "journal";
    public static final String F_DATE       = "date";
    public static final String F_PIECE      = "piece";
    public static final String F_COMPTE     = "compte";
    public static final String F_LIBELLE    = "libelle";
    public static final String F_DEBIT      = "debit";
    public static final String F_CREDIT     = "credit";
    public static final String F_CODE       = "code";
    public static final String F_NOM        = "nom";
    public static final String F_EMAIL      = "email";
    public static final String F_TELEPHONE  = "telephone";
    public static final String F_ADRESSE    = "adresse";
    public static final String F_TYPE_TIERS = "typeTiers";
    public static final String F_SOLDE_D    = "soldeDebit";
    public static final String F_SOLDE_C    = "soldeCredit";

    private static final int PREVIEW_ROWS   = 20;
    private static final int MAX_ROWS       = 50000;

    // ── Mappings pré-configurés par logiciel ──────────────────────────────────
    private static final Map<String, Map<String, String>> MAPPINGS_LOGICIEL = Map.of(
        "SAGE", Map.of(
            "Code journal", F_JOURNAL, "Journal", F_JOURNAL,
            "Date",         F_DATE,
            "N° pièce",     F_PIECE,    "No pièce",   F_PIECE,
            "Compte",       F_COMPTE,
            "Libellé",      F_LIBELLE,  "Intitulé",   F_LIBELLE,
            "Débit",        F_DEBIT,
            "Crédit",       F_CREDIT
        ),
        "EBP", Map.of(
            "Journal",      F_JOURNAL,
            "Date",         F_DATE,
            "Pièce",        F_PIECE,
            "Compte",       F_COMPTE,
            "Intitulé",     F_LIBELLE,
            "Débit",        F_DEBIT,
            "Crédit",       F_CREDIT
        ),
        "WAVESOFT", Map.of(
            "Journal",          F_JOURNAL,
            "No Pièce",         F_PIECE,    "N° Pièce",     F_PIECE,
            "Date",             F_DATE,
            "Compte",           F_COMPTE,
            "Libellé Écriture", F_LIBELLE,  "Libelle",      F_LIBELLE,
            "Débit",            F_DEBIT,
            "Crédit",           F_CREDIT
        )
    );

    private final EntrepriseRepository       entrepriseRepo;
    private final UtilisateurRepository      utilisateurRepo;
    private final CompteComptableRepository  compteRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final TiersRepository            tiersRepo;
    private final ImportHistoriqueRepository historiqueRepo;
    private final ObjectMapper               objectMapper;

    // ── Preview ───────────────────────────────────────────────────────────────

    public PreviewDto preview(byte[] bytes, String nomFichier, String format) {
        boolean isExcel = nomFichier != null && (nomFichier.endsWith(".xlsx") || nomFichier.endsWith(".xls"));
        if (isExcel) return previewExcel(bytes, format);
        return previewCsv(bytes, format);
    }

    private PreviewDto previewCsv(byte[] bytes, String format) {
        String sep = detectSeparator(bytes);
        Charset cs = detectCharset(bytes);
        List<List<String>> allRows = parseCsvRows(bytes, sep, cs);
        if (allRows.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier vide.");

        List<String> headers = allRows.get(0);
        List<List<String>> data = allRows.subList(1, Math.min(allRows.size(), PREVIEW_ROWS + 1));
        int total = allRows.size() - 1;

        return new PreviewDto(headers, data, total, sep, buildMappingSuggere(headers, format));
    }

    private PreviewDto previewExcel(byte[] bytes, String format) {
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            if (sheet == null || sheet.getLastRowNum() < 0)
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Feuille Excel vide.");

            Row headerRow = sheet.getRow(0);
            List<String> headers = new ArrayList<>();
            for (Cell c : headerRow) headers.add(cellStr(c));

            List<List<String>> data = new ArrayList<>();
            int last = Math.min(sheet.getLastRowNum(), PREVIEW_ROWS);
            for (int i = 1; i <= last; i++) {
                Row r = sheet.getRow(i);
                if (r == null) continue;
                List<String> row = new ArrayList<>();
                for (int j = 0; j < headers.size(); j++) {
                    Cell c = r.getCell(j, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    row.add(c == null ? "" : cellStr(c));
                }
                data.add(row);
            }
            int total = sheet.getLastRowNum();
            return new PreviewDto(headers, data, total, "excel", buildMappingSuggere(headers, format));
        } catch (ResponseStatusException e) {
            throw e;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erreur lecture Excel : " + e.getMessage());
        }
    }

    // ── Import ────────────────────────────────────────────────────────────────

    @Transactional
    public ImportResultDto importer(UUID entrepriseId, String userEmail, byte[] bytes,
                                    String nomFichier, String format, String typeDonnees,
                                    Map<String, String> mapping) {

        Entreprise ent  = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable."));
        Utilisateur usr = utilisateurRepo.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Utilisateur introuvable."));

        // Résoudre le mapping : si non fourni, utiliser le mapping pré-configuré du logiciel
        Map<String, String> resolvedMapping = mapping != null && !mapping.isEmpty()
                ? mapping
                : resolveMapping(bytes, nomFichier, format);

        ImportResultDto result = switch (typeDonnees.toUpperCase()) {
            case "ECRITURES"      -> importerEcritures(ent, usr, bytes, nomFichier, format, resolvedMapping);
            case "TIERS"          -> importerTiers(ent, usr, bytes, nomFichier, format, resolvedMapping);
            case "PLAN_COMPTABLE" -> importerPlanComptable(ent, bytes, nomFichier, format, resolvedMapping);
            case "SOLDES"         -> importerSoldes(ent, usr, bytes, nomFichier, resolvedMapping);
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Type de données inconnu : " + typeDonnees);
        };

        sauvegarderHistorique(ent, usr, format, typeDonnees, nomFichier, result);
        return result;
    }

    // ── Import Écritures ──────────────────────────────────────────────────────

    private ImportResultDto importerEcritures(Entreprise ent, Utilisateur usr,
                                               byte[] bytes, String nomFichier,
                                               String format, Map<String, String> mapping) {
        List<Map<String, String>> rows = parseRows(bytes, nomFichier, mapping);
        if (rows.size() > MAX_ROWS)
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Fichier trop grand (" + rows.size() + " lignes, max " + MAX_ROWS + ").");

        Map<String, CompteComptable> compteCache = new HashMap<>();
        compteRepo.findByEntrepriseIdOrderByNumeroAsc(ent.getId())
                .forEach(c -> compteCache.put(c.getNumero(), c));

        Map<String, List<Map<String, String>>> groups = new LinkedHashMap<>();
        for (Map<String, String> row : rows) {
            String key = row.getOrDefault(F_PIECE, "") + "_" + row.getOrDefault(F_DATE, "");
            if (key.equals("_")) key = UUID.randomUUID().toString();
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(row);
        }

        int created = 0, skipped = 0, erreurs = 0;
        List<LigneErreur> lignesErreurs = new ArrayList<>();
        int lineNum = 1;

        for (Map.Entry<String, List<Map<String, String>>> entry : groups.entrySet()) {
            List<Map<String, String>> group = entry.getValue();
            String numeroPiece = group.get(0).getOrDefault(F_PIECE, entry.getKey());

            if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(numeroPiece, ent.getId())) {
                skipped++;
                lineNum += group.size();
                continue;
            }

            BigDecimal sumD = BigDecimal.ZERO, sumC = BigDecimal.ZERO;
            for (Map<String, String> r : group) {
                sumD = sumD.add(parseMontant(r.getOrDefault(F_DEBIT, "0")));
                sumC = sumC.add(parseMontant(r.getOrDefault(F_CREDIT, "0")));
            }

            if (sumD.compareTo(sumC) != 0) {
                lignesErreurs.add(new LigneErreur(lineNum, numeroPiece,
                        "Déséquilibre D=" + sumD + " C=" + sumC));
                erreurs++;
                lineNum += group.size();
                continue;
            }

            Map<String, String> first = group.get(0);
            LocalDate date;
            try {
                date = parseDate(first.getOrDefault(F_DATE, ""));
            } catch (Exception e) {
                lignesErreurs.add(new LigneErreur(lineNum, numeroPiece, "Date invalide : " + first.get(F_DATE)));
                erreurs++;
                lineNum += group.size();
                continue;
            }

            EcritureComptable ecriture = EcritureComptable.builder()
                    .numeroPiece(numeroPiece)
                    .dateEcriture(date)
                    .libelle(first.getOrDefault(F_LIBELLE, numeroPiece))
                    .journal(parseJournal(first.getOrDefault(F_JOURNAL, "OD")))
                    .statut(EcritureComptable.Statut.VALIDEE)
                    .entreprise(ent)
                    .createdBy(usr)
                    .build();

            for (Map<String, String> r : group) {
                String compteNum = r.getOrDefault(F_COMPTE, "");
                compteCache.computeIfAbsent(compteNum, num -> {
                    int classe = num.isEmpty() ? 0 : Character.getNumericValue(num.charAt(0));
                    return compteRepo.save(CompteComptable.builder()
                            .numero(num).intitule("Compte " + num)
                            .classe(classe).entreprise(ent).build());
                });

                ecriture.getLignes().add(LigneEcriture.builder()
                        .ecriture(ecriture)
                        .compte(compteCache.get(compteNum))
                        .libelle(r.getOrDefault(F_LIBELLE, numeroPiece))
                        .debit(parseMontant(r.getOrDefault(F_DEBIT, "0")))
                        .credit(parseMontant(r.getOrDefault(F_CREDIT, "0")))
                        .build());
            }

            ecritureRepo.save(ecriture);
            created++;
            lineNum += group.size();
        }

        return new ImportResultDto(created, skipped, erreurs, lignesErreurs, null);
    }

    // ── Import Tiers ──────────────────────────────────────────────────────────

    private ImportResultDto importerTiers(Entreprise ent, Utilisateur usr,
                                          byte[] bytes, String nomFichier,
                                          String format, Map<String, String> mapping) {
        List<Map<String, String>> rows = parseRows(bytes, nomFichier, mapping);
        int created = 0, skipped = 0, erreurs = 0;
        List<LigneErreur> lignesErreurs = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> r = rows.get(i);
            String code = r.getOrDefault(F_CODE, "").trim();
            String nom  = r.getOrDefault(F_NOM, "").trim();
            if (nom.isEmpty()) { erreurs++; lignesErreurs.add(new LigneErreur(i+2, code, "Nom vide")); continue; }

            if (code.isEmpty()) code = "IMP-" + (i + 1);

            String finalCode = code;
            if (tiersRepo.existsByCodeAndEntrepriseId(code, ent.getId())) { skipped++; continue; }

            Tiers.TypeTiers type = switch (r.getOrDefault(F_TYPE_TIERS, "").toUpperCase()) {
                case "FOURNISSEUR", "SUPPLIER" -> Tiers.TypeTiers.FOURNISSEUR;
                default                        -> Tiers.TypeTiers.CLIENT;
            };

            tiersRepo.save(Tiers.builder()
                    .code(finalCode).nom(nom)
                    .email(r.getOrDefault(F_EMAIL, null))
                    .telephone(r.getOrDefault(F_TELEPHONE, null))
                    .adresse(r.getOrDefault(F_ADRESSE, null))
                    .type(type)
                    .entreprise(ent)
                    .build());
            created++;
        }

        return new ImportResultDto(created, skipped, erreurs, lignesErreurs, null);
    }

    // ── Import Plan Comptable ─────────────────────────────────────────────────

    private ImportResultDto importerPlanComptable(Entreprise ent, byte[] bytes,
                                                   String nomFichier, String format,
                                                   Map<String, String> mapping) {
        List<Map<String, String>> rows = parseRows(bytes, nomFichier, mapping);
        Map<String, CompteComptable> cache = new HashMap<>();
        compteRepo.findByEntrepriseIdOrderByNumeroAsc(ent.getId())
                .forEach(c -> cache.put(c.getNumero(), c));

        int created = 0, skipped = 0, erreurs = 0;
        List<LigneErreur> lignesErreurs = new ArrayList<>();

        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> r = rows.get(i);
            String numero  = r.getOrDefault(F_COMPTE, r.getOrDefault(F_CODE, "")).trim();
            String libelle = r.getOrDefault(F_LIBELLE, r.getOrDefault(F_NOM, "")).trim();
            if (numero.isEmpty() || libelle.isEmpty()) {
                erreurs++;
                lignesErreurs.add(new LigneErreur(i+2, numero, "Numéro ou libellé vide"));
                continue;
            }
            if (cache.containsKey(numero)) { skipped++; continue; }

            int classe = Character.getNumericValue(numero.charAt(0));
            CompteComptable c = compteRepo.save(CompteComptable.builder()
                    .numero(numero).intitule(libelle).classe(classe).entreprise(ent).build());
            cache.put(numero, c);
            created++;
        }

        return new ImportResultDto(created, skipped, erreurs, lignesErreurs, null);
    }

    // ── Import Soldes d'ouverture ─────────────────────────────────────────────

    private ImportResultDto importerSoldes(Entreprise ent, Utilisateur usr,
                                           byte[] bytes, String nomFichier,
                                           Map<String, String> mapping) {
        List<Map<String, String>> rows = parseRows(bytes, nomFichier, mapping);
        Map<String, CompteComptable> cache = new HashMap<>();
        compteRepo.findByEntrepriseIdOrderByNumeroAsc(ent.getId())
                .forEach(c -> cache.put(c.getNumero(), c));

        int created = 0, skipped = 0, erreurs = 0;
        List<LigneErreur> lignesErreurs = new ArrayList<>();
        String pieceSolde = "AN-" + LocalDate.now().getYear();
        LocalDate dateAn = LocalDate.of(LocalDate.now().getYear(), 1, 1);

        for (int i = 0; i < rows.size(); i++) {
            Map<String, String> r = rows.get(i);
            String compte = r.getOrDefault(F_COMPTE, r.getOrDefault(F_CODE, "")).trim();
            if (compte.isEmpty()) continue;

            BigDecimal debit  = parseMontant(r.getOrDefault(F_SOLDE_D, r.getOrDefault(F_DEBIT, "0")));
            BigDecimal credit = parseMontant(r.getOrDefault(F_SOLDE_C, r.getOrDefault(F_CREDIT, "0")));
            if (debit.compareTo(BigDecimal.ZERO) == 0 && credit.compareTo(BigDecimal.ZERO) == 0) continue;

            CompteComptable cc = cache.computeIfAbsent(compte, num -> {
                int cl = num.isEmpty() ? 0 : Character.getNumericValue(num.charAt(0));
                return compteRepo.save(CompteComptable.builder()
                        .numero(num).intitule(r.getOrDefault(F_LIBELLE, "Compte " + num))
                        .classe(cl).entreprise(ent).build());
            });

            String numPiece = pieceSolde + "-" + compte;
            if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(numPiece, ent.getId())) { skipped++; continue; }

            EcritureComptable ec = EcritureComptable.builder()
                    .numeroPiece(numPiece)
                    .dateEcriture(dateAn)
                    .libelle("Solde d'ouverture " + compte)
                    .journal(EcritureComptable.Journal.OD)
                    .statut(EcritureComptable.Statut.VALIDEE)
                    .entreprise(ent)
                    .createdBy(usr)
                    .build();

            ec.getLignes().add(LigneEcriture.builder()
                    .ecriture(ec).compte(cc)
                    .libelle("Solde d'ouverture")
                    .debit(debit).credit(credit).build());

            // Contrepartie 890 - Bilan d'ouverture
            CompteComptable c890 = cache.computeIfAbsent("890", num ->
                    compteRepo.save(CompteComptable.builder()
                            .numero(num).intitule("Bilan d'ouverture")
                            .classe(8).entreprise(ent).build()));

            ec.getLignes().add(LigneEcriture.builder()
                    .ecriture(ec).compte(c890)
                    .libelle("Solde d'ouverture")
                    .debit(credit).credit(debit).build());

            ecritureRepo.save(ec);
            created++;
        }

        return new ImportResultDto(created, skipped, erreurs, lignesErreurs, null);
    }

    // ── Historique ────────────────────────────────────────────────────────────

    public List<ImportHistoriqueDto> getHistorique(UUID entrepriseId) {
        return historiqueRepo.findByEntrepriseIdOrderByCreatedAtDesc(entrepriseId)
                .stream().map(ImportHistoriqueDto::from).collect(Collectors.toList());
    }

    // ── Parsing CSV / Excel ───────────────────────────────────────────────────

    private List<Map<String, String>> parseRows(byte[] bytes, String nomFichier,
                                                Map<String, String> mapping) {
        boolean isExcel = nomFichier != null &&
                (nomFichier.toLowerCase().endsWith(".xlsx") || nomFichier.toLowerCase().endsWith(".xls"));
        List<List<String>> allRows = isExcel ? parseExcelRows(bytes) : parseCsvRows(bytes, detectSeparator(bytes), detectCharset(bytes));
        if (allRows.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier vide.");

        List<String> headers = allRows.get(0);
        // Construire index: colonne source → index
        Map<String, Integer> headerIndex = new HashMap<>();
        for (int i = 0; i < headers.size(); i++) headerIndex.put(headers.get(i), i);

        // Inverser le mapping : champCible → colonneSource
        Map<String, String> cibleVersSource = new HashMap<>();
        mapping.forEach((src, cible) -> cibleVersSource.put(cible, src));

        List<Map<String, String>> result = new ArrayList<>();
        for (int i = 1; i < allRows.size(); i++) {
            List<String> row = allRows.get(i);
            Map<String, String> mapped = new HashMap<>();
            cibleVersSource.forEach((cible, src) -> {
                Integer idx = headerIndex.get(src);
                if (idx != null && idx < row.size()) mapped.put(cible, row.get(idx).trim());
            });
            result.add(mapped);
        }
        return result;
    }

    private List<List<String>> parseCsvRows(byte[] bytes, String sep, Charset cs) {
        List<List<String>> rows = new ArrayList<>();
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(bytes), cs))) {
            String line;
            boolean first = true;
            while ((line = r.readLine()) != null) {
                if (first) { line = line.replace("﻿", ""); first = false; }
                if (line.isBlank()) continue;
                rows.add(Arrays.asList(line.split(sep, -1)));
            }
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erreur lecture CSV : " + e.getMessage());
        }
        return rows;
    }

    private List<List<String>> parseExcelRows(byte[] bytes) {
        try (Workbook wb = new XSSFWorkbook(new ByteArrayInputStream(bytes))) {
            Sheet sheet = wb.getSheetAt(0);
            List<List<String>> rows = new ArrayList<>();
            int cols = sheet.getRow(0) != null ? sheet.getRow(0).getLastCellNum() : 0;
            for (int i = 0; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                List<String> r = new ArrayList<>();
                for (int j = 0; j < cols; j++) {
                    Cell c = row.getCell(j, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
                    r.add(c == null ? "" : cellStr(c));
                }
                rows.add(r);
            }
            return rows;
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Erreur lecture Excel : " + e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String detectSeparator(byte[] bytes) {
        try (BufferedReader r = new BufferedReader(new InputStreamReader(new ByteArrayInputStream(bytes), StandardCharsets.UTF_8))) {
            String line = r.readLine();
            if (line == null) return ",";
            int tabs  = (int) line.chars().filter(c -> c == '\t').count();
            int semis = (int) line.chars().filter(c -> c == ';').count();
            int commas= (int) line.chars().filter(c -> c == ',').count();
            if (tabs > semis && tabs > commas) return "\t";
            if (semis > commas) return ";";
            return ",";
        } catch (IOException e) { return ","; }
    }

    private Charset detectCharset(byte[] bytes) {
        // Heuristique simple : détecter BOM UTF-8 ou Latin-1
        if (bytes.length >= 3 && bytes[0] == (byte)0xEF && bytes[1] == (byte)0xBB && bytes[2] == (byte)0xBF)
            return StandardCharsets.UTF_8;
        return Charset.forName("windows-1252"); // défaut Sage/EBP
    }

    private List<ColonneMapping> buildMappingSuggere(List<String> headers, String format) {
        Map<String, String> logicielMap = MAPPINGS_LOGICIEL.getOrDefault(format.toUpperCase(), Map.of());
        return headers.stream()
                .map(h -> new ColonneMapping(h, logicielMap.getOrDefault(h, "")))
                .collect(Collectors.toList());
    }

    private Map<String, String> resolveMapping(byte[] bytes, String nomFichier, String format) {
        PreviewDto preview = preview(bytes, nomFichier, format);
        Map<String, String> mapping = new HashMap<>();
        preview.mappingSuggere().forEach(m -> {
            if (m.champCible() != null && !m.champCible().isEmpty())
                mapping.put(m.colonneSource(), m.champCible());
        });
        return mapping;
    }

    private LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) throw new IllegalArgumentException("Date vide");
        String clean = s.trim();
        for (DateTimeFormatter fmt : List.of(
                DateTimeFormatter.ofPattern("yyyyMMdd"),
                DateTimeFormatter.ofPattern("dd/MM/yyyy"),
                DateTimeFormatter.ofPattern("dd-MM-yyyy"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd"),
                DateTimeFormatter.ofPattern("MM/dd/yyyy"))) {
            try { return LocalDate.parse(clean, fmt); } catch (DateTimeParseException ignored) {}
        }
        throw new IllegalArgumentException("Format de date non reconnu : " + s);
    }

    private BigDecimal parseMontant(String s) {
        if (s == null || s.isBlank()) return BigDecimal.ZERO;
        String clean = s.replace(" ", "").replace(" ", "").replace(",", ".").replace(" ", "");
        if (clean.isEmpty() || clean.equals("-")) return BigDecimal.ZERO;
        try { return new BigDecimal(clean); } catch (NumberFormatException e) { return BigDecimal.ZERO; }
    }

    private EcritureComptable.Journal parseJournal(String code) {
        if (code == null) return EcritureComptable.Journal.OD;
        return switch (code.toUpperCase().trim()) {
            case "BQ", "BNQ", "BAN", "CB", "TRE" -> EcritureComptable.Journal.BQ;
            case "VT", "VTE", "VEN", "FA", "FAC"  -> EcritureComptable.Journal.VT;
            case "AC", "ACH", "FOU"                -> EcritureComptable.Journal.AC;
            default                                -> EcritureComptable.Journal.OD;
        };
    }

    private String cellStr(Cell cell) {
        return switch (cell.getCellType()) {
            case NUMERIC -> {
                if (DateUtil.isCellDateFormatted(cell))
                    yield cell.getLocalDateTimeCellValue().toLocalDate().toString();
                double d = cell.getNumericCellValue();
                yield d == Math.floor(d) ? String.valueOf((long) d) : String.valueOf(d);
            }
            case BOOLEAN -> String.valueOf(cell.getBooleanCellValue());
            case FORMULA -> {
                try { yield String.valueOf(cell.getNumericCellValue()); }
                catch (Exception e) { yield cell.getStringCellValue(); }
            }
            default -> cell.getStringCellValue().trim();
        };
    }

    private void sauvegarderHistorique(Entreprise ent, Utilisateur usr,
                                        String format, String typeDonnees,
                                        String nomFichier, ImportResultDto result) {
        try {
            String rapport = result.erreurs() != null && !result.erreurs().isEmpty()
                    ? objectMapper.writeValueAsString(result.erreurs()) : null;
            historiqueRepo.save(ImportHistorique.builder()
                    .entreprise(ent).utilisateur(usr)
                    .format(ImportHistorique.Format.valueOf(format.toUpperCase()))
                    .typeDonnees(ImportHistorique.TypeDonnees.valueOf(typeDonnees.toUpperCase()))
                    .statut(result.nbErreurs() > 0 && result.nbImportes() == 0
                            ? ImportHistorique.Statut.ERREUR : ImportHistorique.Statut.TERMINE)
                    .nbImportes(result.nbImportes())
                    .nbIgnores(result.nbIgnores())
                    .nbErreurs(result.nbErreurs())
                    .nomFichier(nomFichier)
                    .rapportJson(rapport)
                    .build());
        } catch (JsonProcessingException e) {
            log.warn("Impossible de sérialiser le rapport d'erreurs", e);
        }
    }
}
