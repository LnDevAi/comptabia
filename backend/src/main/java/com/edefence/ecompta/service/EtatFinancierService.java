package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.EcritureComptable;
import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.LigneEcriture;
import com.edefence.ecompta.domain.NoteAnnexe;
import com.edefence.ecompta.dto.etats.*;
import com.edefence.ecompta.repository.EcritureComptableRepository;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import com.edefence.ecompta.repository.NoteAnnexeRepository;
import com.edefence.ecompta.util.ReferentielMapping;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
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
        ReferentielMapping.BilanRubrique r =
                ReferentielMapping.getRubriques(entreprise.getReferentielComptable());

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
        return new BilanDto(exercice, actif, passif, totActif, totPassif);
    }

    // ─── Compte de résultat (SN) ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CompteResultatDto getCompteResultat(UUID entrepriseId, int exercice) {
        BalanceDto balance = getBalance(entrepriseId, exercice);
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
        return new CompteResultatDto(exercice, charges, produits, totCharges, totProduits, resultat);
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

    private NoteAnnexeDto.Response toNoteResponse(NoteAnnexe n) {
        return new NoteAnnexeDto.Response(n.getId(), n.getExercice(), n.getNumeroNote(),
                n.getTitre(), n.getContenu(), n.getOrdre(), n.getCreatedAt(), n.getUpdatedAt());
    }
}
