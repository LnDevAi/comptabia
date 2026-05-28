package com.edefence.comptabia.service;

import com.edefence.comptabia.dto.etats.EvcapDto;
import com.edefence.comptabia.dto.etats.FluxTresorerieDto;
import com.edefence.comptabia.dto.etats.NoteCatalogueDto;
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
public class NotesCatalogueService {

    private final LigneEcritureRepository ligneRepo;
    private final EtatFinancierService etatSvc;

    // ─── Catalogue des 36 notes AUDCIF ───────────────────────────────────────

    private static final List<NoteCatalogueDto.Definition> CATALOGUE = List.of(
        // ── Groupe I : Règles et méthodes ─────────────────────────────────────
        new NoteCatalogueDto.Definition( 1, "I – Règles et méthodes",  "Faits caractéristiques de l'exercice",                    "TEXTE"),
        new NoteCatalogueDto.Definition( 2, "I – Règles et méthodes",  "Règles et méthodes comptables applicables",               "TEXTE"),
        // ── Groupe II : Immobilisations ──────────────────────────────────────
        new NoteCatalogueDto.Definition( 3, "II – Immobilisations",    "Tableau des immobilisations incorporelles (21x)",         "CALCULEE"),
        new NoteCatalogueDto.Definition( 4, "II – Immobilisations",    "Tableau des immobilisations corporelles (22x-25x, 27x)",  "CALCULEE"),
        new NoteCatalogueDto.Definition( 5, "II – Immobilisations",    "Tableau des immobilisations financières (26x, 271x-278x)","CALCULEE"),
        new NoteCatalogueDto.Definition( 6, "II – Immobilisations",    "Amortissements des immos incorporelles (281x, 282x)",     "CALCULEE"),
        new NoteCatalogueDto.Definition( 7, "II – Immobilisations",    "Amortissements des immos corporelles (283x-287x)",        "CALCULEE"),
        new NoteCatalogueDto.Definition( 8, "II – Immobilisations",    "Dépréciations des immobilisations (291x, 292x, 296x-297x)","CALCULEE"),
        new NoteCatalogueDto.Definition( 9, "II – Immobilisations",    "Immobilisations acquises en crédit-bail",                 "TEXTE"),
        // ── Groupe III : Actif circulant ─────────────────────────────────────
        new NoteCatalogueDto.Definition(10, "III – Actif circulant",   "Composition des stocks (31x-38x)",                       "CALCULEE"),
        new NoteCatalogueDto.Definition(11, "III – Actif circulant",   "Créances clients et comptes rattachés (41x)",             "CALCULEE"),
        new NoteCatalogueDto.Definition(12, "III – Actif circulant",   "Autres créances de l'actif circulant (44x-48x)",          "CALCULEE"),
        new NoteCatalogueDto.Definition(13, "III – Actif circulant",   "Titres de placement (50x, 57x)",                         "CALCULEE"),
        new NoteCatalogueDto.Definition(14, "III – Actif circulant",   "Disponibilités (51x-53x)",                               "CALCULEE"),
        // ── Groupe IV : Capitaux propres et passif ────────────────────────────
        new NoteCatalogueDto.Definition(15, "IV – Capitaux et passif", "Variation des capitaux propres (10x-15x)",               "CALCULEE"),
        new NoteCatalogueDto.Definition(16, "IV – Capitaux et passif", "Subventions d'investissement (14x)",                     "CALCULEE"),
        new NoteCatalogueDto.Definition(17, "IV – Capitaux et passif", "Provisions réglementées (15x)",                          "CALCULEE"),
        new NoteCatalogueDto.Definition(18, "IV – Capitaux et passif", "Provisions pour risques et charges (19x)",               "CALCULEE"),
        new NoteCatalogueDto.Definition(19, "IV – Capitaux et passif", "Emprunts et dettes financières (16x, 17x)",              "CALCULEE"),
        new NoteCatalogueDto.Definition(20, "IV – Capitaux et passif", "Dettes fournisseurs et comptes rattachés (40x)",         "CALCULEE"),
        new NoteCatalogueDto.Definition(21, "IV – Capitaux et passif", "Dettes fiscales et sociales (42x-44x)",                  "CALCULEE"),
        new NoteCatalogueDto.Definition(22, "IV – Capitaux et passif", "Autres dettes du passif circulant (46x, 47x, 48x)",      "CALCULEE"),
        new NoteCatalogueDto.Definition(23, "IV – Capitaux et passif", "Engagements hors bilan",                                 "TEXTE"),
        // ── Groupe V : Compte de résultat ────────────────────────────────────
        new NoteCatalogueDto.Definition(24, "V – Compte de résultat",  "Chiffre d'affaires et autres produits d'activité (70x-75x)","CALCULEE"),
        new NoteCatalogueDto.Definition(25, "V – Compte de résultat",  "Achats et services extérieurs (60x-65x)",                "CALCULEE"),
        new NoteCatalogueDto.Definition(26, "V – Compte de résultat",  "Effectifs et charges de personnel (66x)",                "CALCULEE"),
        new NoteCatalogueDto.Definition(27, "V – Compte de résultat",  "Charges financières (67x)",                              "CALCULEE"),
        new NoteCatalogueDto.Definition(28, "V – Compte de résultat",  "Dotations aux amortissements et provisions (68x, 69x)",  "CALCULEE"),
        new NoteCatalogueDto.Definition(29, "V – Compte de résultat",  "Reprises sur provisions (78x, 79x)",                     "CALCULEE"),
        new NoteCatalogueDto.Definition(30, "V – Compte de résultat",  "Résultat hors activités ordinaires (81x-88x)",           "CALCULEE"),
        // ── Groupe VI : Flux et compléments ──────────────────────────────────
        new NoteCatalogueDto.Definition(31, "VI – Flux et compléments","Tableau des flux de trésorerie",                         "CALCULEE"),
        new NoteCatalogueDto.Definition(32, "VI – Flux et compléments","Impôts sur le résultat (89x)",                           "CALCULEE"),
        new NoteCatalogueDto.Definition(33, "VI – Flux et compléments","Distribution de dividendes (465x)",                      "CALCULEE"),
        new NoteCatalogueDto.Definition(34, "VI – Flux et compléments","Informations sur les parties liées",                     "TEXTE"),
        new NoteCatalogueDto.Definition(35, "VI – Flux et compléments","Événements postérieurs à la clôture",                    "TEXTE"),
        new NoteCatalogueDto.Definition(36, "VI – Flux et compléments","Autres informations significatives",                     "TEXTE")
    );

