package com.edefence.comptabia.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {

    private static final String BEARER_SCHEME = "bearerAuth";

    @Value("${springdoc.server-url:http://localhost:8080}")
    private String serverUrl;

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("e-Compta IA API")
                        .version("0.1.0")
                        .description("""
                                API REST de la plateforme comptable IA multi-tenant SYSCOHADA.

                                Toutes les routes (sauf /api/auth) nécessitent un token JWT Bearer.
                                Utilisez **POST /api/auth/login** pour obtenir votre token, puis cliquez
                                sur **Authorize** en haut de cette page.
                                """)
                        .contact(new Contact()
                                .name("eDefence")
                                .email("contact@edefence.com"))
                        .license(new License()
                                .name("Propriétaire — eDefence")
                                .url("https://edefence.com")))
                .servers(List.of(
                        new Server().url(serverUrl).description("Serveur courant")))
                .externalDocs(new ExternalDocumentation()
                        .description("Documentation utilisateur")
                        .url("https://docs.edefence.com"))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_SCHEME))
                .components(new Components()
                        .addSecuritySchemes(BEARER_SCHEME, new SecurityScheme()
                                .name(BEARER_SCHEME)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .description("Insérez votre token JWT (sans le préfixe Bearer)")));
    }

    // ─── Groupes par domaine ──────────────────────────────────────────────────

    @Bean
    public GroupedOpenApi authApi() {
        return GroupedOpenApi.builder()
                .group("01-authentification")
                .displayName("Authentification")
                .pathsToMatch("/api/auth/**")
                .build();
    }

    @Bean
    public GroupedOpenApi comptabiliteApi() {
        return GroupedOpenApi.builder()
                .group("02-comptabilite")
                .displayName("Comptabilité")
                .pathsToMatch(
                        "/api/ecritures/**", "/api/plan-comptes/**",
                        "/api/exercices/**", "/api/cloture/**",
                        "/api/modeles/**", "/api/lettrage/**",
                        "/api/analytique/**")
                .build();
    }

    @Bean
    public GroupedOpenApi etatsApi() {
        return GroupedOpenApi.builder()
                .group("03-etats-financiers")
                .displayName("États financiers")
                .pathsToMatch("/api/etats/**", "/api/liasse-fiscale/**")
                .build();
    }

    @Bean
    public GroupedOpenApi tiersApi() {
        return GroupedOpenApi.builder()
                .group("04-tiers-facturation")
                .displayName("Tiers & Facturation")
                .pathsToMatch(
                        "/api/tiers/**", "/api/factures/**",
                        "/api/devis/**", "/api/relances/**",
                        "/api/abonnements/**")
                .build();
    }

    @Bean
    public GroupedOpenApi fiscalApi() {
        return GroupedOpenApi.builder()
                .group("05-fiscal-social")
                .displayName("Fiscal & Social")
                .pathsToMatch(
                        "/api/tva/**", "/api/is/**",
                        "/api/gestion-fiscale/**", "/api/gestion-sociale/**",
                        "/api/paie/**", "/api/conges/**",
                        "/api/evaluations/**", "/api/formation/**",
                        "/api/discipline/**", "/api/recrutement/**",
                        "/api/prets/**", "/api/temps-presences/**",
                        "/api/notes-frais/**", "/api/notes-annexes-fiscales/**")
                .build();
    }

    @Bean
    public GroupedOpenApi pilotageApi() {
        return GroupedOpenApi.builder()
                .group("06-pilotage")
                .displayName("Pilotage & Reporting")
                .pathsToMatch(
                        "/api/dashboard/**", "/api/pilotage/**",
                        "/api/kpi-executif/**", "/api/ratios/**",
                        "/api/reporting/**", "/api/budget/**",
                        "/api/budget-rh/**", "/api/alertes/**",
                        "/api/stream/**")
                .build();
    }

    @Bean
    public GroupedOpenApi operationsApi() {
        return GroupedOpenApi.builder()
                .group("07-operations")
                .displayName("Opérations")
                .pathsToMatch(
                        "/api/immobilisations/**", "/api/rapprochement/**",
                        "/api/balance-agee/**", "/api/previsions-tresorerie/**",
                        "/api/regularisations/**", "/api/affectation/**",
                        "/api/approbations/**", "/api/devises/**",
                        "/api/consolidation/**", "/api/documents/**",
                        "/api/documents-rh/**")
                .build();
    }

    @Bean
    public GroupedOpenApi adminApi() {
        return GroupedOpenApi.builder()
                .group("08-administration")
                .displayName("Administration")
                .pathsToMatch(
                        "/api/admin/**", "/api/parametres/**",
                        "/api/audit/**", "/api/referentiel/**",
                        "/api/export/**", "/api/import-fec/**",
                        "/api/portail/**")
                .build();
    }
}
