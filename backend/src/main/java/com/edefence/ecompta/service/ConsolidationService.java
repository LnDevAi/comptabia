package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.consolidation.ConsolidationDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConsolidationService {

    private final GroupeSocieteRepository      groupeRepo;
    private final EntrepriseRepository         entrepriseRepo;
    private final LigneEcritureRepository      ligneRepo;
    private final EliminationIntercoRepository eliminationRepo;

    // ─── CRUD groupes ─────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConsolidationDto.GroupeResponse> listGroupes(Utilisateur user) {
        return groupeRepo.findByCreateur(user.getId()).stream()
                .map(this::toGroupeResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ConsolidationDto.GroupeResponse getGroupe(UUID id, Utilisateur user) {
        return toGroupeResponse(findAndCheckOwner(id, user));
    }

    @Transactional
    public ConsolidationDto.GroupeResponse createGroupe(ConsolidationDto.GroupeRequest req, Utilisateur user) {
        GroupeSociete groupe = GroupeSociete.builder()
                .nom(req.nom())
                .description(req.description())
                .createur(user)
                .build();
        groupe = groupeRepo.save(groupe);
        if (req.membres() != null) {
            for (ConsolidationDto.MembreRequest mr : req.membres()) {
                MembreGroupe m = buildMembre(groupe, mr);
                groupe.getMembres().add(m);
            }
            groupe = groupeRepo.save(groupe);
        }
        return toGroupeResponse(groupe);
    }

    @Transactional
    public ConsolidationDto.GroupeResponse updateGroupe(UUID id, ConsolidationDto.GroupeRequest req, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwner(id, user);
        groupe.setNom(req.nom());
        groupe.setDescription(req.description());
        groupe.getMembres().clear();
        if (req.membres() != null) {
            for (ConsolidationDto.MembreRequest mr : req.membres()) {
                groupe.getMembres().add(buildMembre(groupe, mr));
            }
        }
        return toGroupeResponse(groupeRepo.save(groupe));
    }

    @Transactional
    public void deleteGroupe(UUID id, Utilisateur user) {
        groupeRepo.delete(findAndCheckOwner(id, user));
    }

    // ─── Éliminations interco ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ConsolidationDto.EliminationResponse> listEliminations(UUID groupeId, int exercice, Utilisateur user) {
        findAndCheckOwner(groupeId, user);
        return eliminationRepo.findByGroupeIdAndExercice(groupeId, exercice).stream()
                .map(this::toEliminationResponse).toList();
    }

    @Transactional
    public ConsolidationDto.EliminationResponse addElimination(UUID groupeId, ConsolidationDto.EliminationRequest req, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwner(groupeId, user);
        EliminationInterco e = EliminationInterco.builder()
                .groupe(groupe)
                .compteDebit(req.compteDebit())
                .compteCredit(req.compteCredit())
                .libelle(req.libelle())
                .exercice(req.exercice())
                .montant(req.montant())
                .build();
        return toEliminationResponse(eliminationRepo.save(e));
    }

    @Transactional
    public void deleteElimination(UUID groupeId, UUID eliminationId, Utilisateur user) {
        findAndCheckOwner(groupeId, user);
        eliminationRepo.deleteById(eliminationId);
    }

    // ─── États consolidés ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ConsolidationDto.BilanConsolide getBilanConsolide(UUID groupeId, int exercice, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwnerWithMembres(groupeId, user);
        List<MembreGroupe> membres = groupe.getMembres();

        Map<String, AggRow> agg = aggregateBalanceWithMethods(membres, exercice);

        List<EliminationInterco> eliminations = eliminationRepo.findByGroupeIdAndExercice(groupeId, exercice);
        List<ConsolidationDto.EliminationAppliquee> appliquees = applyEliminations(agg, eliminations);

        List<ConsolidationDto.PosteConsolide> actif  = new ArrayList<>();
        List<ConsolidationDto.PosteConsolide> passif = new ArrayList<>();

        for (AggRow row : agg.values()) {
            BigDecimal soldeD = row.debit.compareTo(row.credit) > 0
                    ? row.debit.subtract(row.credit) : BigDecimal.ZERO;
            BigDecimal soldeC = row.credit.compareTo(row.debit) > 0
                    ? row.credit.subtract(row.debit) : BigDecimal.ZERO;

            switch (row.classe) {
                case 2, 3 -> {
                    BigDecimal montant = row.debit.subtract(row.credit);
                    if (montant.compareTo(BigDecimal.ZERO) != 0)
                        actif.add(new ConsolidationDto.PosteConsolide(classeCategorie(row.classe), row.numero, row.intitule, montant));
                }
                case 1 -> {
                    if (soldeC.compareTo(BigDecimal.ZERO) > 0)
                        passif.add(new ConsolidationDto.PosteConsolide("Ressources propres et dettes financières", row.numero, row.intitule, soldeC));
                }
                case 4 -> {
                    if (soldeD.compareTo(BigDecimal.ZERO) > 0)
                        actif.add(new ConsolidationDto.PosteConsolide("Créances", row.numero, row.intitule, soldeD));
                    if (soldeC.compareTo(BigDecimal.ZERO) > 0)
                        passif.add(new ConsolidationDto.PosteConsolide("Dettes circulantes", row.numero, row.intitule, soldeC));
                }
                case 5 -> {
                    if (soldeD.compareTo(BigDecimal.ZERO) > 0)
                        actif.add(new ConsolidationDto.PosteConsolide("Trésorerie-Actif", row.numero, row.intitule, soldeD));
                    if (soldeC.compareTo(BigDecimal.ZERO) > 0)
                        passif.add(new ConsolidationDto.PosteConsolide("Trésorerie-Passif", row.numero, row.intitule, soldeC));
                }
            }
        }

        BigDecimal totActif  = actif.stream().map(ConsolidationDto.PosteConsolide::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totPassif = passif.stream().map(ConsolidationDto.PosteConsolide::montant).reduce(BigDecimal.ZERO, BigDecimal::add);

        String note = buildNote(membres, eliminations.size());
        return new ConsolidationDto.BilanConsolide(groupe.getNom(), exercice, actif, passif, totActif, totPassif, membres.size(), note, appliquees);
    }

    @Transactional(readOnly = true)
    public ConsolidationDto.CompteResultatConsolide getCompteResultatConsolide(UUID groupeId, int exercice, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwnerWithMembres(groupeId, user);
        List<MembreGroupe> membres = groupe.getMembres();

        Map<String, AggRow> agg = aggregateBalanceWithMethods(membres, exercice);

        List<ConsolidationDto.PosteResultat> charges  = new ArrayList<>();
        List<ConsolidationDto.PosteResultat> produits = new ArrayList<>();

        for (AggRow row : agg.values()) {
            if (row.classe == 6) {
                BigDecimal montant = row.debit.subtract(row.credit);
                if (montant.compareTo(BigDecimal.ZERO) > 0)
                    charges.add(new ConsolidationDto.PosteResultat(row.numero, row.intitule, montant));
            } else if (row.classe == 7) {
                BigDecimal montant = row.credit.subtract(row.debit);
                if (montant.compareTo(BigDecimal.ZERO) > 0)
                    produits.add(new ConsolidationDto.PosteResultat(row.numero, row.intitule, montant));
            }
        }

        BigDecimal totCharges  = charges.stream().map(ConsolidationDto.PosteResultat::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totProduits = produits.stream().map(ConsolidationDto.PosteResultat::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal resultat    = totProduits.subtract(totCharges);

        return new ConsolidationDto.CompteResultatConsolide(groupe.getNom(), exercice, charges, produits, totCharges, totProduits, resultat, membres.size(), buildNote(membres, 0));
    }

    @Transactional(readOnly = true)
    public ConsolidationDto.TFTConsolide getTFTConsolide(UUID groupeId, int exercice, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwnerWithMembres(groupeId, user);
        List<MembreGroupe> membres = groupe.getMembres();

        Map<String, AggRow> aggN  = aggregateBalanceWithMethods(membres, exercice);
        Map<String, AggRow> aggN1 = aggregateBalanceWithMethods(membres, exercice - 1);

        // Résultat net
        BigDecimal produits = sumClasse(aggN, 7, false);
        BigDecimal charges  = sumClasse(aggN, 6, true);
        BigDecimal resultat = produits.subtract(charges);

        // Dotations nettes (68x — charges calculées non décaissées)
        BigDecimal dotations = soldeDebitByPrefix(aggN, "68");

        // Variation BFR = (Stocks N-1 − Stocks N) + (Créances N-1 − Créances N) + (Dettes N − Dettes N-1)
        BigDecimal stocksN  = soldeDebitByClasse(aggN, 3);
        BigDecimal stocksN1 = soldeDebitByClasse(aggN1, 3);
        BigDecimal creancesN  = soldeDebitByClasse(aggN, 4);
        BigDecimal creancesN1 = soldeDebitByClasse(aggN1, 4);
        BigDecimal dettesN    = soldeCreditByClasse(aggN, 4);
        BigDecimal dettesN1   = soldeCreditByClasse(aggN1, 4);

        BigDecimal varStocks   = stocksN1.subtract(stocksN);
        BigDecimal varCreances = creancesN1.subtract(creancesN);
        BigDecimal varDettes   = dettesN.subtract(dettesN1);

        BigDecimal fluxExpl = resultat.add(dotations).add(varStocks).add(varCreances).add(varDettes);

        List<ConsolidationDto.PosteTFT> fluxExploitation = List.of(
            new ConsolidationDto.PosteTFT("Résultat net consolidé", resultat),
            new ConsolidationDto.PosteTFT("Dotations nettes (68x)", dotations),
            new ConsolidationDto.PosteTFT("Variation stocks", varStocks),
            new ConsolidationDto.PosteTFT("Variation créances clients", varCreances),
            new ConsolidationDto.PosteTFT("Variation dettes fournisseurs/fiscales", varDettes)
        );

        // Flux investissement = -(Immobilisations nettes N - N-1)
        BigDecimal immosN  = soldeDebitByClasse(aggN, 2);
        BigDecimal immosN1 = soldeDebitByClasse(aggN1, 2);
        BigDecimal varImmos = immosN.subtract(immosN1).negate();

        List<ConsolidationDto.PosteTFT> fluxInvestissement = List.of(
            new ConsolidationDto.PosteTFT("Acquisitions / cessions nettes d'immobilisations", varImmos)
        );

        // Flux financement = Variation capital (1x crédit) + Variation emprunts (16x crédit)
        BigDecimal capitalN  = soldeCreditByPrefix(aggN, "10", "11", "12");
        BigDecimal capitalN1 = soldeCreditByPrefix(aggN1, "10", "11", "12");
        BigDecimal empruntsN  = soldeCreditByPrefix(aggN, "16");
        BigDecimal empruntsN1 = soldeCreditByPrefix(aggN1, "16");

        BigDecimal varCapital  = capitalN.subtract(capitalN1);
        BigDecimal varEmprunts = empruntsN.subtract(empruntsN1);

        List<ConsolidationDto.PosteTFT> fluxFinancement = List.of(
            new ConsolidationDto.PosteTFT("Variation des capitaux propres", varCapital),
            new ConsolidationDto.PosteTFT("Variation des emprunts à long terme", varEmprunts)
        );

        BigDecimal totalInv  = varImmos;
        BigDecimal totalFin  = varCapital.add(varEmprunts);
        BigDecimal variation = fluxExpl.add(totalInv).add(totalFin);

        BigDecimal tresoN  = soldeDebitByClasse(aggN, 5).subtract(soldeCreditByClasse(aggN, 5));
        BigDecimal tresoN1 = soldeDebitByClasse(aggN1, 5).subtract(soldeCreditByClasse(aggN1, 5));

        return new ConsolidationDto.TFTConsolide(
                groupe.getNom(), exercice,
                fluxExploitation, fluxExpl,
                fluxInvestissement, totalInv,
                fluxFinancement, totalFin,
                variation, tresoN1, tresoN,
                membres.size(),
                "TFT consolidé – méthode indirecte (OHADA simplifié)"
        );
    }

    // ─── Agrégation avec méthodes ─────────────────────────────────────────────

    private Map<String, AggRow> aggregateBalanceWithMethods(List<MembreGroupe> membres, int exercice) {
        LocalDate debut = LocalDate.of(exercice, 1, 1);
        LocalDate fin   = LocalDate.of(exercice, 12, 31);
        Map<String, AggRow> agg = new TreeMap<>();

        for (MembreGroupe m : membres) {
            Entreprise e = m.getEntreprise();
            List<Object[]> rows = ligneRepo.balanceParCompte(e.getId(), debut, fin);

            BigDecimal taux = m.getTauxDetention().divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP);

            switch (m.getMethodeConsolidation()) {
                case INTEGRATION_GLOBALE -> mergeRows(agg, rows, BigDecimal.ONE);
                case INTEGRATION_PROPORTIONNELLE -> mergeRows(agg, rows, taux);
                case MISE_EN_EQUIVALENCE -> {
                    // Only include net equity contribution as synthetic line
                    BigDecimal capitauxPropres = BigDecimal.ZERO;
                    BigDecimal resultatNet     = BigDecimal.ZERO;
                    for (Object[] r : rows) {
                        int        classe  = ((Number) r[2]).intValue();
                        BigDecimal debit   = (BigDecimal) r[3];
                        BigDecimal credit  = (BigDecimal) r[4];
                        if (classe == 1) capitauxPropres = capitauxPropres.add(credit.subtract(debit));
                        if (classe == 6) resultatNet = resultatNet.subtract(debit.subtract(credit));
                        if (classe == 7) resultatNet = resultatNet.add(credit.subtract(debit));
                    }
                    BigDecimal valeur = capitauxPropres.multiply(taux).setScale(4, RoundingMode.HALF_UP);
                    BigDecimal qpRes  = resultatNet.multiply(taux).setScale(4, RoundingMode.HALF_UP);
                    if (valeur.compareTo(BigDecimal.ZERO) != 0) {
                        String label = "Titre MEQ – " + e.getNom();
                        agg.merge("26MEQ" + e.getId().toString().substring(0, 8),
                            new AggRow("26MEQ", "Titres mis en équivalence – " + e.getNom(), 2, valeur, BigDecimal.ZERO),
                            (ex, in) -> new AggRow(ex.numero, ex.intitule, ex.classe, ex.debit.add(in.debit), ex.credit.add(in.credit)));
                    }
                    if (qpRes.compareTo(BigDecimal.ZERO) != 0) {
                        boolean isProfit = qpRes.compareTo(BigDecimal.ZERO) > 0;
                        agg.merge("74MEQ" + e.getId().toString().substring(0, 8),
                            new AggRow("74MEQ", "Quote-part résultat – " + e.getNom(), 7,
                                isProfit ? BigDecimal.ZERO : qpRes.negate(),
                                isProfit ? qpRes : BigDecimal.ZERO),
                            (ex, in) -> new AggRow(ex.numero, ex.intitule, ex.classe, ex.debit.add(in.debit), ex.credit.add(in.credit)));
                    }
                }
            }
        }
        return agg;
    }

    private void mergeRows(Map<String, AggRow> agg, List<Object[]> rows, BigDecimal factor) {
        for (Object[] r : rows) {
            String     numero   = (String)  r[0];
            String     intitule = (String)  r[1];
            int        classe   = ((Number) r[2]).intValue();
            BigDecimal debit    = ((BigDecimal) r[3]).multiply(factor).setScale(4, RoundingMode.HALF_UP);
            BigDecimal credit   = ((BigDecimal) r[4]).multiply(factor).setScale(4, RoundingMode.HALF_UP);

            agg.merge(numero, new AggRow(numero, intitule, classe, debit, credit),
                    (existing, incoming) -> new AggRow(
                            existing.numero, existing.intitule, existing.classe,
                            existing.debit.add(incoming.debit),
                            existing.credit.add(incoming.credit)));
        }
    }

    private List<ConsolidationDto.EliminationAppliquee> applyEliminations(
            Map<String, AggRow> agg, List<EliminationInterco> eliminations) {
        List<ConsolidationDto.EliminationAppliquee> applied = new ArrayList<>();
        for (EliminationInterco elim : eliminations) {
            BigDecimal m = elim.getMontant();
            // Reduce debit side of compte_debit
            AggRow rowD = agg.get(elim.getCompteDebit());
            if (rowD != null) {
                agg.put(elim.getCompteDebit(), new AggRow(rowD.numero, rowD.intitule, rowD.classe,
                        rowD.debit.subtract(m).max(BigDecimal.ZERO), rowD.credit));
            }
            // Reduce credit side of compte_credit
            AggRow rowC = agg.get(elim.getCompteCredit());
            if (rowC != null) {
                agg.put(elim.getCompteCredit(), new AggRow(rowC.numero, rowC.intitule, rowC.classe,
                        rowC.debit, rowC.credit.subtract(m).max(BigDecimal.ZERO)));
            }
            applied.add(new ConsolidationDto.EliminationAppliquee(
                    elim.getCompteDebit(), elim.getCompteCredit(), elim.getLibelle(), m));
        }
        return applied;
    }

    // ─── Helpers calculs TFT ─────────────────────────────────────────────────

    private BigDecimal sumClasse(Map<String, AggRow> agg, int classe, boolean useDebit) {
        return agg.values().stream()
                .filter(r -> r.classe == classe)
                .map(r -> useDebit ? r.debit.subtract(r.credit) : r.credit.subtract(r.debit))
                .filter(v -> v.compareTo(BigDecimal.ZERO) > 0)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal soldeDebitByClasse(Map<String, AggRow> agg, int classe) {
        return agg.values().stream()
                .filter(r -> r.classe == classe)
                .map(r -> r.debit.subtract(r.credit).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal soldeCreditByClasse(Map<String, AggRow> agg, int classe) {
        return agg.values().stream()
                .filter(r -> r.classe == classe)
                .map(r -> r.credit.subtract(r.debit).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal soldeDebitByPrefix(Map<String, AggRow> agg, String... prefixes) {
        return agg.values().stream()
                .filter(r -> Arrays.stream(prefixes).anyMatch(p -> r.numero.startsWith(p)))
                .map(r -> r.debit.subtract(r.credit).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal soldeCreditByPrefix(Map<String, AggRow> agg, String... prefixes) {
        return agg.values().stream()
                .filter(r -> Arrays.stream(prefixes).anyMatch(p -> r.numero.startsWith(p)))
                .map(r -> r.credit.subtract(r.debit).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    // ─── Helpers communs ─────────────────────────────────────────────────────

    private MembreGroupe buildMembre(GroupeSociete groupe, ConsolidationDto.MembreRequest mr) {
        MembreGroupe.MethodeConsolidation methode = MembreGroupe.MethodeConsolidation.INTEGRATION_GLOBALE;
        if (mr.methodeConsolidation() != null) {
            try { methode = MembreGroupe.MethodeConsolidation.valueOf(mr.methodeConsolidation()); } catch (IllegalArgumentException ignored) {}
        }
        BigDecimal taux = mr.tauxDetention() != null ? mr.tauxDetention() : BigDecimal.valueOf(100);
        return MembreGroupe.builder()
                .id(new MembreGroupeId(groupe.getId(), mr.entrepriseId()))
                .groupe(groupe)
                .entreprise(entrepriseRepo.getReferenceById(mr.entrepriseId()))
                .tauxDetention(taux)
                .methodeConsolidation(methode)
                .build();
    }

    private GroupeSociete findAndCheckOwner(UUID id, Utilisateur user) {
        GroupeSociete g = groupeRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Groupe introuvable"));
        if (!g.getCreateur().getId().equals(user.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        return g;
    }

    private GroupeSociete findAndCheckOwnerWithMembres(UUID id, Utilisateur user) {
        GroupeSociete g = groupeRepo.findByIdWithMembres(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Groupe introuvable"));
        if (!g.getCreateur().getId().equals(user.getId()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        return g;
    }

    private ConsolidationDto.GroupeResponse toGroupeResponse(GroupeSociete g) {
        List<ConsolidationDto.MembreInfo> membres = g.getMembres().stream()
                .map(m -> new ConsolidationDto.MembreInfo(
                        m.getEntreprise().getId(),
                        m.getEntreprise().getNom(),
                        m.getEntreprise().getPays(),
                        m.getTauxDetention(),
                        m.getMethodeConsolidation().name()))
                .toList();
        return new ConsolidationDto.GroupeResponse(g.getId(), g.getNom(), g.getDescription(), membres, g.getCreatedAt());
    }

    private ConsolidationDto.EliminationResponse toEliminationResponse(EliminationInterco e) {
        return new ConsolidationDto.EliminationResponse(
                e.getId(), e.getCompteDebit(), e.getCompteCredit(),
                e.getLibelle(), e.getExercice(), e.getMontant());
    }

    private String classeCategorie(int classe) {
        return switch (classe) {
            case 2 -> "Immobilisations";
            case 3 -> "Stocks";
            default -> "Classe " + classe;
        };
    }

    private String buildNote(List<MembreGroupe> membres, int nbEliminations) {
        if (membres.size() == 1) return "Société unique";
        long globale = membres.stream().filter(m -> m.getMethodeConsolidation() == MembreGroupe.MethodeConsolidation.INTEGRATION_GLOBALE).count();
        long proportionnelle = membres.stream().filter(m -> m.getMethodeConsolidation() == MembreGroupe.MethodeConsolidation.INTEGRATION_PROPORTIONNELLE).count();
        long equivalence = membres.stream().filter(m -> m.getMethodeConsolidation() == MembreGroupe.MethodeConsolidation.MISE_EN_EQUIVALENCE).count();
        String methods = globale + " IG" + (proportionnelle > 0 ? ", " + proportionnelle + " IP" : "") + (equivalence > 0 ? ", " + equivalence + " MEQ" : "");
        return membres.size() + " sociétés (" + methods + ")" +
               (nbEliminations > 0 ? " – " + nbEliminations + " élimination(s) interco appliquée(s)" : " – aucune élimination interco");
    }

    private record AggRow(String numero, String intitule, int classe, BigDecimal debit, BigDecimal credit) {}
}
