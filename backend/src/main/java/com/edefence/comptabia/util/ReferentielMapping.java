package com.edefence.comptabia.util;

public final class ReferentielMapping {

    private ReferentielMapping() {}

    // ─── Bilan rubrics ────────────────────────────────────────────────────────

    public record BilanRubrique(
            String actifImmobilise,
            String stocks,
            String creances,
            String dettesCirculantes,
            String tresorerieActif,
            String tresoreriePassif,
            String ressourcesDurables
    ) {}

    public static BilanRubrique getRubriques(String ref) {
        return switch (normalize(ref)) {
            case "PCG" -> new BilanRubrique(
                    "Immobilisations",
                    "Stocks",
                    "Créances d'exploitation",
                    "Dettes d'exploitation",
                    "Disponibilités",
                    "Concours bancaires courants",
                    "Capitaux propres et dettes financières");
            case "CGNC" -> new BilanRubrique(
                    "Actif immobilisé",
                    "Actif circulant — stocks",
                    "Créances de l'actif circulant",
                    "Passif circulant",
                    "Trésorerie-Actif",
                    "Trésorerie-Passif",
                    "Financement permanent");
            case "NCT" -> new BilanRubrique(
                    "Actifs non courants",
                    "Stocks",
                    "Créances courantes",
                    "Passifs courants",
                    "Disponibilités et équivalents",
                    "Découverts bancaires",
                    "Capitaux propres et passifs non courants");
            case "PCN" -> new BilanRubrique(
                    "Actifs non courants (immobilisations)",
                    "Stocks et en-cours",
                    "Créances",
                    "Dettes",
                    "Valeurs disponibles",
                    "Dettes financières à court terme",
                    "Capitaux propres et emprunts à long terme");
            case "IFRS" -> new BilanRubrique(
                    "Non-current assets",
                    "Inventories",
                    "Trade and other receivables",
                    "Trade and other payables",
                    "Cash and cash equivalents",
                    "Bank overdrafts",
                    "Equity and non-current liabilities");
            case "US-GAAP" -> new BilanRubrique(
                    "Property, plant & equipment",
                    "Inventories",
                    "Accounts receivable",
                    "Accounts payable",
                    "Cash and cash equivalents",
                    "Short-term borrowings",
                    "Stockholders' equity and long-term liabilities");
            default -> new BilanRubrique(   // SYSCOHADA
                    "Actif immobilisé",
                    "Stocks",
                    "Créances",
                    "Dettes circulantes",
                    "Trésorerie-Actif",
                    "Trésorerie-Passif",
                    "Ressources propres et dettes financières");
        };
    }

    // ─── AI prompt per referential ────────────────────────────────────────────

