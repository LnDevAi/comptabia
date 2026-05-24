package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.CompteComptable;
import com.edefence.ecompta.dto.ia.InvoiceAnalysisDto;
import com.edefence.ecompta.repository.CompteComptableRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
public class IaInvoiceService {

    private final CompteComptableRepository compteRepo;
    private final ObjectMapper mapper;
    private final RestClient restClient;
    private final String model;
    private final boolean enabled;

    private static final String SYSCOHADA_PROMPT = """
            Tu es un expert-comptable certifié SYSCOHADA.
            Analyse ce document et retourne UNIQUEMENT un objet JSON valide (sans balises markdown, sans commentaires) avec la structure suivante :

            {
              "type_document": "FACTURE_ACHAT" | "FACTURE_VENTE" | "RECU" | "AUTRE",
              "fournisseur": "nom du fournisseur ou vide",
              "client": "nom du client ou vide",
              "numero_document": "numéro de facture/reçu ou vide",
              "date_document": "YYYY-MM-DD ou vide si non trouvée",
              "description": "courte description des biens/services",
              "montant_ht": 0.00,
              "taux_tva": 18.0,
              "montant_tva": 0.00,
              "montant_ttc": 0.00,
              "devise": "XOF",
              "imputation_suggeree": {
                "libelle_ecriture": "libellé comptable court",
                "journal_suggere": "AC" | "BQ" | "OD" | "VT",
                "lignes": [
                  {"numero_compte": "601", "libelle": "...", "sens": "DEBIT", "montant": 0.00}
                ]
              }
            }

            Règles d'imputation SYSCOHADA :
            - Facture d'achat : DR 6xx (charges HT), DR 4454 (TVA déductible si > 0), CR 401x (fournisseur TTC)
            - Facture de vente : DR 411x (client TTC), CR 7xx (produits HT), CR 4431 (TVA collectée si > 0)
            - Reçu de paiement : DR 401x ou 411x (règlement), CR 52x (banque) ou 57x (caisse)
            - Si montants non trouvés, indiquer 0.
            - Journal AC pour achats, VT pour ventes, BQ pour banque, OD pour opérations diverses.
            """;

    public IaInvoiceService(
            CompteComptableRepository compteRepo,
            ObjectMapper mapper,
            @Value("${anthropic.api-key:}") String apiKey,
            @Value("${anthropic.model:claude-haiku-4-5-20251001}") String model,
            @Value("${anthropic.base-url:https://api.anthropic.com/v1}") String baseUrl) {
        this.compteRepo = compteRepo;
        this.mapper = mapper;
        this.model = model;
        this.enabled = apiKey != null && !apiKey.isBlank();
        if (this.enabled) {
            this.restClient = RestClient.builder()
                    .baseUrl(baseUrl)
                    .defaultHeader("x-api-key", apiKey)
                    .defaultHeader("anthropic-version", "2023-06-01")
                    .build();
        } else {
            this.restClient = null;
            log.warn("Anthropic API key not configured — IA invoice analysis disabled");
        }
    }

    public InvoiceAnalysisDto analyse(MultipartFile file, UUID entrepriseId) throws IOException {
        if (!enabled) {
            throw new IllegalStateException("L'assistant IA n'est pas configuré. Définissez la variable d'environnement ANTHROPIC_API_KEY.");
        }

        String contentType = Optional.ofNullable(file.getContentType()).orElse("application/octet-stream");
        boolean isPdf = contentType.contains("pdf");
        boolean isImage = contentType.startsWith("image/");

        if (!isPdf && !isImage) {
            throw new IllegalArgumentException("Format non supporté. Envoyez un PDF ou une image (JPEG, PNG, WebP).");
        }

        String rawText;
        String claudeResponse;

        if (isPdf) {
            rawText = extractPdfText(file.getBytes());
            claudeResponse = callClaudeWithText(rawText);
        } else {
            rawText = "[image]";
            claudeResponse = callClaudeWithImage(file.getBytes(), contentType);
        }

        return buildDto(claudeResponse, rawText, entrepriseId);
    }

    // ─── PDF text extraction ──────────────────────────────────────────────────

