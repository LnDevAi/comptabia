package com.edefence.ecompta.licence;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.List;
import java.util.Map;

import static com.edefence.ecompta.licence.LicenceModule.*;
import static java.util.Map.entry;

@Component
@RequiredArgsConstructor
public class LicenceInterceptor implements HandlerInterceptor {

    private final LicenceService licenceService;

    // Endpoints exemptés de toute vérification de licence
    private static final List<String> EXEMPT_PREFIXES = List.of(
            "/api/auth", "/api/portail", "/api/portail-associe",
            "/api/crm/track", "/api/licence", "/api/referentiel",
            "/actuator", "/v3/api-docs", "/swagger-ui", "/error"
    );

    // Mapping préfixe URL → module requis
    private static final Map<String, LicenceModule> MODULE_MAP = Map.ofEntries(
            // COMPTABILITE
            entry("/api/comptes",          COMPTABILITE),
            entry("/api/ecritures",        COMPTABILITE),
            entry("/api/etats",            COMPTABILITE),
            entry("/api/cloture",          COMPTABILITE),
            entry("/api/lettrage",         COMPTABILITE),
            entry("/api/analytique",       COMPTABILITE),
            entry("/api/affectation",      COMPTABILITE),
            entry("/api/balance-agee",     COMPTABILITE),
            entry("/api/regularisations",  COMPTABILITE),
            entry("/api/devises",          COMPTABILITE),
            entry("/api/modeles",          COMPTABILITE),
            // TIERS
            entry("/api/tiers",            TIERS),
            // IMMOBILISATIONS
            entry("/api/immobilisations",  IMMOBILISATIONS),
            // FISCAL
            entry("/api/tva",              FISCAL),
            entry("/api/is",               FISCAL),
            entry("/api/fiscal",           FISCAL),
            entry("/api/notes-annexes-fiscales", FISCAL),
            entry("/api/liasse-fiscale",   FISCAL),
            // BUDGET
            entry("/api/budgets",          BUDGET),
            // TRESORERIE
            entry("/api/rapprochement",    TRESORERIE),
            entry("/api/previsions-tresorerie", TRESORERIE),
            // FACTURATION
            entry("/api/factures",         FACTURATION),
            entry("/api/devis",            FACTURATION),
            entry("/api/relances",         FACTURATION),
            // EXPORT
            entry("/api/export",           EXPORT),
            entry("/api/import-fec",       EXPORT),
            // DOCUMENTS
            entry("/api/documents",        DOCUMENTS),
            // PAIE_RH
            entry("/api/paie",             PAIE_RH),
            entry("/api/budget-rh",        PAIE_RH),
            entry("/api/conges",           PAIE_RH),
            entry("/api/evaluations",      PAIE_RH),
            entry("/api/formation",        PAIE_RH),
            entry("/api/discipline",       PAIE_RH),
            entry("/api/dashboard-rh",     PAIE_RH),
            entry("/api/temps-presences",  PAIE_RH),
            entry("/api/recrutement",      PAIE_RH),
            entry("/api/prets",            PAIE_RH),
            entry("/api/notes-frais",      PAIE_RH),
            entry("/api/social",           PAIE_RH),
            entry("/api/documents-rh",     PAIE_RH),
            // CRM
            entry("/api/crm",              CRM),
            // IA
            entry("/api/ia",               IA),
            // CONSOLIDATION
            entry("/api/consolidation",    CONSOLIDATION),
            // AUDIT
            entry("/api/audit",            AUDIT),
            // PILOTAGE
            entry("/api/ratios",           PILOTAGE),
            entry("/api/pilotage",         PILOTAGE),
            entry("/api/kpi-executif",     PILOTAGE),
            entry("/api/dashboard-global", PILOTAGE),
            entry("/api/reporting",        PILOTAGE),
            // ASSURANCE
            entry("/api/provisions-techniques",    ASSURANCE),
            entry("/api/documents-reglementaires", ASSURANCE),
            // MICROFINANCE
            entry("/api/credits-sfd",      MICROFINANCE),
            // FINANCE_ISLAMIQUE
            entry("/api/finance-islamique", FINANCE_ISLAMIQUE),
            // GOUVERNANCE
            entry("/api/gouvernance",      GOUVERNANCE)
    );

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse res, Object handler) throws Exception {
        String uri = req.getRequestURI();

        // Exemptions
        for (String exempt : EXEMPT_PREFIXES) {
            if (uri.startsWith(exempt)) return true;
        }

        // Licence valide ?
        if (!licenceService.isValid()) {
            res.sendError(402, "Licence invalide ou manquante — " + licenceService.getLoadError());
            return false;
        }

        // Vérification du module requis
        for (var e : MODULE_MAP.entrySet()) {
            if (uri.startsWith(e.getKey())) {
                if (!licenceService.hasModule(e.getValue())) {
                    res.sendError(402, "Module " + e.getValue() + " non inclus dans votre licence");
                    return false;
                }
                return true;
            }
        }
        return true;
    }
}
