package com.edefence.ecompta.dto.stock;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class StockDto {

    // ─── Dépôts ──────────────────────────────────────────────────────────────

    public record DepotRequest(String code, String nom, String adresse, boolean actif) {}

    public record DepotResponse(String id, String code, String nom, String adresse,
                                 boolean actif, String createdAt) {}

    // ─── Articles ─────────────────────────────────────────────────────────────

    public record ArticleRequest(
            String code, String designation, String description,
            String categorie, String uniteMesure,
            BigDecimal prixUnitaire, BigDecimal stockMin, BigDecimal stockMax,
            String compteStockNumero, String compteChargeNumero,
            String methodeEvaluation, boolean actif, String notes
    ) {}

    public record ArticleResponse(
            String id, String code, String designation, String description,
            String categorie, String uniteMesure,
            BigDecimal prixUnitaire, BigDecimal coutMoyen,
            BigDecimal stockMin, BigDecimal stockMax, BigDecimal stockActuel,
            BigDecimal valeurStock,
            String compteStockNumero, String compteChargeNumero,
            String methodeEvaluation, boolean actif, String notes,
            String alerteNiveau,   // OK, ALERTE, RUPTURE
            String createdAt
    ) {}

    // ─── Mouvements ───────────────────────────────────────────────────────────

    public record MouvementRequest(
            String articleId, String depotId,
            String typeMouvement,
            BigDecimal quantite, BigDecimal prixUnitaire,
            String reference, String libelle,
            String dateMouvement
    ) {}

    public record MouvementResponse(
            String id, String articleId, String articleCode, String articleDesignation,
            String depotId, String depotNom,
            String typeMouvement,
            BigDecimal quantite, BigDecimal prixUnitaire, BigDecimal montant,
            BigDecimal coutMoyenApres,
            String reference, String libelle,
            String dateMouvement, String createdAt
    ) {}

    // ─── Inventaire ───────────────────────────────────────────────────────────

    public record LigneInventaire(
            String articleId, String code, String designation,
            String categorie, String uniteMesure,
            BigDecimal stockTheorique, BigDecimal stockReel,
            BigDecimal ecart, BigDecimal coutMoyen, BigDecimal valeurEcart
    ) {}

    public record AjustementInventaireRequest(List<LigneAjustement> lignes, String date, String reference) {}

    public record LigneAjustement(String articleId, BigDecimal stockReel) {}

    // ─── Dashboard ────────────────────────────────────────────────────────────

    public record DashboardStock(
            long totalArticles,
            long articlesEnRupture,
            long articlesEnAlerte,
            BigDecimal valeurTotaleStock,
            List<ArticleResponse> articlesRupture,
            List<MouvementResponse> derniersMovements
    ) {}

    // ─── Stats article ────────────────────────────────────────────────────────

    public record StatsArticle(
            String articleId, String code, String designation,
            BigDecimal stockActuel, BigDecimal coutMoyen, BigDecimal valeurStock,
            BigDecimal totalEntrees, BigDecimal totalSorties
    ) {}

    // ─── Stats mouvements mensuels ────────────────────────────────────────────

    public record MoisMouvement(
            int mois, String label,
            BigDecimal qtEntrees, BigDecimal qtSorties,
            BigDecimal valEntrees, BigDecimal valSorties
    ) {}

    public record StatsMouvements(
            int exercice,
            BigDecimal totalValEntrees,
            BigDecimal totalValSorties,
            long totalNbEntrees,
            long totalNbSorties,
            List<MoisMouvement> mensuel
    ) {}
}
