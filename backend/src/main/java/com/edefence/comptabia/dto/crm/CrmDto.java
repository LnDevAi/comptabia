package com.edefence.comptabia.dto.crm;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class CrmDto {

    // ─── Contacts ─────────────────────────────────────────────────────────────

    public record ContactRequest(
            String nom, String email, String telephone,
            String societe, String poste, String source,
            String tags, String statut, int score, String notes
    ) {}

    public record ContactResponse(
            UUID id, String nom, String email, String telephone,
            String societe, String poste, String source, String tags,
            String statut, int score, String notes, OffsetDateTime createdAt
    ) {}

    // ─── Leads ────────────────────────────────────────────────────────────────

    public record LeadRequest(
            UUID       contactId,
            String     titre,
            BigDecimal valeur,
            int        probabilite,
            String     etape,
            String     dateCloturePrevue,
            String     produit,
            String     notes
    ) {}

    public record LeadResponse(
            UUID            id,
            ContactResponse contact,
            String          titre,
            BigDecimal      valeur,
            int             probabilite,
            String          etape,
            String          dateCloturePrevue,
            String          produit,
            String          notes,
            OffsetDateTime  createdAt,
            OffsetDateTime  updatedAt
    ) {}

    public record EtapeStats(String etape, long nbLeads, BigDecimal valeurTotale) {}

    // ─── Activités ────────────────────────────────────────────────────────────

    public record ActiviteRequest(
            UUID   leadId,
            UUID   contactId,
            String type,
            String contenu,
            String dateActivite
    ) {}

    public record ActiviteResponse(
            UUID           id,
            String         type,
            String         contenu,
            OffsetDateTime dateActivite,
            String         auteurNom,
            OffsetDateTime createdAt
    ) {}

    // ─── Templates ────────────────────────────────────────────────────────────

    public record TemplateRequest(String nom, String type, String sujet, String contenu, String variables) {}

    public record TemplateResponse(
            UUID id, String nom, String type, String sujet,
            String contenu, String variables, OffsetDateTime createdAt
    ) {}

    // ─── Campagnes ────────────────────────────────────────────────────────────

    public record CampagneRequest(
            String nom,
            String type,
            String sujet,
            String contenu,
            UUID   templateId,
            List<UUID> contactIds,
            String filtreTag,
            String filtreStatut,
            boolean tousContacts
    ) {}

    public record CampagneResponse(
            UUID           id,
            String         nom,
            String         type,
            String         sujet,
            String         statut,
            int            nbDestinataires,
            int            nbEnvoyes,
            int            nbOuverts,
            int            nbCliques,
            int            nbEchecs,
            OffsetDateTime dateEnvoiReel,
            OffsetDateTime createdAt
    ) {}

    public record DestinataireResponse(
            UUID   id,
            String nom,
            String email,
            String telephone,
            String statut,
            String erreur,
            OffsetDateTime sentAt
    ) {}

    // ─── Dashboard ────────────────────────────────────────────────────────────

    public record DashboardResponse(
            long            nbContacts,
            long            nbLeadsActifs,
            BigDecimal      valeurPipelinePonderee,
            long            nbLeadsGagnes,
            double          tauxConversion,
            List<EtapeStats> pipeline,
            List<CampagneResponse> dernieresCampagnes
    ) {}
}
