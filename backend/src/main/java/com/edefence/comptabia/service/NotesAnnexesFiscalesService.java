package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Amortissement;
import com.edefence.comptabia.domain.DeclarationTva;
import com.edefence.comptabia.domain.Immobilisation;
import com.edefence.comptabia.dto.notesannexes.NotesAnnexesDto;
import com.edefence.comptabia.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotesAnnexesFiscalesService {

    private final EntrepriseRepository     entrepriseRepo;
    private final ImmobilisationRepository immoRepo;
    private final AmortissementRepository  amortRepo;
    private final DeclarationTvaRepository tvaRepo;
    private final DeclarationIsRepository  isRepo;
    private final FeuillePaieRepository    paieRepo;

    @Transactional(readOnly = true)
    public NotesAnnexesDto.Document generer(UUID eid, int exercice) {
        var entreprise = entrepriseRepo.findById(eid)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));

        List<NotesAnnexesDto.Section> sections = new ArrayList<>();
        sections.add(buildNote1Methodes(entreprise.getReferentielComptable()));
        sections.add(buildNote2Immobilisations(eid, exercice));
        sections.add(buildNote3Amortissements(eid, exercice));
        sections.add(buildNote4Tva(eid, exercice));
        sections.add(buildNote5Is(eid, exercice));
        sections.add(buildNote6Personnel(eid, exercice));

        return new NotesAnnexesDto.Document(
                entreprise.getNom(),
                entreprise.getPays() != null ? entreprise.getPays() : "Burkina Faso",
                entreprise.getReferentielComptable() != null ? entreprise.getReferentielComptable() : "SYSCOHADA",
                entreprise.getDevise() != null ? entreprise.getDevise() : "XOF",
                exercice,
                LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")),
                sections);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private NotesAnnexesDto.Section buildNote1Methodes(String referentiel) {
        String ref = referentiel != null ? referentiel : "SYSCOHADA";
        String texte = "Les états financiers sont établis conformément au référentiel " + ref + " " +
                "et aux dispositions légales en vigueur.\n\n" +
                "Immobilisations : évaluées au coût d'acquisition ou de production. " +
                "Amortissements calculés selon le mode linéaire sur la durée économique estimée.\n\n" +
                "Stocks : évalués au Coût Moyen Pondéré (CMP).\n\n" +
                "Créances et dettes : comptabilisées à leur valeur nominale. " +
                "Provisions pour dépréciation sur créances douteuses.\n\n" +
                "Devises étrangères : converties au taux du jour de l'opération. " +
                "Écarts de conversion enregistrés en résultat.";
        return new NotesAnnexesDto.Section(1, "Règles et méthodes comptables", "TEXTE",
                texte, List.of(), List.of(), null);
    }

    private NotesAnnexesDto.Section buildNote2Immobilisations(UUID eid, int exercice) {
        List<Immobilisation> immos = immoRepo.search(eid, null, null, null, Pageable.unpaged()).getContent();
        List<String> cols = List.of("Code", "Désignation", "Catégorie", "Date acquisition",
                "Valeur brute", "Valeur brute fin");
        List<NotesAnnexesDto.TableauLigne> lignes = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;
        for (Immobilisation i : immos) {
            total = total.add(i.getValeurBrute());
            lignes.add(row(i.getCode(), i.getDesignation(), i.getCategorie().name(),
                    i.getDateAcquisition().toString(), fmt(i.getValeurBrute()), fmt(i.getValeurBrute())));
        }
        lignes.add(row("TOTAL", "", "", "", "", fmt(total)));
        return new NotesAnnexesDto.Section(2, "État des immobilisations", "TABLEAU",
                "Tableau de variation des immobilisations au " + exercice + ".",
                lignes, cols, immos.isEmpty() ? "Aucune immobilisation enregistrée." : null);
    }

    private NotesAnnexesDto.Section buildNote3Amortissements(UUID eid, int exercice) {
        List<Immobilisation> immos = immoRepo.search(eid, null, null, null, Pageable.unpaged()).getContent();
        List<String> cols = List.of("Désignation", "Valeur brute", "Cumul N-1", "Dotation N", "Cumul N", "VNC");
        List<NotesAnnexesDto.TableauLigne> lignes = new ArrayList<>();
        BigDecimal tBrute = BigDecimal.ZERO, tCN1 = BigDecimal.ZERO,
                tDot = BigDecimal.ZERO, tCN = BigDecimal.ZERO, tVnc = BigDecimal.ZERO;
        for (Immobilisation i : immos) {
            BigDecimal dotN  = amortRepo.findByImmobilisationIdAndExercice(i.getId(), exercice)
                    .map(Amortissement::getDotation).orElse(BigDecimal.ZERO);
            BigDecimal cumulN = amortRepo.findByImmobilisationIdAndExercice(i.getId(), exercice)
                    .map(Amortissement::getCumulAmortissement).orElse(BigDecimal.ZERO);
            BigDecimal cumulN1 = amortRepo.findByImmobilisationIdAndExercice(i.getId(), exercice - 1)
                    .map(Amortissement::getCumulAmortissement).orElse(BigDecimal.ZERO);
            BigDecimal vnc = i.getValeurBrute().subtract(cumulN);
            tBrute = tBrute.add(i.getValeurBrute());
            tCN1 = tCN1.add(cumulN1); tDot = tDot.add(dotN);
            tCN = tCN.add(cumulN); tVnc = tVnc.add(vnc);
            lignes.add(row(i.getDesignation(), fmt(i.getValeurBrute()),
                    fmt(cumulN1), fmt(dotN), fmt(cumulN), fmt(vnc)));
        }
        lignes.add(row("TOTAL", fmt(tBrute), fmt(tCN1), fmt(tDot), fmt(tCN), fmt(tVnc)));
        return new NotesAnnexesDto.Section(3, "Tableau des amortissements", "TABLEAU",
                "Dotations aux amortissements — exercice " + exercice + ".",
                lignes, cols, null);
    }

    private NotesAnnexesDto.Section buildNote4Tva(UUID eid, int exercice) {
        // Filter TVA declarations that fall within the exercice year
        List<DeclarationTva> decls = tvaRepo.findByEntrepriseIdOrderByPeriodeDebutDesc(eid)
                .stream()
                .filter(d -> d.getPeriodeDebut().getYear() == exercice)
                .toList();
        List<String> cols = List.of("Période", "TVA collectée", "TVA déductible", "TVA nette");
        List<NotesAnnexesDto.TableauLigne> lignes = new ArrayList<>();
        BigDecimal totC = BigDecimal.ZERO, totD = BigDecimal.ZERO, totN = BigDecimal.ZERO;
        for (var d : decls) {
            totC = totC.add(d.getTvaCollectee());
            totD = totD.add(d.getTvaDeductible());
            totN = totN.add(d.getTvaADecaisser());
            lignes.add(row(d.getPeriodeDebut().format(DateTimeFormatter.ofPattern("MM/yyyy")),
                    fmt(d.getTvaCollectee()), fmt(d.getTvaDeductible()), fmt(d.getTvaADecaisser())));
        }
        lignes.add(row("TOTAL " + exercice, fmt(totC), fmt(totD), fmt(totN)));
        return new NotesAnnexesDto.Section(4, "Situation de la TVA", "TABLEAU",
                "Récapitulatif des déclarations TVA de l'exercice " + exercice + ".",
                lignes, cols, "TVA collectée : " + fmt(totC) + " | Déductible : " + fmt(totD) +
                " | Nette versée : " + fmt(totN));
    }

    private NotesAnnexesDto.Section buildNote5Is(UUID eid, int exercice) {
        var opt = isRepo.findByEntrepriseIdAndExercice(eid, exercice);
        if (opt.isEmpty()) return new NotesAnnexesDto.Section(5,
                "Impôt sur les Sociétés (IS) — Résultat fiscal", "TEXTE",
                "Aucune déclaration IS enregistrée pour l'exercice " + exercice + ".",
                List.of(), List.of(), null);
        var d = opt.get();
        List<String> cols = List.of("Élément", "Montant");
        List<NotesAnnexesDto.TableauLigne> lignes = List.of(
                row("Résultat comptable avant IS",          fmt(d.getResultatComptable())),
                row("(+) Réintégrations fiscales",           fmt(d.getReintagrations())),
                row("(-) Déductions fiscales",               fmt(d.getDeductions())),
                row("= Résultat fiscal imposable",           fmt(d.getResultatFiscal())),
                row("Taux IS applicable",                    d.getTauxIs() + " %"),
                row("IS théorique",                          fmt(d.getIsTheorique())),
                row("Minimum forfaitaire (1% CA HT)",        fmt(d.getMinimumForfaitaire())),
                row("IS DÛ (retenu le plus élevé)",          fmt(d.getIsDu())),
                row("Statut de la déclaration",              d.getStatut().name())
        );
        return new NotesAnnexesDto.Section(5, "Impôt sur les Sociétés (IS) — Résultat fiscal", "TABLEAU",
                "Détermination du résultat fiscal et calcul de l'IS — exercice " + exercice + ".",
                lignes, cols, null);
    }

    private NotesAnnexesDto.Section buildNote6Personnel(UUID eid, int exercice) {
        var feuilles = paieRepo.findByEntrepriseIdAndExerciceOrderByMoisAsc(eid, exercice);
        if (feuilles.isEmpty()) return new NotesAnnexesDto.Section(6, "Charges de personnel", "TEXTE",
                "Aucune feuille de paie pour l'exercice " + exercice + ".",
                List.of(), List.of(), null);
        BigDecimal tBrut = BigDecimal.ZERO, tSal = BigDecimal.ZERO,
                tPat = BigDecimal.ZERO, tIuts = BigDecimal.ZERO;
        int maxSal = 0;
        for (var f : feuilles) {
            tBrut  = tBrut.add(f.getMasseSalarialeBrute());
            tSal   = tSal.add(f.getCotisationsSalariales());
            tPat   = tPat.add(f.getCotisationsPatronales());
            tIuts  = tIuts.add(f.getImpotRetenu());
            if (f.getNbSalaries() > maxSal) maxSal = f.getNbSalaries();
        }
        List<String> cols = List.of("Élément", "Montant total exercice");
        List<NotesAnnexesDto.TableauLigne> lignes = List.of(
                row("Effectif maximum",                               String.valueOf(maxSal)),
                row("Mois de paie déclarés",                         String.valueOf(feuilles.size())),
                row("Masse salariale brute totale",                  fmt(tBrut)),
                row("Cotisations salariales (CNSS part salarié)",    fmt(tSal)),
                row("Cotisations patronales (CNSS part patronale)",  fmt(tPat)),
                row("IUTS retenu et versé",                          fmt(tIuts)),
                row("Coût total employeur (brut + pat.)",            fmt(tBrut.add(tPat)))
        );
        return new NotesAnnexesDto.Section(6, "Charges de personnel", "TABLEAU",
                "Charges salariales et sociales — exercice " + exercice + ".",
                lignes, cols, null);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private static NotesAnnexesDto.TableauLigne row(String... cells) {
        return new NotesAnnexesDto.TableauLigne(List.of(cells));
    }

    private static String fmt(BigDecimal v) {
        if (v == null) return "—";
        return String.format("%,.0f", v.setScale(0, RoundingMode.HALF_UP));
    }
}