    public List<NoteCatalogueDto.Definition> getCatalogue() {
        return CATALOGUE;
    }

    // ─── Calcul d'une note computée ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public NoteCatalogueDto.NoteCalculee computeNote(UUID entrepriseId, int exercice, int numero) {
        String titre = CATALOGUE.stream()
            .filter(d -> d.numero() == numero)
            .findFirst()
            .map(NoteCatalogueDto.Definition::titre)
            .orElse("Note " + numero);

        LocalDate from = LocalDate.of(exercice, 1, 1);
        LocalDate to   = LocalDate.of(exercice, 12, 31);
        List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);

        return switch (numero) {
            case  3 -> filtre(exercice, numero, titre, balance, "21", "22");
            case  4 -> filtre(exercice, numero, titre, balance, "23", "24", "25", "27");
            case  5 -> filtre(exercice, numero, titre, balance, "26", "271", "272", "273", "274", "275", "276", "278");
            case  6 -> filtre(exercice, numero, titre, balance, "281", "282");
            case  7 -> filtre(exercice, numero, titre, balance, "283", "284", "285", "286", "287", "288");
            case  8 -> filtre(exercice, numero, titre, balance, "291", "292", "296", "297");
            case 10 -> filtre(exercice, numero, titre, balance, "31", "32", "33", "34", "35", "36", "37", "38");
            case 11 -> filtre(exercice, numero, titre, balance, "41");
            case 12 -> filtre(exercice, numero, titre, balance, "44", "45", "46", "47", "48");
            case 13 -> filtre(exercice, numero, titre, balance, "50", "57");
            case 14 -> filtre(exercice, numero, titre, balance, "51", "52", "53");
            case 15 -> evcapToNote(exercice, titre, etatSvc.getEvcap(entrepriseId, exercice));
            case 16 -> filtre(exercice, numero, titre, balance, "14");
            case 17 -> filtre(exercice, numero, titre, balance, "15");
            case 18 -> filtre(exercice, numero, titre, balance, "19");
            case 19 -> filtre(exercice, numero, titre, balance, "16", "17");
            case 20 -> filtre(exercice, numero, titre, balance, "40");
            case 21 -> filtre(exercice, numero, titre, balance, "42", "43", "44");
            case 22 -> filtre(exercice, numero, titre, balance, "46", "47", "48");
            case 24 -> filtre(exercice, numero, titre, balance, "70", "71", "72", "73", "74", "75");
            case 25 -> filtre(exercice, numero, titre, balance, "60", "61", "62", "63", "64", "65");
            case 26 -> filtre(exercice, numero, titre, balance, "66");
            case 27 -> filtre(exercice, numero, titre, balance, "67");
            case 28 -> filtre(exercice, numero, titre, balance, "68", "69");
            case 29 -> filtre(exercice, numero, titre, balance, "78", "79");
            case 30 -> filtre(exercice, numero, titre, balance, "81", "82", "83", "84", "85", "86", "87", "88");
            case 31 -> tftToNote(exercice, titre, etatSvc.getFluxTresorerie(entrepriseId, exercice));
            case 32 -> filtre(exercice, numero, titre, balance, "89");
            case 33 -> filtre(exercice, numero, titre, balance, "465");
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Note " + numero + " n'est pas de type CALCULEE.");
        };
    }

    // ─── Helper : filtre balance par préfixe ─────────────────────────────────

    private NoteCatalogueDto.NoteCalculee filtre(int exercice, int numero, String titre,
                                                  List<Object[]> allRows, String... prefixes) {
        BigDecimal ZERO = BigDecimal.ZERO;
        List<NoteCatalogueDto.Ligne> lignes = new ArrayList<>();
        BigDecimal totD = ZERO, totC = ZERO;

        for (Object[] r : allRows) {
            String num = (String) r[0];
            String lib = (String) r[1];
            BigDecimal d = (BigDecimal) r[3];
            BigDecimal c = (BigDecimal) r[4];

            boolean match = false;
            for (String p : prefixes) {
                if (num.startsWith(p)) { match = true; break; }
            }
            if (!match) continue;
            if (d.compareTo(ZERO) == 0 && c.compareTo(ZERO) == 0) continue;

            lignes.add(new NoteCatalogueDto.Ligne(num, lib, d, c, d.subtract(c)));
            totD = totD.add(d);
            totC = totC.add(c);
        }

        return new NoteCatalogueDto.NoteCalculee(numero, titre, lignes, totD, totC, totD.subtract(totC), null);
    }

    // ─── Conversion EVCAP → NoteCalculee ─────────────────────────────────────

    private NoteCatalogueDto.NoteCalculee evcapToNote(int exercice, String titre, EvcapDto.Response evcap) {
        List<NoteCatalogueDto.Ligne> lignes = evcap.lignes().stream()
            .map(l -> new NoteCatalogueDto.Ligne(
                l.numero(), l.intitule(),
                l.diminutions(),    // débits = diminutions
                l.augmentations(),  // crédits = augmentations
                l.soldeFin()
            )).toList();

        String remarque = String.format(
            "Solde d'ouverture (cumul au 31/12/%d) : %s", exercice - 1, evcap.totalDebut());
        return new NoteCatalogueDto.NoteCalculee(15, titre, lignes,
            evcap.totalDiminutions(), evcap.totalAugmentations(), evcap.totalFin(), remarque);
    }

    // ─── Conversion TFT → NoteCalculee ───────────────────────────────────────

    private NoteCatalogueDto.NoteCalculee tftToNote(int exercice, String titre, FluxTresorerieDto.Response tft) {
        BigDecimal ZERO = BigDecimal.ZERO;
        List<NoteCatalogueDto.Ligne> lignes = new ArrayList<>();

        addSection(lignes, tft.operationnel());
        addSection(lignes, tft.investissement());
        addSection(lignes, tft.financement());

        // Synthèse
        lignes.add(new NoteCatalogueDto.Ligne("", "── Variation nette de trésorerie", ZERO, ZERO, tft.variationNette()));
        lignes.add(new NoteCatalogueDto.Ligne("", "Trésorerie d'ouverture (N-1)", ZERO, ZERO, tft.tresorerieOuverture()));
        lignes.add(new NoteCatalogueDto.Ligne("", "Trésorerie de clôture (N)", ZERO, ZERO, tft.tresorerieCloture()));

        return new NoteCatalogueDto.NoteCalculee(31, titre, lignes, ZERO, ZERO, tft.variationNette(),
            "Méthode indirecte — SYSCOHADA Système Normal");
    }

    private void addSection(List<NoteCatalogueDto.Ligne> lignes, FluxTresorerieDto.Section section) {
        BigDecimal ZERO = BigDecimal.ZERO;
        lignes.add(new NoteCatalogueDto.Ligne("", "▸ " + section.titre(), ZERO, ZERO, section.total()));
        for (FluxTresorerieDto.Ligne l : section.lignes()) {
            if (l.montant().compareTo(ZERO) == 0) continue;
            lignes.add(new NoteCatalogueDto.Ligne("", "  " + l.libelle(), ZERO, ZERO, l.montant()));
        }
    }
}
