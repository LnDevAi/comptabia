package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.EcritureComptable;
import com.edefence.comptabia.repository.EcritureComptableRepository;
import com.edefence.comptabia.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExportService {

    private final LigneEcritureRepository          ligneRepo;
    private final EcritureComptableRepository       ecritureRepo;

    private static final DateTimeFormatter FEC_DATE  = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter CSV_DATE  = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ─── Balance CSV ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String exportBalanceCsv(UUID entrepriseId, LocalDate debut, LocalDate fin) {
        List<Object[]> rows = ligneRepo.balanceParCompte(entrepriseId, debut, fin);
        StringBuilder sb = new StringBuilder();
        sb.append("Compte;Intitulé;Classe;Débit;Crédit;Solde\n");
        for (Object[] r : rows) {
            String num    = (String) r[0];
            String intit  = (String) r[1];
            String classe = String.valueOf(r[2]);
            BigDecimal dbt = (BigDecimal) r[3];
            BigDecimal crd = (BigDecimal) r[4];
            BigDecimal sol = dbt.subtract(crd);
            sb.append(csv(num)).append(';')
              .append(csv(intit)).append(';')
              .append(csv(classe)).append(';')
              .append(dbt.toPlainString()).append(';')
              .append(crd.toPlainString()).append(';')
              .append(sol.toPlainString()).append('\n');
        }
        return sb.toString();
    }

    // ─── Grand livre CSV ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String exportGrandLivreCsv(UUID entrepriseId, LocalDate debut, LocalDate fin,
                                       String compteNumero) {
        List<Object[]> rows = ligneRepo.grandLivreParCompte(entrepriseId, compteNumero, debut, fin);
        StringBuilder sb = new StringBuilder();
        sb.append("Date;Pièce;Libellé;Journal;Débit;Crédit\n");
        for (Object[] r : rows) {
            LocalDate date   = (LocalDate)  r[0];
            String piece     = (String)     r[1];
            String libelle   = (String)     r[2];
            String journal   = r[3] != null ? r[3].toString() : "";
            BigDecimal dbt   = (BigDecimal) r[4];
            BigDecimal crd   = (BigDecimal) r[5];
            sb.append(date.format(CSV_DATE)).append(';')
              .append(csv(piece)).append(';')
              .append(csv(libelle)).append(';')
              .append(csv(journal)).append(';')
              .append(dbt.toPlainString()).append(';')
              .append(crd.toPlainString()).append('\n');
        }
        return sb.toString();
    }

    // ─── Écritures CSV ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public String exportEcrituresCsv(UUID entrepriseId, LocalDate debut, LocalDate fin) {
        List<EcritureComptable> ecritures = ecritureRepo.findValideesByPeriod(entrepriseId, debut, fin);
        StringBuilder sb = new StringBuilder();
        sb.append("Journal;Pièce;Date;Libellé écriture;Compte;Libellé compte;Débit;Crédit;Lettre\n");
        for (EcritureComptable e : ecritures) {
            for (var l : e.getLignes()) {
                sb.append(csv(e.getJournal().name())).append(';')
                  .append(csv(e.getNumeroPiece())).append(';')
                  .append(e.getDateEcriture().format(CSV_DATE)).append(';')
                  .append(csv(e.getLibelle())).append(';')
                  .append(csv(l.getCompte().getNumero())).append(';')
                  .append(csv(l.getCompte().getIntitule())).append(';')
                  .append(l.getDebit().toPlainString()).append(';')
                  .append(l.getCredit().toPlainString()).append(';')
                  .append(l.getLettre() != null ? l.getLettre() : "").append('\n');
            }
        }
        return sb.toString();
    }

    // ─── FEC (Fichier des Écritures Comptables — OHADA compatible) ───────────

    @Transactional(readOnly = true)
    public String exportFec(UUID entrepriseId, int exercice) {
        LocalDate debut = LocalDate.of(exercice, 1, 1);
        LocalDate fin   = LocalDate.of(exercice, 12, 31);
        List<EcritureComptable> ecritures = ecritureRepo.findValideesByPeriod(entrepriseId, debut, fin);

        StringBuilder sb = new StringBuilder();
        // En-tête FEC DGFiP / OHADA
        sb.append("JournalCode\tJournalLib\tEcritureNum\tEcritureDate\t")
          .append("CompteNum\tCompteLib\tCompAuxNum\tCompAuxLib\t")
          .append("PieceRef\tPieceDate\tEcritureLib\t")
          .append("Debit\tCredit\tEcritureLet\tDateLet\tValidDate\t")
          .append("Montantdevise\tIdevise\n");

        String validDate = LocalDate.now().format(FEC_DATE);

        for (EcritureComptable e : ecritures) {
            String jCode = e.getJournal().name();
            String jLib  = journalLibelle(e.getJournal());
            String eNum  = e.getNumeroPiece();
            String eDate = e.getDateEcriture().format(FEC_DATE);
            String pRef  = e.getNumeroPiece();
            String pDate = e.getDateEcriture().format(FEC_DATE);
            String eLib  = sanitizeFec(e.getLibelle());

            for (var l : e.getLignes()) {
                String cNum  = l.getCompte().getNumero();
                String cLib  = sanitizeFec(l.getCompte().getIntitule());
                String lettre     = l.getLettre() != null ? l.getLettre() : "";
                String lettreDate = l.getLettreDate() != null
                        ? l.getLettreDate().format(FEC_DATE) : "";

                sb.append(jCode).append('\t')
                  .append(jLib).append('\t')
                  .append(eNum).append('\t')
                  .append(eDate).append('\t')
                  .append(cNum).append('\t')
                  .append(cLib).append('\t')
                  .append('\t')   // CompAuxNum (tiers — non mappé ici)
                  .append('\t')   // CompAuxLib
                  .append(pRef).append('\t')
                  .append(pDate).append('\t')
                  .append(eLib).append('\t')
                  .append(l.getDebit().toPlainString()).append('\t')
                  .append(l.getCredit().toPlainString()).append('\t')
                  .append(lettre).append('\t')
                  .append(lettreDate).append('\t')
                  .append(validDate).append('\t')
                  .append('\t')   // Montantdevise
                  .append('\n'); // Idevise
            }
        }
        return sb.toString();
    }

    // ─── Utilitaires ─────────────────────────────────────────────────────────

    private String csv(String s) {
        if (s == null) return "";
        if (s.contains(";") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private String sanitizeFec(String s) {
        if (s == null) return "";
        return s.replace('\t', ' ').replace('\n', ' ').replace('\r', ' ');
    }

    private String journalLibelle(EcritureComptable.Journal j) {
        return switch (j) {
            case AC -> "Achats";
            case BQ -> "Banque";
            case OD -> "Opérations diverses";
            case VT -> "Ventes";
        };
    }
}
