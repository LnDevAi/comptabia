package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.CompteComptable;
import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.dto.ia.ChatDto;
import com.edefence.comptabia.repository.CompteComptableRepository;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.LigneEcritureRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class IaChatService {

    private final CompteComptableRepository compteRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final LigneEcritureRepository ligneRepo;
    private final ObjectMapper mapper;
    private final RestClient restClient;
    private final String model;
    private final boolean enabled;

    private static final String SYSTEM_PROMPT = """
            Tu es SYSCO, un assistant comptable expert en SYSCOHADA (Système Comptable OHADA), \
            le référentiel comptable des 17 pays membres de l'OHADA en Afrique.

            ## Tes expertises
            - Plan comptable OHADA classes 1-9
            - Deux systèmes : Système Normal (SN) et Système Minimal de Trésorerie (SMT)
            - Écritures courantes : achats, ventes, trésorerie, salaires, amortissements, régularisations
            - Clôture d'exercice et résultat
            - TVA : 18% (Burkina Faso, Côte d'Ivoire, Sénégal, Togo…), 19,25% (Cameroun), 18% (Mali, Niger…)

            ## Plan comptable SYSCOHADA résumé
            - Classe 1 : Ressources durables — 101 Capital, 130 Résultat, 161 Emprunts LT
            - Classe 2 : Actif immobilisé — 211 Terrains, 213 Bâtiments, 244 Matériel, 28x Amortissements
            - Classe 3 : Stocks — 31x Marchandises, 32x Matières premières
            - Classe 4 : Tiers — 401 Fournisseurs, 411 Clients, 4431 TVA collectée, 4454 TVA déductible
            - Classe 5 : Trésorerie — 521 Banque, 531 Caisse, 571 Mobile money
            - Classe 6 : Charges — 601 Achats marchés, 622 Loyers, 641 Impôts, 661 Salaires bruts, 681 Dotations amort.
            - Classe 7 : Produits — 701 Ventes marchés, 706 Prestations services, 756 Produits financiers
            - Classe 8 : HAO — 811 Charges hors activités ord., 821 Produits hors activités ord.
            - Classe 9 : Comptabilité analytique

            ## Schémas d'écritures types
            Achat avec TVA :     DR 6xx (HT) + DR 4454 (TVA déd.) / CR 401 (TTC)
            Vente avec TVA :     DR 411 (TTC) / CR 7xx (HT) + CR 4431 (TVA coll.)
            Paiement fourn. :    DR 401 / CR 521
            Encaissement client: DR 521 / CR 411
            Salaires :           DR 661 (brut) / CR 421 (net à payer) + CR 431 (CNSS) + CR 432 (impôt)
            Amortissement :      DR 681 / CR 28x (selon bien)
            Clôture charges :    DR 1301 / CR 6xx
            Clôture produits :   DR 7xx / CR 1301

            ## Règles de réponse
            - Réponds toujours en français, de façon claire et pédagogique
            - Pour chaque imputation : indique DÉBIT (n° + intitulé + montant) et CRÉDIT (n° + intitulé + montant)
            - Vérifie toujours l'équilibre : Débit = Crédit
            - Si la question est ambiguë, demande des précisions avant de répondre
            - Si tu utilises des données de l'entreprise, cite-les explicitement
            - Ne fournis pas de conseil juridique ou fiscal : oriente vers un professionnel agrée
            """;

    public IaChatService(
            CompteComptableRepository compteRepo,
            EntrepriseRepository entrepriseRepo,
            LigneEcritureRepository ligneRepo,
            ObjectMapper mapper,
            @Value("${anthropic.api-key:}") String apiKey,
            @Value("${anthropic.model:claude-haiku-4-5-20251001}") String model,
            @Value("${anthropic.base-url:https://api.anthropic.com/v1}") String baseUrl) {
        this.compteRepo = compteRepo;
        this.entrepriseRepo = entrepriseRepo;
        this.ligneRepo = ligneRepo;
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
        }
    }

    public ChatDto.Response chat(List<ChatDto.Message> messages, boolean includeContext, UUID entrepriseId) {
        if (!enabled) {
            throw new IllegalStateException("L'assistant IA n'est pas configuré. Définissez la variable d'environnement ANTHROPIC_API_KEY.");
        }
        String system = includeContext
                ? SYSTEM_PROMPT + buildContextSection(entrepriseId)
                : SYSTEM_PROMPT;

        List<Map<String, Object>> anthropicMessages = messages.stream()
                .map(m -> Map.<String, Object>of(
                        "role", m.role(),
                        "content", m.content()
                ))
                .toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", model);
        body.put("max_tokens", 2048);
        body.put("system", system);
        body.put("messages", anthropicMessages);

        try {
            String responseJson = restClient.post()
                    .uri("/messages")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            JsonNode root = mapper.readTree(responseJson);
            String content = root.path("content").get(0).path("text").asText();
            return new ChatDto.Response(content);
        } catch (Exception e) {
            throw new RuntimeException("Erreur lors de l'appel à l'API Claude : " + e.getMessage(), e);
        }
    }

    // ─── Context builder ─────────────────────────────────────────────────────

    private String buildContextSection(UUID entrepriseId) {
        StringBuilder sb = new StringBuilder("\n\n---\n## Contexte de l'entreprise\n");

        try {
            entrepriseRepo.findById(entrepriseId).ifPresent(e -> {
                sb.append(String.format("Entreprise : %s (%s) — Système : %s — Plan : %s%n",
                        e.getNom(), e.getPays(),
                        e.getSystemeComptable().name(),
                        e.getPlan().name()));
            });

            List<CompteComptable> comptes = compteRepo.findByEntrepriseIdAndActifTrueOrderByNumeroAsc(entrepriseId);
            if (!comptes.isEmpty()) {
                sb.append("\n### Plan de comptes actif\n");
                Map<Integer, List<CompteComptable>> byClasse = comptes.stream()
                        .collect(Collectors.groupingBy(CompteComptable::getClasse));
                for (int c = 1; c <= 9; c++) {
                    List<CompteComptable> list = byClasse.getOrDefault(c, List.of());
                    if (!list.isEmpty()) {
                        sb.append(String.format("Classe %d (%d comptes) : ", c, list.size()));
                        sb.append(list.stream()
                                .limit(8)
                                .map(cc -> cc.getNumero() + " " + cc.getIntitule())
                                .collect(Collectors.joining(", ")));
                        if (list.size() > 8) sb.append("…");
                        sb.append("\n");
                    }
                }
            }

            // Balance summary for current year
            int year = LocalDate.now().getYear();
            LocalDate from = LocalDate.of(year, 1, 1);
            LocalDate to   = LocalDate.of(year, 12, 31);
            List<Object[]> balance = ligneRepo.balanceParCompte(entrepriseId, from, to);
            if (!balance.isEmpty()) {
                sb.append("\n### Soldes ").append(year).append(" (écritures validées)\n");
                Map<Integer, BigDecimal[]> byClasse = new TreeMap<>();
                for (Object[] row : balance) {
                    int classe = ((Number) row[2]).intValue();
                    BigDecimal d = (BigDecimal) row[3];
                    BigDecimal c = (BigDecimal) row[4];
                    byClasse.merge(classe,
                            new BigDecimal[]{d, c},
                            (a, b) -> new BigDecimal[]{a[0].add(b[0]), a[1].add(b[1])});
                }
                byClasse.forEach((c, v) -> sb.append(String.format(
                        "Classe %d : Débit %.2f / Crédit %.2f%n", c, v[0], v[1])));
            }
        } catch (Exception e) {
            log.warn("Failed to build context section: {}", e.getMessage());
            sb.append("(données non disponibles)\n");
        }

        sb.append("---\n");
        return sb.toString();
    }
}