    public static String buildIaPrompt(String ref, String devise, double tauxTva) {
        String d = (devise == null || devise.isBlank()) ? defaultDevise(ref) : devise;
        double t = tauxTva <= 0 ? defaultTva(ref) : tauxTva;
        return switch (normalize(ref)) {
            case "PCG"     -> pcgPrompt(d, t);
            case "CGNC"    -> cgncPrompt(d, t);
            case "NCT"     -> nctPrompt(d, t);
            case "PCN"     -> pcnPrompt(d, t);
            case "IFRS"    -> ifrsPrompt(d, t);
            case "US-GAAP" -> usgaapPrompt(d, t);
            default        -> syscohadaPrompt(d, t);
        };
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private static String normalize(String ref) {
        return ref == null || ref.isBlank() ? "SYSCOHADA" : ref.trim().toUpperCase();
    }

    private static String defaultDevise(String ref) {
        return switch (normalize(ref)) {
            case "PCG", "IFRS" -> "EUR";
            case "CGNC"        -> "MAD";
            case "NCT"         -> "TND";
            case "PCN"         -> "DZD";
            case "US-GAAP"     -> "USD";
            default            -> "XOF";
        };
    }

    private static double defaultTva(String ref) {
        return switch (normalize(ref)) {
            case "PCG", "CGNC" -> 20.0;
            case "NCT", "PCN"  -> 19.0;
            default            -> 18.0;
        };
    }

    private static String baseJson(String devise, double tva) {
        return """
                {
                  "type_document": "FACTURE_ACHAT" | "FACTURE_VENTE" | "RECU" | "AUTRE",
                  "fournisseur": "nom du fournisseur ou vide",
                  "client": "nom du client ou vide",
                  "numero_document": "numéro de facture/reçu ou vide",
                  "date_document": "YYYY-MM-DD ou vide si non trouvée",
                  "description": "courte description des biens/services",
                  "montant_ht": 0.00,
                  "taux_tva": %.1f,
                  "montant_tva": 0.00,
                  "montant_ttc": 0.00,
                  "devise": "%s",
                  "imputation_suggeree": {
                    "libelle_ecriture": "libellé comptable court",
                    "journal_suggere": "AC" | "BQ" | "OD" | "VT",
                    "lignes": [
                      {"numero_compte": "601", "libelle": "...", "sens": "DEBIT", "montant": 0.00}
                    ]
                  }
                }
                """.formatted(tva, devise);
    }

    private static String syscohadaPrompt(String devise, double tva) {
        return "Tu es un expert-comptable certifié SYSCOHADA.\n"
             + "Analyse ce document et retourne UNIQUEMENT un objet JSON valide "
             + "(sans balises markdown, sans commentaires) avec la structure :\n"
             + baseJson(devise, tva)
             + """
               Règles SYSCOHADA :
               - Facture achat : DR 6xx (HT), DR 4454 (TVA déductible si > 0), CR 401x (fournisseur TTC)
               - Facture vente : DR 411x (client TTC), CR 7xx (HT), CR 4431 (TVA collectée si > 0)
               - Reçu : DR 401x/411x, CR 52x/57x
               - Journal : AC achats, VT ventes, BQ banque, OD divers.
               """;
    }

    private static String pcgPrompt(String devise, double tva) {
        return "Tu es un expert-comptable certifié Plan Comptable Général (PCG – France).\n"
             + "Analyse ce document et retourne UNIQUEMENT un objet JSON valide "
             + "(sans balises markdown) avec la structure :\n"
             + baseJson(devise, tva)
             + """
               Règles PCG France :
               - Facture achat : DR 6xx (HT), DR 44566 (TVA déductible), CR 401x (fournisseur TTC)
               - Facture vente : DR 411x (client TTC), CR 7xx (HT), CR 44571 (TVA collectée)
               - Reçu/règlement : DR 401x/411x, CR 512x (banque) ou 53x (caisse)
               - Taux TVA courant : 20 % (taux réduit 5,5 % ou 10 % si applicable).
               - Journal : AC achats, VT ventes, BQ banque, OD divers.
               """;
    }

    private static String cgncPrompt(String devise, double tva) {
        return "Tu es un expert-comptable certifié CGNC (Code Général de Normalisation Comptable – Maroc).\n"
             + "Analyse ce document et retourne UNIQUEMENT un objet JSON valide "
             + "(sans balises markdown) avec la structure :\n"
             + baseJson(devise, tva)
             + """
               Règles CGNC Maroc :
               - Facture achat : DR 6xx (HT), DR 34551 (TVA récupérable), CR 441x (fournisseur TTC)
               - Facture vente : DR 342x (client TTC), CR 7xx (HT), CR 4455 (TVA facturée)
               - Reçu : DR 441x/342x, CR 514x (banque) ou 516x (caisse)
               - Taux TVA standard : 20 %.
               - Journal : AC achats, VT ventes, BQ banque, OD divers.
               """;
    }

    private static String nctPrompt(String devise, double tva) {
        return "Tu es un expert-comptable certifié NCT (Normes Comptables Tunisiennes).\n"
             + "Analyse ce document et retourne UNIQUEMENT un objet JSON valide "
             + "(sans balises markdown) avec la structure :\n"
             + baseJson(devise, tva)
             + """
               Règles NCT Tunisie :
               - Facture achat : DR 6xx (HT), DR 43610 (TVA récupérable), CR 401x (fournisseur TTC)
               - Facture vente : DR 411x (client TTC), CR 7xx (HT), CR 43620 (TVA collectée)
               - Reçu : DR 401x/411x, CR 532x (banque) ou 571x (caisse)
               - Taux TVA standard : 19 %.
               - Journal : AC achats, VT ventes, BQ banque, OD divers.
               """;
    }

    private static String pcnPrompt(String devise, double tva) {
        return "Tu es un expert-comptable certifié PCN (Plan Comptable National – Algérie).\n"
             + "Analyse ce document et retourne UNIQUEMENT un objet JSON valide "
             + "(sans balises markdown) avec la structure :\n"
             + baseJson(devise, tva)
             + """
               Règles PCN Algérie :
               - Facture achat : DR 6xx (HT), DR 4456 (TVA déductible), CR 401x (fournisseur TTC)
               - Facture vente : DR 411x (client TTC), CR 7xx (HT), CR 4457 (TVA collectée)
               - Reçu : DR 401x/411x, CR 512x (banque) ou 53x (caisse)
               - Taux TVA standard : 19 %.
               - Journal : AC achats, VT ventes, BQ banque, OD divers.
               """;
    }

    private static String ifrsPrompt(String devise, double tva) {
        return "You are a certified IFRS accountant.\n"
             + "Analyze this document and return ONLY a valid JSON object "
             + "(no markdown, no comments) with the structure:\n"
             + baseJson(devise, tva)
             + """
               IFRS accounting rules:
               - Purchase invoice: DR Expense account (net), DR VAT receivable (if applicable), CR Accounts payable (gross)
               - Sales invoice: DR Accounts receivable (gross), CR Revenue (net), CR VAT payable (if applicable)
               - Payment receipt: DR Accounts payable/receivable, CR Cash/Bank
               - Use IFRS-compliant account codes from the company's chart of accounts.
               - Journal: AC purchases, VT sales, BQ bank, OD miscellaneous.
               """;
    }

    private static String usgaapPrompt(String devise, double tva) {
        return "You are a certified US GAAP accountant.\n"
             + "Analyze this document and return ONLY a valid JSON object "
             + "(no markdown, no comments) with the structure:\n"
             + baseJson(devise, tva)
             + """
               US GAAP accounting rules:
               - Purchase invoice: DR Expense/Asset account, CR Accounts payable
               - Sales invoice: DR Accounts receivable, CR Revenue
               - Payment: DR Accounts payable/receivable, CR Cash
               - Use standard US GAAP account codes from the company's chart of accounts.
               - Journal: AC purchases, VT sales, BQ bank, OD miscellaneous.
               """;
    }
}
