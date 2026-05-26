package com.edefence.ecompta.dto.commercial;

import java.math.BigDecimal;
import java.util.List;

public class CommercialDto {

    // ─── Plans ───────────────────────────────────────────────────────────────

    public record PlanRequest(
            String nom, String code, String description,
            BigDecimal prixMensuel, BigDecimal prixAnnuel,
            List<String> modules, int maxUtilisateurs, boolean actif
    ) {}

    public record PlanResponse(
            String id, String nom, String code, String description,
            BigDecimal prixMensuel, BigDecimal prixAnnuel,
            List<String> modules, int maxUtilisateurs, boolean actif,
            String createdAt
    ) {}

    // ─── Abonnements ─────────────────────────────────────────────────────────

    public record AbonnementRequest(
            String nomEntreprise, String emailContact, String telephone, String pays,
            String planId, String statut, String periodicite,
            String dateDebut, String dateFin, String dateProchainRenouvellement,
            BigDecimal montantActuel, String notes
    ) {}

    public record AbonnementResponse(
            String id, String nomEntreprise, String emailContact, String telephone, String pays,
            PlanResponse plan, String statut, String periodicite,
            String dateDebut, String dateFin, String dateProchainRenouvellement,
            BigDecimal montantActuel, String notes, String createdAt
    ) {}

    // ─── Factures ────────────────────────────────────────────────────────────

    public record FactureRequest(
            String abonnementId, String periodeDebut, String periodeFin,
            BigDecimal montantHt, BigDecimal tauxTva,
            String dateEcheance, String notes
    ) {}

    public record FactureResponse(
            String id, String numero, AbonnementResponse abonnement,
            String periodeDebut, String periodeFin,
            BigDecimal montantHt, BigDecimal tauxTva, BigDecimal montantTtc,
            String statut, String dateEcheance, String datePaiement,
            String notes, String createdAt
    ) {}

    // ─── Paiements ───────────────────────────────────────────────────────────

    public record PaiementRequest(
            String factureId, String modePaiement,
            BigDecimal montant, String datePaiement,
            String reference, String notes
    ) {}

    public record PaiementResponse(
            String id, String factureId, String factureNumero,
            String modePaiement, BigDecimal montant,
            String datePaiement, String reference, String notes, String createdAt
    ) {}

    // ─── Dashboard ───────────────────────────────────────────────────────────

    public record DashboardCommercial(
            long nbClientsActifs,
            long nbClientsEssai,
            long nbClientsSuspendus,
            long nbClientsResilies,
            BigDecimal mrr,
            BigDecimal arr,
            long facturesEnAttente,
            long facturesEnRetard,
            long renouvellements30jours,
            List<RevenusParPlan> revenusParPlan
    ) {}

    public record RevenusParPlan(String planNom, long nbClients, BigDecimal revenuMensuel) {}
}
