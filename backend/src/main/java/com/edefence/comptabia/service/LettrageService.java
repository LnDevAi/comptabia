package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.LigneEcriture;
import com.edefence.comptabia.dto.lettrage.LettrageDto;
import com.edefence.comptabia.repository.CompteComptableRepository;
import com.edefence.comptabia.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LettrageService {

    private final LigneEcritureRepository ligneRepo;
    private final CompteComptableRepository compteRepo;
    private final AuditService auditSvc;

    // ─── Lecture ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LettrageDto.CompteLettrageView getLignes(UUID entrepriseId, String compteNumero) {
        var compte = compteRepo.findByNumeroAndEntrepriseId(compteNumero, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable"));

        List<Object[]> rows = ligneRepo.findLignesLettrage(entrepriseId, compteNumero);
        List<LettrageDto.LigneLettrage> lignes = new ArrayList<>();
        for (Object[] r : rows) {
            lignes.add(new LettrageDto.LigneLettrage(
                    (UUID)       r[0],
                    (LocalDate)  r[1],
                    (String)     r[2],
                    (String)     r[3],
                    (BigDecimal) r[4],
                    (BigDecimal) r[5],
                    (String)     r[6],
                    (LocalDate)  r[7]
            ));
        }
        return new LettrageDto.CompteLettrageView(compteNumero, compte.getIntitule(), lignes);
    }

    // ─── Lettrer ─────────────────────────────────────────────────────────────

    @Transactional
    public LettrageDto.LettrageResult lettrer(UUID entrepriseId, String compteNumero,
                                              List<UUID> ligneIds) {
        if (ligneIds == null || ligneIds.size() < 2) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Sélectionner au moins 2 lignes à lettrer.");
        }

        List<LigneEcriture> lignes = ligneRepo.findByIdsForLettrage(ligneIds, entrepriseId, compteNumero);
        if (lignes.size() != ligneIds.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Certaines lignes sont invalides ou n'appartiennent pas à ce compte.");
        }

        // Vérifier que les lignes ne sont pas déjà lettrées
        boolean dejsLettre = lignes.stream().anyMatch(l -> l.getLettre() != null);
        if (dejsLettre) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Une ou plusieurs lignes sont déjà lettrées.");
        }

        // Vérifier que le solde est nul (équilibre débit/crédit)
        BigDecimal solde = lignes.stream()
                .map(l -> l.getDebit().subtract(l.getCredit()))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (solde.compareTo(BigDecimal.ZERO) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le solde des lignes sélectionnées n'est pas nul (" + solde + ").");
        }

        String lettre = nextLettre(entrepriseId, compteNumero);
        ligneRepo.lettrer(ligneIds, lettre, LocalDate.now());
        auditSvc.logCurrent(entrepriseId, "LETTRAGE_APPLIQUE", "COMPTE",
                compteNumero + " lettre=" + lettre);
        return new LettrageDto.LettrageResult(lettre, lignes.size());
    }

    // ─── Délettrer ───────────────────────────────────────────────────────────

    @Transactional
    public void delettrer(UUID entrepriseId, String compteNumero, String lettre) {
        if (lettre == null || lettre.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lettre requise.");
        }
        ligneRepo.delettrer(lettre.toUpperCase(), entrepriseId, compteNumero);
        auditSvc.logCurrent(entrepriseId, "LETTRAGE_ANNULE", "COMPTE",
                compteNumero + " lettre=" + lettre.toUpperCase());
    }

    // ─── Calcul prochaine lettre ─────────────────────────────────────────────

    private String nextLettre(UUID entrepriseId, String compteNumero) {
        String max = ligneRepo.findMaxLettre(entrepriseId, compteNumero);
        if (max == null || max.isBlank()) return "A";
        return increment(max);
    }

    static String increment(String s) {
        char[] chars = s.toCharArray();
        int i = chars.length - 1;
        while (i >= 0) {
            if (chars[i] < 'Z') {
                chars[i]++;
                return new String(chars);
            }
            chars[i] = 'A';
            i--;
        }
        // Overflow: all Z → add new leading A
        char[] next = new char[chars.length + 1];
        next[0] = 'A';
        for (int j = 0; j < chars.length; j++) next[j + 1] = 'A';
        return new String(next);
    }
}
