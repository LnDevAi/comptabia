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
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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
        List<BilanDto.Poste> actif  = new ArrayList<>();
        List<BilanDto.Poste> passif = new ArrayList<>();

        for (BalanceDto.Ligne l : balance.lignes()) {
            if (l.classe() == 2 || l.classe() == 3) {
                // Immobilisations & stocks → actif
                BigDecimal montant = l.soldeDebiteur().subtract(l.soldeCrediteur());
                if (montant.compareTo(BigDecimal.ZERO) != 0)
                    actif.add(new BilanDto.Poste(classeCategorie(l.classe()), l.numero(), l.intitule(), montant));
            } else if (l.classe() == 1) {
                // Ressources durables → passif
                BigDecimal montant = l.soldeCrediteur().subtract(l.soldeDebiteur());
                if (montant.compareTo(BigDecimal.ZERO) != 0)
                    passif.add(new BilanDto.Poste("Ressources propres et dettes financières", l.numero(), l.intitule(), montant));
            } else if (l.classe() == 4) {
                // Tiers → actif si débiteur, passif si créditeur
                if (l.soldeDebiteur().compareTo(BigDecimal.ZERO) > 0)
                    actif.add(new BilanDto.Poste("Créances", l.numero(), l.intitule(), l.soldeDebiteur()));
                if (l.soldeCrediteur().compareTo(BigDecimal.ZERO) > 0)
                    passif.add(new BilanDto.Poste("Dettes circulantes", l.numero(), l.intitule(), l.soldeCrediteur()));
            } else if (l.classe() == 5) {
                // Trésorerie → actif si débiteur, passif si créditeur
                if (l.soldeDebiteur().compareTo(BigDecimal.ZERO) > 0)
                    actif.add(new BilanDto.Poste("Trésorerie-Actif", l.numero(), l.intitule(), l.soldeDebiteur()));
                if (l.soldeCrediteur().compareTo(BigDecimal.ZERO) > 0)
                    passif.add(new BilanDto.Poste("Trésorerie-Passif", l.numero(), l.intitule(), l.soldeCrediteur()));
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

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static LocalDate debut(int exercice) { return LocalDate.of(exercice, 1, 1); }
    private static LocalDate fin(int exercice)   { return LocalDate.of(exercice, 12, 31); }

    private static String classeCategorie(int classe) {
        return switch (classe) {
            case 2 -> "Actif immobilisé";
            case 3 -> "Stocks";
            default -> "Classe " + classe;
        };
    }

    private NoteAnnexeDto.Response toNoteResponse(NoteAnnexe n) {
        return new NoteAnnexeDto.Response(n.getId(), n.getExercice(), n.getTitre(),
                n.getContenu(), n.getOrdre(), n.getCreatedAt(), n.getUpdatedAt());
    }
}
