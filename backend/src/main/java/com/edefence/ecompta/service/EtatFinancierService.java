package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.EcritureComptable;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.LigneEcriture;
import com.edefence.ecompta.domain.NoteAnnexe;
import com.edefence.ecompta.dto.etats.*;
import com.edefence.ecompta.dto.etats.EtatsDepuisBalanceDto;
import com.edefence.ecompta.repository.EcritureComptableRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import com.edefence.ecompta.repository.NoteAnnexeRepository;
import com.edefence.ecompta.util.ReferentielMapping;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EtatFinancierService {

    private final LigneEcritureRepository ligneRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final NoteAnnexeRepository noteRepo;
    private final EntrepriseRepository entrepriseRepo;

    // ─── Balance ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BalanceDto getBalance(UUID entrepriseId, int exercice) {
        List<Object[]> rows = ligneRepo.balanceParCompte(entrepriseId, debut(exercice), fin(exercice));
        List<BalanceDto.Ligne> lignes = new ArrayList<>();
        BigDecimal totD = BigDecimal.ZERO, totC = BigDecimal.ZERO;
        for (Object[] r : rows) {
            String numero    = (String) r[0];
            String intitule  = (String) r[1];
            int classe       = ((Number) r[2]).intValue();
            BigDecimal d     = (BigDecimal) r[3];
            BigDecimal c     = (BigDecimal) r[4];
            BigDecimal solD  = d.compareTo(c) > 0 ? d.subtract(c) : BigDecimal.ZERO;
            BigDecimal solC  = c.compareTo(d) > 0 ? c.subtract(d) : BigDecimal.ZERO;
            lignes.add(new BalanceDto.Ligne(numero, intitule, classe, d, c, solD, solC));
            totD = totD.add(d);
            totC = totC.add(c);
        }
        return new BalanceDto(exercice, lignes, totD, totC);
    }

    // ─── Bilan (Système Normal) ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BilanDto getBilan(UUID entrepriseId, int exercice) {
        BalanceDto balance = getBalance(entrepriseId, exercice);
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise not found"));
        return computeBilan(balance, entreprise.getReferentielComptable());
    }

    private BilanDto computeBilan(BalanceDto balance, String referentiel) {
        ReferentielMapping.BilanRubrique r = ReferentielMapping.getRubriques(referentiel);
        List<BilanDto.Poste> actif  = new ArrayList<>();
        List<BilanDto.Poste> passif = new ArrayList<>();

        for (BalanceDto.Ligne l : balance.lignes()) {
            if (l.classe() == 2) {
                BigDecimal montant = l.soldeDebiteur().subtract(l.soldeCrediteur());
                if (montant.compareTo(BigDecimal.ZERO) != 0)
                    actif.add(new BilanDto.Poste(r.actifImmobilise(), l.numero(), l.intitule(), montant));
            } else if (l.classe() == 3) {
                BigDecimal montant = l.soldeDebiteur().subtract(l.soldeCrediteur());
                if (montant.compareTo(BigDecimal.ZERO) != 0)
                    actif.add(new BilanDto.Poste(r.stocks(), l.numero(), l.intitule(), montant));
            } else if (l.classe() == 1) {
                BigDecimal montant = l.soldeCrediteur().subtract(l.soldeDebiteur());
                if (montant.compareTo(BigDecimal.ZERO) != 0)
                    passif.add(new BilanDto.Poste(r.ressourcesDurables(), l.numero(), l.intitule(), montant));
            } else if (l.classe() == 4) {
                if (l.soldeDebiteur().compareTo(BigDecimal.ZERO) > 0)
                    actif.add(new BilanDto.Poste(r.creances(), l.numero(), l.intitule(), l.soldeDebiteur()));
                if (l.soldeCrediteur().compareTo(BigDecimal.ZERO) > 0)
                    passif.add(new BilanDto.Poste(r.dettesCirculantes(), l.numero(), l.intitule(), l.soldeCrediteur()));
            } else if (l.classe() == 5) {
                if (l.soldeDebiteur().compareTo(BigDecimal.ZERO) > 0)
                    actif.add(new BilanDto.Poste(r.tresorerieActif(), l.numero(), l.intitule(), l.soldeDebiteur()));
                if (l.soldeCrediteur().compareTo(BigDecimal.ZERO) > 0)
                    passif.add(new BilanDto.Poste(r.tresoreriePassif(), l.numero(), l.intitule(), l.soldeCrediteur()));
            }
        }

        BigDecimal totActif  = actif.stream().map(BilanDto.Poste::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totPassif = passif.stream().map(BilanDto.Poste::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new BilanDto(balance.exercice(), actif, passif, totActif, totPassif);
    }

    // ─── Compte de résultat (SN) ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CompteResultatDto getCompteResultat(UUID entrepriseId, int exercice) {
        return computeCompteResultat(getBalance(entrepriseId, exercice));
    }

    private CompteResultatDto computeCompteResultat(BalanceDto balance) {
        List<CompteResultatDto.Poste> charges  = new ArrayList<>();
        List<CompteResultatDto.Poste> produits = new ArrayList<>();

        for (BalanceDto.Ligne l : balance.lignes()) {
            if (l.classe() == 6) {
                BigDecimal montant = l.totalDebit().subtract(l.totalCredit());
                if (montant.compareTo(BigDecimal.ZERO) > 0)
                    charges.add(new CompteResultatDto.Poste(l.numero(), l.intitule(), montant));
            } else if (l.classe() == 7) {
                BigDecimal montant = l.totalCredit().subtract(l.totalDebit());
                if (montant.compareTo(BigDecimal.ZERO) > 0)
                    produits.add(new CompteResultatDto.Poste(l.numero(), l.intitule(), montant));
            }
        }

        BigDecimal totCharges  = charges.stream().map(CompteResultatDto.Poste::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totProduits = produits.stream().map(CompteResultatDto.Poste::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal resultat    = totProduits.subtract(totCharges);
        return new CompteResultatDto(balance.exercice(), charges, produits, totCharges, totProduits, resultat);
    }

    // ─── Grand Livre ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public GrandLivreDto getGrandLivre(UUID entrepriseId, int exercice, String compteNumero) {
        List<Object[]> rows = ligneRepo.grandLivreParCompte(entrepriseId, compteNumero, debut(exercice), fin(exercice));
        if (rows.isEmpty())
            return new GrandLivreDto(exercice, compteNumero, "", List.of(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO);

        List<GrandLivreDto.Mouvement> mouvements = new ArrayList<>();
        BigDecimal solde = BigDecimal.ZERO;
        BigDecimal totD  = BigDecimal.ZERO;
        BigDecimal totC  = BigDecimal.ZERO;
        String intitule  = "";

        for (Object[] r : rows) {
            LocalDate date           = (LocalDate) r[0];
            String numeroPiece       = (String) r[1];
            String libelle           = (String) r[2];
            EcritureComptable.Journal journal = (EcritureComptable.Journal) r[3];
            BigDecimal debit         = (BigDecimal) r[4];
            BigDecimal credit        = (BigDecimal) r[5];
            solde = solde.add(debit).subtract(credit);
            totD  = totD.add(debit);
            totC  = totC.add(credit);
            mouvements.add(new GrandLivreDto.Mouvement(date, numeroPiece, libelle, journal, debit, credit, solde));
        }

        // Retrieve intitule from first row's compte
        List<Object[]> balRows = ligneRepo.balanceParCompte(entrepriseId, debut(exercice), fin(exercice));
        intitule = balRows.stream()
                .filter(r -> compteNumero.equals(r[0]))
                .map(r -> (String) r[1])
                .findFirst().orElse("");

        return new GrandLivreDto(exercice, compteNumero, intitule, mouvements, totD, totC, solde);
    }

    // ─── Journal livre ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public JournalLivreDto getJournal(UUID entrepriseId, int exercice) {
        List<EcritureComptable> ecritures = ecritureRepo.findValideesByPeriod(entrepriseId, debut(exercice), fin(exercice));
        List<JournalLivreDto.EcritureResume> resumes = ecritures.stream().map(e -> {
            List<JournalLivreDto.LigneResume> lignes = e.getLignes().stream()
                    .map(l -> new JournalLivreDto.LigneResume(
                            l.getCompte().getNumero(), l.getCompte().getIntitule(),
                            l.getDebit(), l.getCredit()))
                    .toList();
            BigDecimal d = e.getLignes().stream().map(LigneEcriture::getDebit).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal c = e.getLignes().stream().map(LigneEcriture::getCredit).reduce(BigDecimal.ZERO, BigDecimal::add);
            return new JournalLivreDto.EcritureResume(e.getId(), e.getNumeroPiece(), e.getDateEcriture(),
                    e.getLibelle(), e.getJournal(), lignes, d, c);
        }).toList();
        return new JournalLivreDto(exercice, resumes);
    }

    // ─── SMT – État de Situation du Patrimoine (ESP) ─────────────────────────

    @Transactional(readOnly = true)
    public SmtDto.EtatSituationPatrimoine getEsp(UUID entrepriseId, int exercice) {
        BalanceDto balance = getBalance(entrepriseId, exercice);
        List<SmtDto.EtatSituationPatrimoine.PosteEsp> actif  = new ArrayList<>();
        List<SmtDto.EtatSituationPatrimoine.PosteEsp> passif = new ArrayList<>();
        BigDecimal ZERO = BigDecimal.ZERO;

        for (BalanceDto.Ligne l : balance.lignes()) {
            String num = l.numero();
            int cl = l.classe();

            BigDecimal solD = l.soldeDebiteur();
            BigDecimal solC = l.soldeCrediteur();

            if (cl == 2) {
                if (solD.compareTo(ZERO) > 0)
                    actif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("ACTIF IMMOBILISÉ", num, l.intitule(), solD));
            } else if (cl == 3) {
                if (solD.compareTo(ZERO) > 0)
                    actif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("STOCKS", num, l.intitule(), solD));
            } else if (cl == 4) {
                if (solD.compareTo(ZERO) > 0)
                    actif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("CRÉANCES", num, l.intitule(), solD));
                if (solC.compareTo(ZERO) > 0)
                    passif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("DETTES CIRCULANTES", num, l.intitule(), solC));
            } else if (cl == 5) {
                if (solD.compareTo(ZERO) > 0)
                    actif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("TRÉSORERIE ACTIVE", num, l.intitule(), solD));
                if (solC.compareTo(ZERO) > 0)
                    passif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("TRÉSORERIE PASSIVE", num, l.intitule(), solC));
            } else if (cl == 1) {
                try {
                    int sub2 = Integer.parseInt(num.length() >= 2 ? num.substring(0, 2) : num);
                    if (sub2 >= 10 && sub2 <= 15) {
                        // Capitaux propres : solde créditeur = ressource
                        if (solC.compareTo(ZERO) > 0)
                            passif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("CAPITAUX PROPRES", num, l.intitule(), solC));
                        else if (solD.compareTo(ZERO) > 0)
                            actif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("CAPITAUX PROPRES (déficit)", num, l.intitule(), solD.negate()));
                    } else {
                        if (solC.compareTo(ZERO) > 0)
                            passif.add(new SmtDto.EtatSituationPatrimoine.PosteEsp("EMPRUNTS ET DETTES FINANCIÈRES", num, l.intitule(), solC));
                    }
                } catch (NumberFormatException ignored) {}
            }
        }

        BigDecimal totActif  = actif.stream().map(p -> p.montant().abs()).reduce(ZERO, BigDecimal::add);
        BigDecimal totPassif = passif.stream().map(SmtDto.EtatSituationPatrimoine.PosteEsp::montant).reduce(ZERO, BigDecimal::add);
        return new SmtDto.EtatSituationPatrimoine(exercice, actif, passif, totActif, totPassif);
    }

    // ─── SMT – État des recettes et dépenses ─────────────────────────────────

    @Transactional(readOnly = true)
    public SmtDto.EtatRecettesDepenses getEtatRecettesDepenses(UUID entrepriseId, int exercice) {
        BalanceDto balance = getBalance(entrepriseId, exercice);
        List<SmtDto.EtatRecettesDepenses.Poste> recettes  = new ArrayList<>();
        List<SmtDto.EtatRecettesDepenses.Poste> depenses  = new ArrayList<>();

        for (BalanceDto.Ligne l : balance.lignes()) {
            if (l.classe() == 7) {
                BigDecimal montant = l.totalCredit().subtract(l.totalDebit());
                if (montant.compareTo(BigDecimal.ZERO) > 0)
                    recettes.add(new SmtDto.EtatRecettesDepenses.Poste(l.numero(), l.intitule(), montant));
            } else if (l.classe() == 6) {
                BigDecimal montant = l.totalDebit().subtract(l.totalCredit());
                if (montant.compareTo(BigDecimal.ZERO) > 0)
                    depenses.add(new SmtDto.EtatRecettesDepenses.Poste(l.numero(), l.intitule(), montant));
            }
        }

        BigDecimal totR = recettes.stream().map(SmtDto.EtatRecettesDepenses.Poste::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totD = depenses.stream().map(SmtDto.EtatRecettesDepenses.Poste::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new SmtDto.EtatRecettesDepenses(exercice, recettes, depenses, totR, totD, totR.subtract(totD));
    }

    // ─── SMT – État de trésorerie ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SmtDto.EtatTresorerie getEtatTresorerie(UUID entrepriseId, int exercice) {
        BalanceDto balance = getBalance(entrepriseId, exercice);
        List<SmtDto.EtatTresorerie.MouvementCompte> comptes = new ArrayList<>();

        for (BalanceDto.Ligne l : balance.lignes()) {
            if (l.classe() == 5) {
                BigDecimal solde = l.totalDebit().subtract(l.totalCredit());
                comptes.add(new SmtDto.EtatTresorerie.MouvementCompte(
                        l.numero(), l.intitule(), l.totalDebit(), l.totalCredit(), solde));
            }
        }

        BigDecimal totEntrees = comptes.stream().map(SmtDto.EtatTresorerie.MouvementCompte::entrees).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totSorties = comptes.stream().map(SmtDto.EtatTresorerie.MouvementCompte::sorties).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new SmtDto.EtatTresorerie(exercice, comptes, totEntrees, totSorties, totEntrees.subtract(totSorties));
    }

    // ─── Notes annexes ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<NoteAnnexeDto.Response> getNotes(UUID entrepriseId, int exercice) {
        return noteRepo.findByEntrepriseIdAndExerciceOrderByOrdreAscCreatedAtAsc(entrepriseId, exercice)
                .stream().map(this::toNoteResponse).toList();
    }

    @Transactional
    public NoteAnnexeDto.Response createNote(UUID entrepriseId, NoteAnnexeDto.CreateRequest req) {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise not found"));
        NoteAnnexe note = NoteAnnexe.builder()
                .entreprise(entreprise)
                .exercice(req.exercice())
                .numeroNote(req.numeroNote())
                .titre(req.titre())
                .contenu(req.contenu())
                .ordre(req.ordre())
                .build();
        return toNoteResponse(noteRepo.save(note));
    }

    @Transactional
    public NoteAnnexeDto.Response updateNote(UUID entrepriseId, UUID noteId, NoteAnnexeDto.UpdateRequest req) {
        NoteAnnexe note = noteRepo.findByIdAndEntrepriseId(noteId, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Note not found"));
        if (req.titre()  != null) note.setTitre(req.titre());
        if (req.contenu() != null) note.setContenu(req.contenu());
        if (req.ordre()   != null) note.setOrdre(req.ordre());
        return toNoteResponse(noteRepo.save(note));
    }

    @Transactional
    public void deleteNote(UUID entrepriseId, UUID noteId) {
        int deleted = noteRepo.deleteByIdAndEntrepriseId(noteId, entrepriseId);
        if (deleted == 0) throw new EntityNotFoundException("Note not found");
    }

    // ─── Tableau des Flux de Trésorerie (méthode indirecte) ─────────────────

    @Transactional(readOnly = true)
    public FluxTresorerieDto.Response getFluxTresorerie(UUID entrepriseId, int exercice) {
        BalanceDto balance = getBalance(entrepriseId, exercice);

        // ── A. Activités opérationnelles ────────────────────────────────────
        BigDecimal produits = balance.lignes().stream()
            .filter(l -> l.numero().startsWith("7"))
            .map(l -> l.totalCredit().subtract(l.totalDebit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal charges = balance.lignes().stream()
            .filter(l -> l.numero().startsWith("6"))
            .map(l -> l.totalDebit().subtract(l.totalCredit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal resultatNet = produits.subtract(charges);

        // Add back non-cash items: dotations(68x) + reprises(78x)
        // reprises(78x) has net credit → sumNets("78") < 0 → adds negatively, removing non-cash income
        BigDecimal dotations = netDebit(balance, "68");
        BigDecimal reprises  = netDebit(balance, "78");

        // Working capital adjustments: Δ = -(net debit movement) for each group
        BigDecimal varStocks       = netDebit(balance, "3").negate();
        BigDecimal varClients      = netDebit(balance, "41").negate();
        BigDecimal varFournisseurs = netDebit(balance, "40").negate();
        BigDecimal varAutres       = netDebit(balance, "44", "45", "47", "48").negate();

        BigDecimal totalA = resultatNet.add(dotations).add(reprises)
            .add(varStocks).add(varClients).add(varFournisseurs).add(varAutres);

        List<FluxTresorerieDto.Ligne> lignesA = List.of(
            new FluxTresorerieDto.Ligne("Résultat net de l'exercice",                    resultatNet),
            new FluxTresorerieDto.Ligne("+ Dotations aux amortissements / provisions (68x)", dotations),
            new FluxTresorerieDto.Ligne("- Reprises sur provisions (78x)",               reprises.negate()),
            new FluxTresorerieDto.Ligne("Variation des stocks (3x)",                     varStocks),
            new FluxTresorerieDto.Ligne("Variation des créances clients (41x)",          varClients),
            new FluxTresorerieDto.Ligne("Variation des dettes fournisseurs (40x)",       varFournisseurs),
            new FluxTresorerieDto.Ligne("Variation autres créances / dettes (44x-48x)", varAutres)
        );

        // ── B. Activités d'investissement ───────────────────────────────────
        BigDecimal mouvImmos = BigDecimal.ZERO;
        for (BalanceDto.Ligne l : balance.lignes()) {
            String n = l.numero();
            if (n.startsWith("2") && !n.startsWith("28") && !n.startsWith("29")) {
                mouvImmos = mouvImmos.add(l.totalDebit().subtract(l.totalCredit()));
            }
        }
        BigDecimal totalB = mouvImmos.negate(); // net debit = acquisitions outflow → negative CF

        List<FluxTresorerieDto.Ligne> lignesB = List.of(
            new FluxTresorerieDto.Ligne("Acquisitions nettes d'immobilisations (2x)", totalB)
        );

        // ── C. Activités de financement ─────────────────────────────────────
        BigDecimal emprunts    = netDebit(balance, "16").negate(); // net credit = new loans
        BigDecimal augCapital  = netDebit(balance, "10", "11").negate(); // net credit = capital
        BigDecimal dividendes  = netDebit(balance, "465");        // net debit = dividends out
        BigDecimal totalC      = emprunts.add(augCapital).subtract(dividendes);

        List<FluxTresorerieDto.Ligne> lignesC = List.of(
            new FluxTresorerieDto.Ligne("Variation nette des emprunts (16x)",       emprunts),
            new FluxTresorerieDto.Ligne("Augmentation de capital (10x-11x)",        augCapital),
            new FluxTresorerieDto.Ligne("Dividendes versés (465x)",                 dividendes.negate())
        );

        // ── Trésorerie clôture (soldes 51x+52x+53x+57x) ─────────────────────
        BigDecimal tresorerieCloture = BigDecimal.ZERO;
        for (BalanceDto.Ligne l : balance.lignes()) {
            String n = l.numero();
            if (n.startsWith("51") || n.startsWith("52")
                    || n.startsWith("53") || n.startsWith("57")) {
                tresorerieCloture = tresorerieCloture.add(
                    l.totalDebit().subtract(l.totalCredit()));
            }
        }
        BigDecimal variationNette = totalA.add(totalB).add(totalC);

        return new FluxTresorerieDto.Response(
            exercice,
            new FluxTresorerieDto.Section("A. Flux des activités opérationnelles",  "A", lignesA, totalA),
            new FluxTresorerieDto.Section("B. Flux des activités d'investissement", "B", lignesB, totalB),
            new FluxTresorerieDto.Section("C. Flux des activités de financement",   "C", lignesC, totalC),
            variationNette,
            BigDecimal.ZERO,    // ouverture non disponible sans données comparatives N-1
            tresorerieCloture
        );
    }

    // ─── EVCAP (État de Variation des Capitaux Propres) ──────────────────────

    @Transactional(readOnly = true)
    public EvcapDto.Response getEvcap(UUID entrepriseId, int exercice) {
        LocalDate origin = LocalDate.of(2000, 1, 1);
        LocalDate endN1  = LocalDate.of(exercice - 1, 12, 31);
        LocalDate startN = debut(exercice);
        LocalDate endN   = fin(exercice);

        List<Object[]> histRows = ligneRepo.balanceParCompte(entrepriseId, origin, endN1);
        List<Object[]> mouvRows = ligneRepo.balanceParCompte(entrepriseId, startN, endN);

        record DS(BigDecimal d, BigDecimal c, String lib) {}
        Map<String, DS> hist = new LinkedHashMap<>();
        Map<String, DS> mouv = new LinkedHashMap<>();

        for (Object[] r : histRows) {
            String num = (String) r[0];
            if (!isEquityAccount(num)) continue;
            hist.put(num, new DS((BigDecimal) r[3], (BigDecimal) r[4], (String) r[1]));
        }
        for (Object[] r : mouvRows) {
            String num = (String) r[0];
            if (!isEquityAccount(num)) continue;
            mouv.put(num, new DS((BigDecimal) r[3], (BigDecimal) r[4], (String) r[1]));
        }

        Set<String> all = new TreeSet<>();
        all.addAll(hist.keySet());
        all.addAll(mouv.keySet());

        List<EvcapDto.Ligne> lignes = new ArrayList<>();
        BigDecimal ZERO = BigDecimal.ZERO;
        BigDecimal totDebut = ZERO, totAug = ZERO, totDim = ZERO, totFin = ZERO;

        for (String num : all) {
            DS h = hist.getOrDefault(num, new DS(ZERO, ZERO, ""));
            DS m = mouv.getOrDefault(num, new DS(ZERO, ZERO, ""));
            String lib = !h.lib().isEmpty() ? h.lib() : m.lib();

            BigDecimal soldeDebut = h.c().subtract(h.d());
            BigDecimal aug        = m.c();
            BigDecimal dim        = m.d();
            BigDecimal soldeFin   = soldeDebut.add(aug).subtract(dim);

            if (soldeDebut.compareTo(ZERO) == 0 && aug.compareTo(ZERO) == 0 && dim.compareTo(ZERO) == 0) continue;

            lignes.add(new EvcapDto.Ligne(num, lib, soldeDebut, aug, dim, soldeFin));
            totDebut = totDebut.add(soldeDebut);
            totAug   = totAug.add(aug);
            totDim   = totDim.add(dim);
            totFin   = totFin.add(soldeFin);
        }

        return new EvcapDto.Response(exercice, lignes, totDebut, totAug, totDim, totFin);
    }

    private static boolean isEquityAccount(String num) {
        if (!num.startsWith("1") || num.length() < 2) return false;
        try {
            int sub = Integer.parseInt(num.substring(0, 2));
            return sub >= 10 && sub <= 15;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private BigDecimal netDebit(BalanceDto balance, String... prefixes) {
        return balance.lignes().stream()
            .filter(l -> {
                String n = l.numero();
                for (String p : prefixes) { if (n.startsWith(p)) return true; }
                return false;
            })
            .map(l -> l.totalDebit().subtract(l.totalCredit()))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static LocalDate debut(int exercice) { return LocalDate.of(exercice, 1, 1); }
    private static LocalDate fin(int exercice)   { return LocalDate.of(exercice, 12, 31); }

    // ─── Import balance externe → génération états financiers ────────────────

    @Transactional(readOnly = true)
    public EtatsDepuisBalanceDto genererDepuisBalance(UUID entrepriseId, MultipartFile file,
                                                       int exercice) throws IOException {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise not found"));
        String referentiel = entreprise.getReferentielComptable();

        BalanceDto balance       = parseCsvBalance(file, exercice);
        BilanDto bilan           = computeBilan(balance, referentiel);
        CompteResultatDto cr     = computeCompteResultat(balance);

        return new EtatsDepuisBalanceDto(referentiel, balance.lignes().size(), balance, bilan, cr);
    }

    // ─── Import balance externe à 6 colonnes ─────────────────────────────────

    @Transactional(readOnly = true)
    public BalanceSixColonnesDto genererDepuisBalance6Col(UUID entrepriseId, MultipartFile file,
                                                          int exercice) throws IOException {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise not found"));
        String referentiel = entreprise.getReferentielComptable();

        BalanceSixColonnesDto.Ligne[] parsed = parseCsv6Col(file, exercice);
        List<BalanceSixColonnesDto.Ligne> lignes = java.util.Arrays.asList(parsed);

        BigDecimal ZERO = BigDecimal.ZERO;
        BigDecimal totSolAntD = ZERO, totSolAntC = ZERO;
        BigDecimal totMvtD = ZERO,    totMvtC = ZERO;
        BigDecimal totSolFinD = ZERO, totSolFinC = ZERO;
        for (BalanceSixColonnesDto.Ligne l : lignes) {
            totSolAntD = totSolAntD.add(l.solAntD());
            totSolAntC = totSolAntC.add(l.solAntC());
            totMvtD    = totMvtD.add(l.mvtD());
            totMvtC    = totMvtC.add(l.mvtC());
            totSolFinD = totSolFinD.add(l.solFinD());
            totSolFinC = totSolFinC.add(l.solFinC());
        }

        // Derive bilan and CR from soldes finaux
        List<BalanceDto.Ligne> balanceLignes = lignes.stream().map(l -> {
            int cl = l.numero().isEmpty() ? 0 : Character.getNumericValue(l.numero().charAt(0));
            BigDecimal d = l.solFinD(), c = l.solFinC();
            return new BalanceDto.Ligne(l.numero(), l.intitule(), cl, d, c,
                    d.compareTo(c) > 0 ? d.subtract(c) : ZERO,
                    c.compareTo(d) > 0 ? c.subtract(d) : ZERO);
        }).toList();
        BalanceDto syntheticBalance = new BalanceDto(exercice, balanceLignes, totSolFinD, totSolFinC);
        BilanDto bilan           = computeBilan(syntheticBalance, referentiel);
        CompteResultatDto cr     = computeCompteResultat(syntheticBalance);

        return new BalanceSixColonnesDto(exercice, referentiel, lignes.size(), lignes,
                totSolAntD, totSolAntC, totMvtD, totMvtC, totSolFinD, totSolFinC, bilan, cr);
    }

    private BalanceSixColonnesDto.Ligne[] parseCsv6Col(MultipartFile file, int exercice) throws IOException {
        byte[] bytes = file.getBytes();
        String raw   = new String(bytes, StandardCharsets.UTF_8);
        if (raw.startsWith("﻿")) raw = raw.substring(1);

        String[] lines = raw.split("\\r?\\n");
        if (lines.length < 2)
            throw new IllegalArgumentException("Fichier vide ou invalide.");

        String sep   = detectSep(lines[0]);
        String[] hdr = lines[0].split(sep, -1);

        int iNum    = findCol(hdr, "NUMERO","COMPTE","N_COMPTE","CODE","N°","COMPTES");
        int iLib    = findCol(hdr, "INTITULE","LIBELLE","DESIGNATION","NOM","LIBELLÉ");
        int iSolAntD= findCol(hdr, "SOL_ANT_D","SOLANT_D","SOLDE_ANT_D","SOLD_ANT_D","ANT_D","ANTERIEUR_D","DEBIT_ANT","S_ANT_D","SOLDANT_D","SOLD_ANT_DEBIT");
        int iSolAntC= findCol(hdr, "SOL_ANT_C","SOLANT_C","SOLDE_ANT_C","SOLD_ANT_C","ANT_C","ANTERIEUR_C","CREDIT_ANT","S_ANT_C","SOLDANT_C","SOLD_ANT_CREDIT");
        int iMvtD   = findCol(hdr, "MVT_D","MVTS_D","MVT_DEBIT","MOUVEMENTS_D","DEBIT_MVT","MOUVEMENT_D","DEBIT","TOTAL_DEBIT");
        int iMvtC   = findCol(hdr, "MVT_C","MVTS_C","MVT_CREDIT","MOUVEMENTS_C","CREDIT_MVT","MOUVEMENT_C","CREDIT","TOTAL_CREDIT");
        int iSolFinD= findCol(hdr, "SOL_FIN_D","SOLFIN_D","SOLDE_FIN_D","SOLDE_D","FIN_D","FINAL_D","SFIN_D","SOLDEFINITIF_D","SOLDE_FINAL_D");
        int iSolFinC= findCol(hdr, "SOL_FIN_C","SOLFIN_C","SOLDE_FIN_C","SOLDE_C","FIN_C","FINAL_C","SFIN_C","SOLDEFINITIF_C","SOLDE_FINAL_C");

        if (iNum < 0 || iMvtD < 0 || iMvtC < 0)
            throw new IllegalArgumentException(
                "Colonnes requises manquantes. Format attendu : NUMERO;INTITULE;SOL_ANT_D;SOL_ANT_C;MVT_D;MVT_C;SOL_FIN_D;SOL_FIN_C");

        List<BalanceSixColonnesDto.Ligne> result = new ArrayList<>();
        BigDecimal ZERO = BigDecimal.ZERO;

        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            String[] cols = line.split(sep, -1);

            String numero   = safeGet(cols, iNum).replaceAll("^\"|\"$","").trim();
            if (numero.isEmpty()) continue;
            String intitule = iLib >= 0 ? safeGet(cols, iLib).replaceAll("^\"|\"$","").trim() : "";

            BigDecimal solAntD = iSolAntD >= 0 ? parseMontant(safeGet(cols, iSolAntD)) : ZERO;
            BigDecimal solAntC = iSolAntC >= 0 ? parseMontant(safeGet(cols, iSolAntC)) : ZERO;
            BigDecimal mvtD    = parseMontant(safeGet(cols, iMvtD));
            BigDecimal mvtC    = parseMontant(safeGet(cols, iMvtC));
            BigDecimal solFinD, solFinC;
            if (iSolFinD >= 0 && iSolFinC >= 0) {
                solFinD = parseMontant(safeGet(cols, iSolFinD));
                solFinC = parseMontant(safeGet(cols, iSolFinC));
            } else {
                // Compute from ant + mvt
                BigDecimal net = solAntD.subtract(solAntC).add(mvtD).subtract(mvtC);
                solFinD = net.compareTo(ZERO) > 0 ? net : ZERO;
                solFinC = net.compareTo(ZERO) < 0 ? net.negate() : ZERO;
            }
            result.add(new BalanceSixColonnesDto.Ligne(numero, intitule, solAntD, solAntC, mvtD, mvtC, solFinD, solFinC));
        }

        if (result.isEmpty())
            throw new IllegalArgumentException("Aucune ligne valide trouvée dans le fichier.");

        return result.toArray(new BalanceSixColonnesDto.Ligne[0]);
    }

    private BalanceDto parseCsvBalance(MultipartFile file, int exercice) throws IOException {
        byte[] bytes = file.getBytes();
        String raw = new String(bytes, StandardCharsets.UTF_8);
        // Strip BOM
        if (raw.startsWith("﻿")) raw = raw.substring(1);

        String[] lines = raw.split("\\r?\\n");
        if (lines.length < 2)
            throw new IllegalArgumentException("Fichier vide ou invalide — au moins une ligne d'en-tête et une ligne de données attendues.");

        String sep     = detectSep(lines[0]);
        String[] heads = lines[0].split(sep, -1);

        int iNum  = findCol(heads, "NUMERO","COMPTE","N_COMPTE","CODE","N°");
        int iLib  = findCol(heads, "INTITULE","LIBELLE","DESIGNATION","NOM");
        int iCl   = findCol(heads, "CLASSE","CL");
        int iDeb  = findCol(heads, "DEBIT","DEBIT_TOTAL","TOTAL_DEBIT","MVT_DEBIT","MOUVEMENTS_DEBIT","SOLDE_DEBITEUR","D");
        int iCre  = findCol(heads, "CREDIT","CREDIT_TOTAL","TOTAL_CREDIT","MVT_CREDIT","MOUVEMENTS_CREDIT","SOLDE_CREDITEUR","C");

        if (iNum < 0 || iDeb < 0 || iCre < 0)
            throw new IllegalArgumentException(
                "Colonnes requises manquantes. Format attendu : NUMERO;INTITULE;DEBIT;CREDIT (séparateur ; , ou tabulation).");

        List<BalanceDto.Ligne> lignes = new ArrayList<>();
        BigDecimal totD = BigDecimal.ZERO, totC = BigDecimal.ZERO;

        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) continue;
            String[] cols = line.split(sep, -1);

            String numero = safeGet(cols, iNum).replaceAll("^\"|\"$", "").trim();
            if (numero.isEmpty()) continue;

            String intitule = iLib >= 0 ? safeGet(cols, iLib).replaceAll("^\"|\"$", "").trim() : "";
            int    classe;
            if (iCl >= 0 && !safeGet(cols, iCl).isBlank()) {
                try { classe = Integer.parseInt(safeGet(cols, iCl).trim()); }
                catch (NumberFormatException e) { classe = charToDigit(numero); }
            } else { classe = charToDigit(numero); }

            BigDecimal d = parseMontant(safeGet(cols, iDeb));
            BigDecimal c = parseMontant(safeGet(cols, iCre));
            BigDecimal solD = d.compareTo(c) > 0 ? d.subtract(c) : BigDecimal.ZERO;
            BigDecimal solC = c.compareTo(d) > 0 ? c.subtract(d) : BigDecimal.ZERO;

            lignes.add(new BalanceDto.Ligne(numero, intitule, classe, d, c, solD, solC));
            totD = totD.add(d);
            totC = totC.add(c);
        }

        if (lignes.isEmpty())
            throw new IllegalArgumentException("Aucune ligne de balance valide trouvée dans le fichier.");

        return new BalanceDto(exercice, lignes, totD, totC);
    }

    private static String detectSep(String firstLine) {
        long sc = firstLine.chars().filter(c -> c == ';').count();
        long cm = firstLine.chars().filter(c -> c == ',').count();
        long tb = firstLine.chars().filter(c -> c == '\t').count();
        long pi = firstLine.chars().filter(c -> c == '|').count();
        if (sc >= cm && sc >= tb && sc >= pi) return ";";
        if (cm >= tb && cm >= pi)             return ",";
        if (tb >= pi)                          return "\t";
        return "\\|";
    }

    private static int findCol(String[] headers, String... names) {
        for (int i = 0; i < headers.length; i++) {
            String h = headers[i].trim().replaceAll("^\"|\"$","").toUpperCase()
                                  .replace(" ","_").replace(".","_").replace("-","_");
            for (String name : names) {
                if (h.equals(name) || h.startsWith(name + "_") || h.startsWith(name)) return i;
            }
        }
        return -1;
    }

    private static String safeGet(String[] cols, int idx) {
        return idx >= 0 && idx < cols.length ? cols[idx] : "";
    }

    private static int charToDigit(String numero) {
        if (numero.isEmpty()) return 0;
        char c = numero.charAt(0);
        return Character.isDigit(c) ? Character.getNumericValue(c) : 0;
    }

    private static BigDecimal parseMontant(String s) {
        if (s == null) return BigDecimal.ZERO;
        s = s.trim().replaceAll("^\"|\"$","").replaceAll("\\s","");
        if (s.isEmpty() || s.equals("-") || s.equals("—")) return BigDecimal.ZERO;
        // Format européen: 1.234,56 → 1234.56
        if (s.matches(".*\\..*,.*")) s = s.replace(".","").replace(",",".");
        // Virgule décimale seule: 1234,56 → 1234.56
        else if (s.contains(",") && !s.contains(".")) s = s.replace(",",".");
        // Signe trailing: 1234- → -1234
        if (s.endsWith("-")) s = "-" + s.substring(0, s.length() - 1);
        try { return new BigDecimal(s); } catch (NumberFormatException e) { return BigDecimal.ZERO; }
    }

    private NoteAnnexeDto.Response toNoteResponse(NoteAnnexe n) {
        return new NoteAnnexeDto.Response(n.getId(), n.getExercice(), n.getNumeroNote(),
                n.getTitre(), n.getContenu(), n.getOrdre(), n.getCreatedAt(), n.getUpdatedAt());
    }
}
