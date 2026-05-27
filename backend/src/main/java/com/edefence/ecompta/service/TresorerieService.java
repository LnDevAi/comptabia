package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.tresorerie.TresorerieDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class TresorerieService {

    private final CompteBancaireRepository     compteRepo;
    private final TresorerieMouvementRepository mvtRepo;
    private final TresorerieAlerteRepository   alerteRepo;
    private final EntrepriseRepository          entrepriseRepo;
    private final ReleveBancaireRepository      releveRepo;

    // ─── Dashboard ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public TresorerieDto.Dashboard dashboard(UUID eid) {
        BigDecimal solde = compteRepo.soldeConsolide(eid);
        List<CompteBancaire> comptes = compteRepo.findByEntrepriseIdAndActifTrueOrderByLibelleAsc(eid);
        long alertesActives = alerteRepo.countByEntrepriseIdAndAcquittee(eid, false);
        List<TresorerieMouvement> recents = mvtRepo.findRecents(eid);
        List<TresorerieAlerte> alertesRecentes = alerteRepo
                .findByEntrepriseIdAndAcquitteeOrderByCreatedAtDesc(eid, false);

        return new TresorerieDto.Dashboard(
                solde,
                comptes.size(),
                alertesActives,
                comptes.stream().map(this::toCompteResponse).toList(),
                recents.stream().map(this::toMvtResponse).toList(),
                alertesRecentes.stream().map(this::toAlerteResponse).toList()
        );
    }

    // ─── Comptes bancaires ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TresorerieDto.CompteResponse> findComptes(UUID eid) {
        return compteRepo.findByEntrepriseIdOrderByLibelleAsc(eid)
                         .stream().map(this::toCompteResponse).toList();
    }

    @Transactional
    public TresorerieDto.CompteResponse createCompte(UUID eid, TresorerieDto.CompteRequest dto) {
        if (dto.iban() != null && !dto.iban().isBlank()
                && compteRepo.existsByIbanAndEntrepriseId(dto.iban().toUpperCase().replaceAll("\\s", ""), eid)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce compte IBAN existe déjà.");
        }
        Entreprise entreprise = entrepriseRepo.getReferenceById(eid);
        CompteBancaire.TypeCompte type = parseTypeCompte(dto.typeCompte());
        CompteBancaire c = CompteBancaire.builder()
                .entreprise(entreprise)
                .libelle(dto.libelle().trim())
                .banque(dto.banque())
                .iban(dto.iban() != null ? dto.iban().toUpperCase().replaceAll("\\s", "") : null)
                .bic(dto.bic() != null ? dto.bic().toUpperCase().trim() : null)
                .compteComptableNumero(dto.compteComptableNumero())
                .typeCompte(type)
                .seuilAlerte(dto.seuilAlerte() != null ? dto.seuilAlerte() : BigDecimal.ZERO)
                .build();
        return toCompteResponse(compteRepo.save(c));
    }

    @Transactional
    public TresorerieDto.CompteResponse updateCompte(UUID id, UUID eid, TresorerieDto.CompteRequest dto) {
        CompteBancaire c = findCompteOrThrow(id, eid);
        c.setLibelle(dto.libelle().trim());
        c.setBanque(dto.banque());
        if (dto.iban() != null && !dto.iban().isBlank()) {
            String iban = dto.iban().toUpperCase().replaceAll("\\s", "");
            if (!iban.equals(c.getIban()) && compteRepo.existsByIbanAndEntrepriseId(iban, eid)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce compte IBAN existe déjà.");
            }
            c.setIban(iban);
        }
        c.setBic(dto.bic() != null ? dto.bic().toUpperCase().trim() : null);
        c.setCompteComptableNumero(dto.compteComptableNumero());
        c.setTypeCompte(parseTypeCompte(dto.typeCompte()));
        c.setSeuilAlerte(dto.seuilAlerte() != null ? dto.seuilAlerte() : BigDecimal.ZERO);
        return toCompteResponse(compteRepo.save(c));
    }

    @Transactional
    public TresorerieDto.CompteResponse updateSolde(UUID id, UUID eid, TresorerieDto.SoldeRequest dto) {
        CompteBancaire c = findCompteOrThrow(id, eid);
        c.setSoldeReel(dto.solde());
        c.setSoldeDate(dto.date());
        compteRepo.save(c);
        checkAlertes(c, eid);
        return toCompteResponse(c);
    }

    @Transactional
    public void deleteCompte(UUID id, UUID eid) {
        CompteBancaire c = findCompteOrThrow(id, eid);
        c.setActif(false);
        compteRepo.save(c);
    }

    // ─── Mouvements ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TresorerieDto.MouvementResponse> findMovements(UUID eid, UUID compteId, Pageable pageable) {
        return mvtRepo.search(eid, compteId, pageable).map(this::toMvtResponse);
    }

    @Transactional
    public TresorerieDto.MouvementResponse createMouvement(UUID eid, TresorerieDto.MouvementRequest dto) {
        CompteBancaire compte = findCompteOrThrow(dto.compteId(), eid);
        CompteBancaire compteDest = null;
        if (dto.compteDestId() != null) {
            compteDest = findCompteOrThrow(dto.compteDestId(), eid);
        }

        TresorerieMouvement.TypeMouvement type;
        try {
            type = TresorerieMouvement.TypeMouvement.valueOf(dto.typeMouvement().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Type de mouvement invalide : " + dto.typeMouvement());
        }

        Entreprise entreprise = entrepriseRepo.getReferenceById(eid);
        TresorerieMouvement mvt = TresorerieMouvement.builder()
                .entreprise(entreprise)
                .compte(compte)
                .compteDest(compteDest)
                .typeMouvement(type)
                .libelle(dto.libelle().trim())
                .montant(dto.montant())
                .dateOperation(dto.dateOperation())
                .reference(dto.reference())
                .build();

        // Adjust soldes for VIREMENT_INTERNE
        if (type == TresorerieMouvement.TypeMouvement.VIREMENT_INTERNE && compteDest != null) {
            compte.setSoldeReel(compte.getSoldeReel().subtract(dto.montant()));
            compteDest.setSoldeReel(compteDest.getSoldeReel().add(dto.montant()));
            compteRepo.save(compte);
            compteRepo.save(compteDest);
            checkAlertes(compte, eid);
        }

        TresorerieMouvement saved = mvtRepo.save(mvt);
        log.info("Mouvement trésorerie compte={} type={} montant={}", compte.getLibelle(), type, dto.montant());
        return toMvtResponse(saved);
    }

    @Transactional
    public void deleteMouvement(UUID id, UUID eid) {
        TresorerieMouvement mvt = mvtRepo.findByIdAndEntrepriseId(id, eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mouvement introuvable"));
        mvtRepo.delete(mvt);
    }

    // ─── Alertes ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<TresorerieDto.AlerteResponse> findAlertes(UUID eid, boolean acquittees) {
        return alerteRepo.findByEntrepriseIdAndAcquitteeOrderByCreatedAtDesc(eid, acquittees)
                         .stream().map(this::toAlerteResponse).toList();
    }

    @Transactional
    public TresorerieDto.AlerteResponse acquitterAlerte(UUID id, UUID eid) {
        TresorerieAlerte alerte = alerteRepo.findByIdAndEntrepriseId(id, eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alerte introuvable"));
        alerte.setAcquittee(true);
        return toAlerteResponse(alerteRepo.save(alerte));
    }

    // ─── Import OFX ───────────────────────────────────────────────────────────

    @Transactional
    public TresorerieDto.ImportResult importerOFX(UUID eid, String compteNumero, byte[] ofxBytes) {
        Entreprise entreprise = entrepriseRepo.findById(eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));
        String content = new String(ofxBytes, StandardCharsets.UTF_8);
        List<ReleveBancaire> entries = parseOFX(content, entreprise, compteNumero);
        int imported = 0, skipped = 0;
        for (ReleveBancaire r : entries) {
            try {
                releveRepo.save(r);
                imported++;
            } catch (Exception e) {
                skipped++;
                log.debug("OFX entry skipped: {}", e.getMessage());
            }
        }
        log.info("OFX import compte={} imported={} skipped={}", compteNumero, imported, skipped);
        return new TresorerieDto.ImportResult(imported, skipped,
                imported + " ligne(s) importée(s), " + skipped + " ignorée(s)");
    }

    // ─── OFX Parser ───────────────────────────────────────────────────────────

    private List<ReleveBancaire> parseOFX(String content, Entreprise entreprise, String compteNumero) {
        List<ReleveBancaire> result = new ArrayList<>();
        // Support OFX 1.x (SGML) and OFX 2.x (XML)
        // Extract STMTTRN blocks
        Pattern stmtPattern = Pattern.compile(
                "<STMTTRN>([\\s\\S]*?)</STMTTRN>",
                Pattern.CASE_INSENSITIVE);
        Matcher stmtMatcher = stmtPattern.matcher(content);

        while (stmtMatcher.find()) {
            String block = stmtMatcher.group(1);
            try {
                String trnType = extractTag(block, "TRNTYPE");
                String dtPosted = extractTag(block, "DTPOSTED");
                String amount = extractTag(block, "TRNAMT");
                String fitId = extractTag(block, "FITID");
                String name = extractTag(block, "NAME");
                String memo = extractTag(block, "MEMO");

                if (amount == null || dtPosted == null) continue;

                LocalDate date = parseOFXDate(dtPosted);
                BigDecimal montant = new BigDecimal(amount.replace(",", ".").trim()).abs();
                String libelle = memo != null ? memo : (name != null ? name : "OFX");
                ReleveBancaire.Sens sens = "CREDIT".equalsIgnoreCase(trnType)
                        ? ReleveBancaire.Sens.CREDIT : ReleveBancaire.Sens.DEBIT;
                // DEBITs in OFX can have negative TRNAMT
                if (amount.trim().startsWith("-")) {
                    sens = ReleveBancaire.Sens.DEBIT;
                } else if ("CREDIT".equalsIgnoreCase(trnType) || "DEP".equalsIgnoreCase(trnType)
                        || "INT".equalsIgnoreCase(trnType)) {
                    sens = ReleveBancaire.Sens.CREDIT;
                }

                result.add(ReleveBancaire.builder()
                        .entreprise(entreprise)
                        .compteNumero(compteNumero)
                        .dateReleve(date)
                        .libelle(libelle.length() > 500 ? libelle.substring(0, 500) : libelle)
                        .montant(montant)
                        .sens(sens)
                        .reference(fitId)
                        .build());
            } catch (Exception e) {
                log.debug("Could not parse OFX STMTTRN block: {}", e.getMessage());
            }
        }
        return result;
    }

    private String extractTag(String block, String tag) {
        Pattern p = Pattern.compile("<" + tag + ">([^<\r\n]*)", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(block);
        return m.find() ? m.group(1).trim() : null;
    }

    private LocalDate parseOFXDate(String raw) {
        // OFX date: YYYYMMDD or YYYYMMDDHHMMSS or YYYYMMDDHHMMSS.XXX[+00:America/New_York]
        String s = raw.replaceAll("[\\[\\]]", "").trim();
        if (s.length() >= 8) s = s.substring(0, 8);
        return LocalDate.parse(s, DateTimeFormatter.BASIC_ISO_DATE);
    }

    // ─── Flux mensuels ───────────────────────────────────────────────────────

    private static final List<TresorerieMouvement.TypeMouvement> TYPES_ENTREE = List.of(
            TresorerieMouvement.TypeMouvement.ENCAISSEMENT,
            TresorerieMouvement.TypeMouvement.DEPOT_ESPECES,
            TresorerieMouvement.TypeMouvement.REMISE_CHEQUES
    );

    private static final List<TresorerieMouvement.TypeMouvement> TYPES_SORTIE = List.of(
            TresorerieMouvement.TypeMouvement.DECAISSEMENT,
            TresorerieMouvement.TypeMouvement.RETRAIT_ESPECES,
            TresorerieMouvement.TypeMouvement.FRAIS_BANCAIRES
    );

    private static final String[] MOIS_FR = {
            "", "Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin",
            "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."
    };

    @Transactional(readOnly = true)
    public TresorerieDto.StatFlux getStatFlux(UUID eid, int exercice) {
        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);

        List<Object[]> rows = mvtRepo.fluxMensuel(eid, from, to, TYPES_ENTREE, TYPES_SORTIE);

        java.util.Map<Integer, BigDecimal[]> byMois = new java.util.LinkedHashMap<>();
        for (Object[] row : rows) {
            int mois      = ((Number) row[0]).intValue();
            BigDecimal enc = (BigDecimal) row[1];
            BigDecimal dec = (BigDecimal) row[2];
            byMois.put(mois, new BigDecimal[]{ enc, dec });
        }

        List<TresorerieDto.FluxMensuel> mensuel = new ArrayList<>();
        BigDecimal totalEnc = BigDecimal.ZERO;
        BigDecimal totalDec = BigDecimal.ZERO;

        for (int m = 1; m <= 12; m++) {
            BigDecimal[] v = byMois.getOrDefault(m, new BigDecimal[]{ BigDecimal.ZERO, BigDecimal.ZERO });
            BigDecimal enc = v[0];
            BigDecimal dec = v[1];
            BigDecimal net = enc.subtract(dec);
            totalEnc = totalEnc.add(enc);
            totalDec = totalDec.add(dec);
            mensuel.add(new TresorerieDto.FluxMensuel(m, MOIS_FR[m], enc, dec, net));
        }

        return new TresorerieDto.StatFlux(exercice, totalEnc, totalDec,
                totalEnc.subtract(totalDec), mensuel);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void checkAlertes(CompteBancaire compte, UUID eid) {
        BigDecimal solde = compte.getSoldeReel();
        if (solde.compareTo(BigDecimal.ZERO) < 0) {
            alerteRepo.save(TresorerieAlerte.builder()
                    .entrepriseId(eid)
                    .compte(compte)
                    .typeAlerte(TresorerieAlerte.TypeAlerte.SOLDE_NEGATIF)
                    .message("Le compte « " + compte.getLibelle() + " » est débiteur (" + solde + ")")
                    .soldeConstate(solde)
                    .build());
        } else if (compte.getSeuilAlerte().compareTo(BigDecimal.ZERO) > 0
                && solde.compareTo(compte.getSeuilAlerte()) < 0) {
            alerteRepo.save(TresorerieAlerte.builder()
                    .entrepriseId(eid)
                    .compte(compte)
                    .typeAlerte(TresorerieAlerte.TypeAlerte.SOLDE_MINIMUM)
                    .message("Le solde du compte « " + compte.getLibelle() + " » (" + solde
                            + ") est inférieur au seuil (" + compte.getSeuilAlerte() + ")")
                    .soldeConstate(solde)
                    .build());
        }
    }

    private CompteBancaire.TypeCompte parseTypeCompte(String s) {
        if (s == null) return CompteBancaire.TypeCompte.COURANT;
        try { return CompteBancaire.TypeCompte.valueOf(s.toUpperCase()); }
        catch (IllegalArgumentException e) { return CompteBancaire.TypeCompte.COURANT; }
    }

    private CompteBancaire findCompteOrThrow(UUID id, UUID eid) {
        return compteRepo.findByIdAndEntrepriseId(id, eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte bancaire introuvable"));
    }

    private TresorerieDto.CompteResponse toCompteResponse(CompteBancaire c) {
        boolean enAlerte = c.getSeuilAlerte().compareTo(BigDecimal.ZERO) > 0
                && c.getSoldeReel().compareTo(c.getSeuilAlerte()) < 0;
        return new TresorerieDto.CompteResponse(c.getId(), c.getLibelle(), c.getBanque(),
                c.getIban(), c.getBic(), c.getCompteComptableNumero(), c.getTypeCompte().name(),
                c.getSoldeReel(), c.getSoldeDate(), c.getSeuilAlerte(), c.isActif(), enAlerte,
                c.getCreatedAt());
    }

    private TresorerieDto.MouvementResponse toMvtResponse(TresorerieMouvement m) {
        String dest = m.getCompteDest() != null ? m.getCompteDest().getLibelle() : null;
        return new TresorerieDto.MouvementResponse(m.getId(), m.getCompte().getLibelle(),
                dest, m.getTypeMouvement().name(), m.getLibelle(), m.getMontant(),
                m.getDateOperation(), m.getReference(), m.getCreatedAt());
    }

    private TresorerieDto.AlerteResponse toAlerteResponse(TresorerieAlerte a) {
        return new TresorerieDto.AlerteResponse(a.getId(), a.getCompte().getLibelle(),
                a.getTypeAlerte().name(), a.getMessage(), a.getSoldeConstate(),
                a.isAcquittee(), a.getCreatedAt());
    }
}