    private String extractPdfText(byte[] bytes) throws IOException {
        try (PDDocument doc = Loader.loadPDF(bytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            return text.length() > 8000 ? text.substring(0, 8000) : text;
        }
    }

    // ─── Claude API calls ─────────────────────────────────────────────────────

    private String callClaudeWithText(String text) {
        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 1500,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(Map.of(
                                "type", "text",
                                "text", SYSCOHADA_PROMPT + "\n\nDocument :\n" + text
                        ))
                ))
        );
        return executeClaudeCall(body);
    }

    private String callClaudeWithImage(byte[] imageBytes, String mediaType) {
        String base64 = Base64.getEncoder().encodeToString(imageBytes);
        Map<String, Object> body = Map.of(
                "model", model,
                "max_tokens", 1500,
                "messages", List.of(Map.of(
                        "role", "user",
                        "content", List.of(
                                Map.of(
                                        "type", "image",
                                        "source", Map.of(
                                                "type", "base64",
                                                "media_type", mediaType,
                                                "data", base64
                                        )
                                ),
                                Map.of("type", "text", "text", SYSCOHADA_PROMPT)
                        )
                ))
        );
        return executeClaudeCall(body);
    }

    private String executeClaudeCall(Map<String, Object> body) {
        try {
            String responseJson = restClient.post()
                    .uri("/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = mapper.readTree(responseJson);
            return root.path("content").get(0).path("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'appel à l'API Claude : " + e.getMessage(), e);
        }
    }

    // ─── DTO construction ─────────────────────────────────────────────────────

    private InvoiceAnalysisDto buildDto(String claudeResponse, String rawText, UUID entrepriseId) {
        try {
            String json = stripMarkdown(claudeResponse);
            JsonNode node = mapper.readTree(json);

            String typeDoc  = text(node, "type_document", "AUTRE");
            String fourn    = text(node, "fournisseur", "");
            String client   = text(node, "client", "");
            String numDoc   = text(node, "numero_document", "");
            LocalDate date  = parseDate(text(node, "date_document", ""));
            String desc     = text(node, "description", "");
            BigDecimal ht   = decimal(node, "montant_ht");
            BigDecimal tva  = decimal(node, "taux_tva");
            BigDecimal mTva = decimal(node, "montant_tva");
            BigDecimal ttc  = decimal(node, "montant_ttc");
            String devise   = text(node, "devise", "XOF");

            InvoiceAnalysisDto.ImputationSuggeree imputation = buildImputation(
                    node.path("imputation_suggeree"), entrepriseId);

            return new InvoiceAnalysisDto(typeDoc, fourn, client, numDoc, date, desc,
                    ht, tva, mTva, ttc, devise, imputation, rawText);

        } catch (Exception e) {
            log.error("Failed to parse Claude response: {}", claudeResponse, e);
            throw new RuntimeException("L'IA n'a pas pu analyser ce document. Vérifiez que le fichier est lisible.", e);
        }
    }

    private InvoiceAnalysisDto.ImputationSuggeree buildImputation(JsonNode imp, UUID entrepriseId) {
        if (imp.isMissingNode()) return null;
        String libelle  = text(imp, "libelle_ecriture", "Écriture IA");
        String journal  = text(imp, "journal_suggere", "OD");

        List<CompteComptable> comptes = compteRepo.findByEntrepriseIdAndActifTrueOrderByNumeroAsc(entrepriseId);
        Map<String, CompteComptable> compteByNumero = new HashMap<>();
        for (CompteComptable c : comptes) compteByNumero.put(c.getNumero(), c);

        List<InvoiceAnalysisDto.LigneSuggeree> lignes = new ArrayList<>();
        for (JsonNode l : imp.path("lignes")) {
            String num      = text(l, "numero_compte", "");
            String libelleL = text(l, "libelle", "");
            String sens     = text(l, "sens", "DEBIT");
            BigDecimal mont = decimal(l, "montant");

            // Try exact match, then prefix match
            CompteComptable found = compteByNumero.get(num);
            if (found == null) {
                found = comptes.stream()
                        .filter(c -> c.getNumero().startsWith(num.length() >= 2 ? num.substring(0, 2) : num))
                        .findFirst().orElse(null);
            }

            lignes.add(new InvoiceAnalysisDto.LigneSuggeree(
                    found != null ? found.getId() : null,
                    num,
                    found != null ? found.getIntitule() : "",
                    libelleL,
                    sens,
                    mont
            ));
        }
        return new InvoiceAnalysisDto.ImputationSuggeree(libelle, journal, lignes);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static String stripMarkdown(String text) {
        text = text.trim();
        if (text.startsWith("```json")) text = text.substring(7);
        else if (text.startsWith("```")) text = text.substring(3);
        if (text.endsWith("```")) text = text.substring(0, text.length() - 3);
        return text.trim();
    }

    private static String text(JsonNode n, String field, String def) {
        JsonNode v = n.path(field);
        return v.isMissingNode() || v.isNull() ? def : v.asText(def);
    }

    private static BigDecimal decimal(JsonNode n, String field) {
        JsonNode v = n.path(field);
        if (v.isMissingNode() || v.isNull()) return BigDecimal.ZERO;
        try { return new BigDecimal(v.asText("0")); } catch (Exception e) { return BigDecimal.ZERO; }
    }

    private static LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return LocalDate.now();
        for (String fmt : new String[]{"yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "MM/dd/yyyy"}) {
            try { return LocalDate.parse(s, DateTimeFormatter.ofPattern(fmt)); } catch (Exception ignored) {}
        }
        return LocalDate.now();
    }
}
