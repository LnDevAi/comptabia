package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.stock.StockDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class StockService {

    private final ArticleStockRepository    articleRepo;
    private final MouvementStockRepository  mouvementRepo;
    private final DepotStockRepository      depotRepo;
    private final EntrepriseRepository      entrepriseRepo;
    private final CompteComptableRepository compteRepo;
    private final EcritureComptableRepository ecritureRepo;
    private final UtilisateurRepository     utilisateurRepo;

    // ─── Dépôts ───────────────────────────────────────────────────────────────

    public List<StockDto.DepotResponse> listerDepots(UUID entrepriseId) {
        return depotRepo.findByEntrepriseIdOrderByNomAsc(entrepriseId)
                .stream().map(this::toDepotResponse).toList();
    }

    public StockDto.DepotResponse creerDepot(UUID entrepriseId, StockDto.DepotRequest req) {
        if (depotRepo.existsByCodeAndEntrepriseId(req.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Code dépôt déjà utilisé");
        }
        Entreprise e = findEntreprise(entrepriseId);
        DepotStock depot = DepotStock.builder()
                .code(req.code().toUpperCase().trim())
                .nom(req.nom().trim())
                .adresse(req.adresse())
                .actif(req.actif())
                .entreprise(e)
                .build();
        return toDepotResponse(depotRepo.save(depot));
    }

    public StockDto.DepotResponse mettreAJourDepot(UUID id, UUID entrepriseId, StockDto.DepotRequest req) {
        DepotStock depot = depotRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dépôt introuvable"));
        depot.setNom(req.nom().trim());
        depot.setAdresse(req.adresse());
        depot.setActif(req.actif());
        return toDepotResponse(depotRepo.save(depot));
    }

    // ─── Articles ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<StockDto.ArticleResponse> findAll(UUID entrepriseId,
                                                    ArticleStock.Categorie categorie,
                                                    Boolean actif,
                                                    String search,
                                                    Pageable pageable) {
        return articleRepo.search(entrepriseId, categorie, actif, search, pageable)
                .map(this::toArticleResponse);
    }

    @Transactional(readOnly = true)
    public StockDto.StatsArticle statsArticle(UUID id, UUID entrepriseId) {
        ArticleStock a = findArticleOrThrow(id, entrepriseId);
        BigDecimal entrees = mouvementRepo.totalEntrees(id);
        BigDecimal sorties = mouvementRepo.totalSorties(id);
        return new StockDto.StatsArticle(
                a.getId().toString(), a.getCode(), a.getDesignation(),
                a.getStockActuel(), a.getCoutMoyen(),
                a.getStockActuel().multiply(a.getCoutMoyen()).setScale(2, RoundingMode.HALF_UP),
                entrees, sorties);
    }

    @Transactional(readOnly = true)
    public StockDto.DashboardStock getDashboard(UUID entrepriseId) {
        long total    = articleRepo.countActifs(entrepriseId);
        long rupture  = articleRepo.countEnRupture(entrepriseId);
        long alerte   = articleRepo.countEnAlerte(entrepriseId);
        BigDecimal val = articleRepo.valeurTotaleStock(entrepriseId);

        List<StockDto.ArticleResponse> articlesRupture = articleRepo
                .findByEntrepriseIdAndActifTrue(entrepriseId)
                .stream()
                .filter(a -> a.getStockMin().compareTo(BigDecimal.ZERO) > 0
                          && a.getStockActuel().compareTo(a.getStockMin()) <= 0)
                .map(this::toArticleResponse)
                .toList();

        List<StockDto.MouvementResponse> recents = mouvementRepo
                .findRecents(entrepriseId, LocalDate.now().minusDays(30))
                .stream().limit(20)
                .map(this::toMouvementResponse)
                .toList();

        return new StockDto.DashboardStock(total, rupture, alerte, val, articlesRupture, recents);
    }

    public StockDto.ArticleResponse creerArticle(UUID entrepriseId, StockDto.ArticleRequest req) {
        if (articleRepo.existsByCodeAndEntrepriseId(req.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un article avec le code « " + req.code() + " » existe déjà.");
        }
        Entreprise e = findEntreprise(entrepriseId);
        ArticleStock a = ArticleStock.builder()
                .code(req.code().toUpperCase().trim())
                .designation(req.designation().trim())
                .description(req.description())
                .categorie(ArticleStock.Categorie.valueOf(req.categorie()))
                .uniteMesure(req.uniteMesure() != null ? req.uniteMesure() : "UNITE")
                .prixUnitaire(req.prixUnitaire() != null ? req.prixUnitaire() : BigDecimal.ZERO)
                .stockMin(req.stockMin() != null ? req.stockMin() : BigDecimal.ZERO)
                .stockMax(req.stockMax())
                .compteStockNumero(req.compteStockNumero())
                .compteChargeNumero(req.compteChargeNumero())
                .methodeEvaluation(req.methodeEvaluation() != null
                        ? ArticleStock.MethodeEvaluation.valueOf(req.methodeEvaluation())
                        : ArticleStock.MethodeEvaluation.CMUP)
                .actif(req.actif())
                .notes(req.notes())
                .entreprise(e)
                .build();
        return toArticleResponse(articleRepo.save(a));
    }

    public StockDto.ArticleResponse mettreAJourArticle(UUID id, UUID entrepriseId,
                                                         StockDto.ArticleRequest req) {
        ArticleStock a = findArticleOrThrow(id, entrepriseId);
        if (!a.getCode().equalsIgnoreCase(req.code())
                && articleRepo.existsByCodeAndEntrepriseId(req.code(), entrepriseId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Code article déjà utilisé");
        }
        a.setCode(req.code().toUpperCase().trim());
        a.setDesignation(req.designation().trim());
        a.setDescription(req.description());
        a.setCategorie(ArticleStock.Categorie.valueOf(req.categorie()));
        a.setUniteMesure(req.uniteMesure() != null ? req.uniteMesure() : "UNITE");
        a.setPrixUnitaire(req.prixUnitaire() != null ? req.prixUnitaire() : BigDecimal.ZERO);
        a.setStockMin(req.stockMin() != null ? req.stockMin() : BigDecimal.ZERO);
        a.setStockMax(req.stockMax());
        a.setCompteStockNumero(req.compteStockNumero());
        a.setCompteChargeNumero(req.compteChargeNumero());
        a.setActif(req.actif());
        a.setNotes(req.notes());
        return toArticleResponse(articleRepo.save(a));
    }

    public void supprimerArticle(UUID id, UUID entrepriseId) {
        ArticleStock a = findArticleOrThrow(id, entrepriseId);
        if (a.getStockActuel().compareTo(BigDecimal.ZERO) != 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Impossible de supprimer un article avec un stock non nul.");
        }
        articleRepo.delete(a);
    }

    // ─── Mouvements ───────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<StockDto.MouvementResponse> findMouvements(UUID entrepriseId, UUID articleId,
                                                              MouvementStock.TypeMouvement type,
                                                              LocalDate debut, LocalDate fin,
                                                              Pageable pageable) {
        return mouvementRepo.search(entrepriseId, articleId, type, debut, fin, pageable)
                .map(this::toMouvementResponse);
    }

    public StockDto.MouvementResponse enregistrerMouvement(UUID entrepriseId,
                                                             StockDto.MouvementRequest req,
                                                             String userEmail) {
        ArticleStock article = findArticleOrThrow(UUID.fromString(req.articleId()), entrepriseId);
        if (!article.isActif()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Article inactif");
        }

        DepotStock depot = null;
        if (req.depotId() != null && !req.depotId().isBlank()) {
            depot = depotRepo.findByIdAndEntrepriseId(UUID.fromString(req.depotId()), entrepriseId)
                    .orElse(null);
        }

        MouvementStock.TypeMouvement type = MouvementStock.TypeMouvement.valueOf(req.typeMouvement());
        boolean isEntree = type == MouvementStock.TypeMouvement.ENTREE
                || type == MouvementStock.TypeMouvement.AJUSTEMENT_POS
                || type == MouvementStock.TypeMouvement.TRANSFERT_ENTREE;
        boolean isSortie = type == MouvementStock.TypeMouvement.SORTIE
                || type == MouvementStock.TypeMouvement.AJUSTEMENT_NEG
                || type == MouvementStock.TypeMouvement.TRANSFERT_SORTIE;

        BigDecimal quantite = req.quantite().abs();
        BigDecimal prixUnit = req.prixUnitaire() != null && req.prixUnitaire().compareTo(BigDecimal.ZERO) > 0
                ? req.prixUnitaire()
                : article.getCoutMoyen().compareTo(BigDecimal.ZERO) > 0
                    ? article.getCoutMoyen()
                    : article.getPrixUnitaire();

        if (isSortie && article.getStockActuel().compareTo(quantite) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Stock insuffisant : disponible=" + article.getStockActuel()
                            + ", demandé=" + quantite);
        }

        BigDecimal montant = quantite.multiply(prixUnit).setScale(2, RoundingMode.HALF_UP);
        BigDecimal nouveauCmup = article.getCoutMoyen();

        if (isEntree) {
            BigDecimal stockAvant = article.getStockActuel();
            BigDecimal valeurAvant = stockAvant.multiply(article.getCoutMoyen());
            BigDecimal valeurEntree = quantite.multiply(prixUnit);
            BigDecimal newStock = stockAvant.add(quantite);
            if (newStock.compareTo(BigDecimal.ZERO) > 0) {
                nouveauCmup = valeurAvant.add(valeurEntree)
                        .divide(newStock, 4, RoundingMode.HALF_UP);
            }
            article.setStockActuel(newStock);
            article.setCoutMoyen(nouveauCmup);
        } else if (isSortie) {
            article.setStockActuel(article.getStockActuel().subtract(quantite));
        }

        Entreprise entreprise = findEntreprise(entrepriseId);
        MouvementStock mouvement = MouvementStock.builder()
                .article(article)
                .depot(depot)
                .typeMouvement(type)
                .quantite(quantite)
                .prixUnitaire(prixUnit)
                .montant(montant)
                .coutMoyenApres(nouveauCmup)
                .reference(req.reference())
                .libelle(req.libelle())
                .dateMouvement(LocalDate.parse(req.dateMouvement()))
                .entreprise(entreprise)
                .build();

        UUID ecritureId = genererEcritureStock(article, type, quantite, prixUnit, mouvement.getDateMouvement(), userEmail, entrepriseId);
        mouvement.setEcritureId(ecritureId);

        articleRepo.save(article);
        MouvementStock saved = mouvementRepo.save(mouvement);
        log.info("Mouvement stock: article={} type={} qte={} prix={}", article.getCode(), type, quantite, prixUnit);
        return toMouvementResponse(saved);
    }

    public List<StockDto.LigneInventaire> preparerInventaire(UUID entrepriseId) {
        return articleRepo.findByEntrepriseIdAndActifTrue(entrepriseId)
                .stream()
                .map(a -> new StockDto.LigneInventaire(
                        a.getId().toString(), a.getCode(), a.getDesignation(),
                        a.getCategorie().name(), a.getUniteMesure(),
                        a.getStockActuel(), a.getStockActuel(),
                        BigDecimal.ZERO, a.getCoutMoyen(), BigDecimal.ZERO))
                .toList();
    }

    public List<StockDto.MouvementResponse> ajusterInventaire(UUID entrepriseId,
                                                                StockDto.AjustementInventaireRequest req,
                                                                String userEmail) {
        return req.lignes().stream()
                .filter(l -> l.stockReel() != null)
                .map(l -> {
                    ArticleStock a = findArticleOrThrow(UUID.fromString(l.articleId()), entrepriseId);
                    BigDecimal ecart = l.stockReel().subtract(a.getStockActuel());
                    if (ecart.compareTo(BigDecimal.ZERO) == 0) return null;

                    String type = ecart.compareTo(BigDecimal.ZERO) > 0 ? "AJUSTEMENT_POS" : "AJUSTEMENT_NEG";
                    StockDto.MouvementRequest mReq = new StockDto.MouvementRequest(
                            l.articleId(), null, type,
                            ecart.abs(), a.getCoutMoyen(),
                            req.reference(), "Inventaire physique",
                            req.date()
                    );
                    return enregistrerMouvement(entrepriseId, mReq, userEmail);
                })
                .filter(r -> r != null)
                .toList();
    }

    // ─── Comptabilisation ─────────────────────────────────────────────────────

    private UUID genererEcritureStock(ArticleStock article, MouvementStock.TypeMouvement type,
                                       BigDecimal quantite, BigDecimal prix,
                                       LocalDate date, String userEmail, UUID entrepriseId) {
        if (article.getCompteStockNumero() == null || article.getCompteStockNumero().isBlank()) return null;

        CompteComptable compteStock = compteRepo
                .findByNumeroAndEntrepriseId(article.getCompteStockNumero(), entrepriseId)
                .orElse(null);
        if (compteStock == null) return null;

        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail).orElse(null);
        if (auteur == null) return null;

        BigDecimal montant = quantite.multiply(prix).setScale(2, RoundingMode.HALF_UP);
        boolean isEntree = type == MouvementStock.TypeMouvement.ENTREE
                || type == MouvementStock.TypeMouvement.AJUSTEMENT_POS;
        boolean isSortie = type == MouvementStock.TypeMouvement.SORTIE
                || type == MouvementStock.TypeMouvement.AJUSTEMENT_NEG;

        if (!isEntree && !isSortie) return null;

        String contrepartieNum = isEntree ? "4011" : article.getCompteChargeNumero();
        if (contrepartieNum == null || contrepartieNum.isBlank()) contrepartieNum = isEntree ? "4011" : "6031";

        CompteComptable contrepartie = compteRepo
                .findByNumeroAndEntrepriseId(contrepartieNum, entrepriseId)
                .orElse(null);
        if (contrepartie == null) return null;

        String numeroPiece = "STK-" + article.getCode() + "-" + date + "-" + type.name().substring(0, 2);
        if (ecritureRepo.existsByNumeroPieceAndEntrepriseId(numeroPiece, entrepriseId)) {
            numeroPiece = numeroPiece + "-" + System.currentTimeMillis();
        }

        Entreprise entreprise = findEntreprise(entrepriseId);
        String libelle = (isEntree ? "Entrée stock " : "Sortie stock ") + article.getDesignation();

        EcritureComptable ecriture = EcritureComptable.builder()
                .numeroPiece(numeroPiece)
                .dateEcriture(date)
                .libelle(libelle)
                .journal(EcritureComptable.Journal.OD)
                .statut(EcritureComptable.Statut.BROUILLON)
                .entreprise(entreprise)
                .createdBy(auteur)
                .build();

        if (isEntree) {
            // DR stock / CR fournisseur
            ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture)
                    .compte(compteStock).libelle(libelle).debit(montant).credit(BigDecimal.ZERO).build());
            ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture)
                    .compte(contrepartie).libelle(libelle).debit(BigDecimal.ZERO).credit(montant).build());
        } else {
            // DR charge / CR stock
            ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture)
                    .compte(contrepartie).libelle(libelle).debit(montant).credit(BigDecimal.ZERO).build());
            ecriture.getLignes().add(LigneEcriture.builder().ecriture(ecriture)
                    .compte(compteStock).libelle(libelle).debit(BigDecimal.ZERO).credit(montant).build());
        }

        return ecritureRepo.save(ecriture).getId();
    }

    // ─── Mappers ──────────────────────────────────────────────────────────────

    private StockDto.DepotResponse toDepotResponse(DepotStock d) {
        return new StockDto.DepotResponse(d.getId().toString(), d.getCode(), d.getNom(),
                d.getAdresse(), d.isActif(),
                d.getCreatedAt() != null ? d.getCreatedAt().toString() : null);
    }

    private StockDto.ArticleResponse toArticleResponse(ArticleStock a) {
        BigDecimal valeur = a.getStockActuel().multiply(a.getCoutMoyen()).setScale(2, RoundingMode.HALF_UP);
        String alerte = "OK";
        if (a.getStockMin().compareTo(BigDecimal.ZERO) > 0) {
            if (a.getStockActuel().compareTo(a.getStockMin()) <= 0) alerte = "RUPTURE";
            else if (a.getStockActuel().compareTo(a.getStockMin().multiply(BigDecimal.valueOf(1.2))) <= 0) alerte = "ALERTE";
        }
        return new StockDto.ArticleResponse(
                a.getId().toString(), a.getCode(), a.getDesignation(), a.getDescription(),
                a.getCategorie().name(), a.getUniteMesure(),
                a.getPrixUnitaire(), a.getCoutMoyen(),
                a.getStockMin(), a.getStockMax(), a.getStockActuel(), valeur,
                a.getCompteStockNumero(), a.getCompteChargeNumero(),
                a.getMethodeEvaluation().name(), a.isActif(), a.getNotes(),
                alerte, a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
    }

    private StockDto.MouvementResponse toMouvementResponse(MouvementStock m) {
        return new StockDto.MouvementResponse(
                m.getId().toString(),
                m.getArticle().getId().toString(),
                m.getArticle().getCode(),
                m.getArticle().getDesignation(),
                m.getDepot() != null ? m.getDepot().getId().toString() : null,
                m.getDepot() != null ? m.getDepot().getNom() : null,
                m.getTypeMouvement().name(),
                m.getQuantite(), m.getPrixUnitaire(), m.getMontant(),
                m.getCoutMoyenApres(),
                m.getReference(), m.getLibelle(),
                m.getDateMouvement().toString(),
                m.getCreatedAt() != null ? m.getCreatedAt().toString() : null);
    }

    private ArticleStock findArticleOrThrow(UUID id, UUID entrepriseId) {
        return articleRepo.findByIdAndEntrepriseId(id, entrepriseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Article introuvable"));
    }

    private Entreprise findEntreprise(UUID id) {
        return entrepriseRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Entreprise introuvable"));
    }
}
