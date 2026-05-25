package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.GroupeSociete;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.consolidation.ConsolidationDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.GroupeSocieteRepository;
import com.edefence.ecompta.repository.LigneEcritureRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ConsolidationService {

    private final GroupeSocieteRepository  groupeRepo;
    private final EntrepriseRepository     entrepriseRepo;
    private final LigneEcritureRepository  ligneRepo;

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
        if (req.membreIds() != null) {
            for (UUID eid : req.membreIds()) {
                groupe.getMembres().add(entrepriseRepo.getReferenceById(eid));
            }
        }
        return toGroupeResponse(groupeRepo.save(groupe));
    }

    @Transactional
    public ConsolidationDto.GroupeResponse updateGroupe(UUID id, ConsolidationDto.GroupeRequest req, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwner(id, user);
        groupe.setNom(req.nom());
        groupe.setDescription(req.description());
        if (req.membreIds() != null) {
            groupe.getMembres().clear();
            for (UUID eid : req.membreIds()) {
                groupe.getMembres().add(entrepriseRepo.getReferenceById(eid));
            }
        }
        return toGroupeResponse(groupeRepo.save(groupe));
    }

    @Transactional
    public void deleteGroupe(UUID id, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwner(id, user);
        groupeRepo.delete(groupe);
    }

    // ─── Consolidation ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ConsolidationDto.BilanConsolide getBilanConsolide(UUID groupeId, int exercice, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwnerWithMembres(groupeId, user);
        Set<Entreprise> membres = groupe.getMembres();

        // Aggregate balance for all members
        Map<String, AggRow> agg = aggregateBalance(membres, exercice);

        List<ConsolidationDto.PosteConsolide> actif  = new ArrayList<>();
        List<ConsolidationDto.PosteConsolide> passif = new ArrayList<>();

        for (AggRow row : agg.values()) {
            BigDecimal soldeD = row.debit.compareTo(row.credit) > 0
                    ? row.debit.subtract(row.credit) : BigDecimal.ZERO;
            BigDecimal soldeC = row.credit.compareTo(row.debit) > 0
                    ? row.credit.subtract(row.debit) : BigDecimal.ZERO;

            if (row.classe == 2 || row.classe == 3) {
                BigDecimal montant = row.debit.subtract(row.credit);
                if (montant.compareTo(BigDecimal.ZERO) != 0)
                    actif.add(new ConsolidationDto.PosteConsolide(
                            classeCategorie(row.classe), row.numero, row.intitule, montant));
            } else if (row.classe == 1) {
                BigDecimal montant = soldeC;
                if (montant.compareTo(BigDecimal.ZERO) != 0)
                    passif.add(new ConsolidationDto.PosteConsolide(
                            "Ressources propres et dettes financières", row.numero, row.intitule, montant));
            } else if (row.classe == 4) {
                if (soldeD.compareTo(BigDecimal.ZERO) > 0)
                    actif.add(new ConsolidationDto.PosteConsolide("Créances", row.numero, row.intitule, soldeD));
                if (soldeC.compareTo(BigDecimal.ZERO) > 0)
                    passif.add(new ConsolidationDto.PosteConsolide("Dettes circulantes", row.numero, row.intitule, soldeC));
            } else if (row.classe == 5) {
                if (soldeD.compareTo(BigDecimal.ZERO) > 0)
                    actif.add(new ConsolidationDto.PosteConsolide("Trésorerie-Actif", row.numero, row.intitule, soldeD));
                if (soldeC.compareTo(BigDecimal.ZERO) > 0)
                    passif.add(new ConsolidationDto.PosteConsolide("Trésorerie-Passif", row.numero, row.intitule, soldeC));
            }
        }

        BigDecimal totActif  = actif.stream().map(ConsolidationDto.PosteConsolide::montant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totPassif = passif.stream().map(ConsolidationDto.PosteConsolide::montant).reduce(BigDecimal.ZERO, BigDecimal::add);

        String note = membres.size() > 1
                ? "Consolidation simple – " + membres.size() + " sociétés (élimination inter-sociétés non appliquée)"
                : "Société unique";

        return new ConsolidationDto.BilanConsolide(
                groupe.getNom(), exercice, actif, passif, totActif, totPassif, membres.size(), note);
    }

    @Transactional(readOnly = true)
    public ConsolidationDto.CompteResultatConsolide getCompteResultatConsolide(UUID groupeId, int exercice, Utilisateur user) {
        GroupeSociete groupe = findAndCheckOwnerWithMembres(groupeId, user);
        Set<Entreprise> membres = groupe.getMembres();

        Map<String, AggRow> agg = aggregateBalance(membres, exercice);

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

        String note = membres.size() > 1
                ? "Consolidation simple – " + membres.size() + " sociétés"
                : "Société unique";

        return new ConsolidationDto.CompteResultatConsolide(
                groupe.getNom(), exercice, charges, produits, totCharges, totProduits, resultat, membres.size(), note);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Map<String, AggRow> aggregateBalance(Set<Entreprise> membres, int exercice) {
        LocalDate debut  = LocalDate.of(exercice, 1, 1);
        LocalDate fin    = LocalDate.of(exercice, 12, 31);
        Map<String, AggRow> agg = new TreeMap<>();

        for (Entreprise e : membres) {
            List<Object[]> rows = ligneRepo.balanceParCompte(e.getId(), debut, fin);
            for (Object[] r : rows) {
                String     numero   = (String)  r[0];
                String     intitule = (String)  r[1];
                int        classe   = ((Number) r[2]).intValue();
                BigDecimal debit    = (BigDecimal) r[3];
                BigDecimal credit   = (BigDecimal) r[4];

                agg.merge(numero, new AggRow(numero, intitule, classe, debit, credit),
                        (existing, incoming) -> new AggRow(
                                existing.numero, existing.intitule, existing.classe,
                                existing.debit.add(incoming.debit),
                                existing.credit.add(incoming.credit)));
            }
        }
        return agg;
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
                .map(e -> new ConsolidationDto.MembreInfo(e.getId(), e.getNom(), e.getPays()))
                .toList();
        return new ConsolidationDto.GroupeResponse(g.getId(), g.getNom(), g.getDescription(), membres, g.getCreatedAt());
    }

    private String classeCategorie(int classe) {
        return switch (classe) {
            case 2 -> "Immobilisations";
            case 3 -> "Stocks";
            default -> "Classe " + classe;
        };
    }

    private record AggRow(String numero, String intitule, int classe, BigDecimal debit, BigDecimal credit) {}
}
