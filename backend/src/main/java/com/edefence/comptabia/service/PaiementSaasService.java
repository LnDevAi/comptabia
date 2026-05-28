package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.PlanTarifaire;
import com.edefence.comptabia.domain.SouscriptionSaas;
import com.edefence.comptabia.domain.SouscriptionSaas.ModePaiement;
import com.edefence.comptabia.domain.SouscriptionSaas.Periodicite;
import com.edefence.comptabia.domain.SouscriptionSaas.Statut;
import com.edefence.comptabia.dto.paiement.InitPaiementRequest;
import com.edefence.comptabia.dto.paiement.InitPaiementResponse;
import com.edefence.comptabia.dto.paiement.InitPaiementResponse.VirementDetails;
import com.edefence.comptabia.dto.paiement.PlanPublicDto;
import com.edefence.comptabia.dto.paiement.SouscriptionSaasDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.PlanTarifaireRepository;
import com.edefence.comptabia.repository.SouscriptionSaasRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaiementSaasService {

    private final PlanTarifaireRepository planRepo;
    private final SouscriptionSaasRepository souscriptionRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final RestTemplate restTemplate;

    @Value("${paiement.cinetpay.api-key:}") private String cinetpayApiKey;
    @Value("${paiement.cinetpay.site-id:}") private String cinetpaySiteId;
    @Value("${paiement.cinetpay.base-url:https://api-checkout.cinetpay.com/v2}") private String cinetpayBaseUrl;
    @Value("${paiement.cinetpay.notify-url:}") private String cinetpayNotifyUrl;

    @Value("${paiement.stripe.secret-key:}") private String stripeSecretKey;
    @Value("${paiement.stripe.webhook-secret:}") private String stripeWebhookSecret;
    @Value("${paiement.stripe.success-url:http://localhost:4200/paiement/succes}") private String stripeSuccessUrl;
    @Value("${paiement.stripe.cancel-url:http://localhost:4200/tarifs}") private String stripeCancelUrl;

    @Value("${paiement.virement.banque:Coris Bank International}") private String virementBanque;
    @Value("${paiement.virement.titulaire:eDefence SAS}") private String virementTitulaire;
    @Value("${paiement.virement.iban:BF00 0000 0000 0000 0000 0000 000}") private String virementIban;
    @Value("${paiement.virement.swift:COBIBFBF}") private String virementSwift;

    @Value("${app.frontend-url:http://localhost:4200}") private String frontendUrl;

    // ── Plans publics ────────────────────────────────────────────────────────
    public List<PlanPublicDto> getPlans() {
        return planRepo.findByActifTrue().stream()
            .map(p -> new PlanPublicDto(
                p.getCode(), p.getNom(), p.getDescription(),
                p.getPrixMensuel(), p.getPrixAnnuel(),
                p.getModulesList(), p.getMaxUtilisateurs(),
                "PRO".equals(p.getCode())
            ))
            .toList();
    }

    // ── Initier un paiement ──────────────────────────────────────────────────
    @Transactional
    public InitPaiementResponse initier(UUID entrepriseId, InitPaiementRequest req) {
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
            .orElseThrow(() -> new IllegalArgumentException("Entreprise introuvable"));

        PlanTarifaire plan = planRepo.findByActifTrue().stream()
            .filter(p -> p.getCode().equalsIgnoreCase(req.planCode()))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Plan introuvable : " + req.planCode()));

        BigDecimal montant = Periodicite.ANNUEL.equals(req.periodicite())
            ? plan.getPrixAnnuel() : plan.getPrixMensuel();

        SouscriptionSaas s = new SouscriptionSaas();
        s.setEntreprise(entreprise);
        s.setPlanCode(req.planCode().toUpperCase());
        s.setPeriodicite(req.periodicite());
        s.setMontant(montant);
        s.setModePaiement(req.modePaiement());
        s.setCustomerName(req.customerName());
        s.setCustomerEmail(req.customerEmail());
        s = souscriptionRepo.save(s);

        return switch (req.modePaiement()) {
            case CINETPAY -> initierCinetPay(s, plan);
            case STRIPE   -> initierStripe(s, plan);
            case VIREMENT -> initierVirement(s);
        };
    }

    // ── CinetPay ─────────────────────────────────────────────────────────────
    private InitPaiementResponse initierCinetPay(SouscriptionSaas s, PlanTarifaire plan) {
        String txId = "ECP-" + s.getId().toString().replace("-", "").substring(0, 16).toUpperCase();
        s.setTransactionId(txId);

        Map<String, Object> body = new HashMap<>();
        body.put("apikey",         cinetpayApiKey);
        body.put("site_id",        cinetpaySiteId);
        body.put("transaction_id", txId);
        body.put("amount",         s.getMontant().intValue());
        body.put("currency",       "XOF");
        body.put("description",    "Abonnement e-Compta " + plan.getNom() + " – " + s.getPeriodicite().name());
        body.put("notify_url",     cinetpayNotifyUrl);
        body.put("return_url",     frontendUrl + "/paiement/succes?tx=" + txId);
        body.put("customer_name",  s.getCustomerName());
        body.put("customer_email", s.getCustomerEmail());
        body.put("channels",       "ALL");
        body.put("metadata",       s.getId().toString());

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                cinetpayBaseUrl + "/payment", HttpMethod.POST,
                new HttpEntity<>(body, headers),
                new ParameterizedTypeReference<>() {});

            Map<String, Object> data = extractCinetPayData(resp.getBody());
            String paymentUrl = (String) data.get("payment_url");
            s.setPaymentUrl(paymentUrl);
            souscriptionRepo.save(s);

            return new InitPaiementResponse(s.getId(), "EN_ATTENTE", "CINETPAY",
                paymentUrl, null, s.getMontant(), s.getPlanCode(), s.getPeriodicite().name());
        } catch (Exception e) {
            log.error("CinetPay init error: {}", e.getMessage());
            s.setStatut(Statut.ECHEC);
            souscriptionRepo.save(s);
            throw new RuntimeException("Erreur CinetPay : " + e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractCinetPayData(Map<String, Object> body) {
        if (body == null) throw new RuntimeException("Réponse CinetPay vide");
        Object data = body.get("data");
        if (data instanceof Map<?, ?> m) return (Map<String, Object>) m;
        throw new RuntimeException("Format réponse CinetPay inattendu");
    }

    @Transactional
    public void handleCinetPayNotify(Map<String, Object> payload) {
        String txId = (String) payload.get("cpm_trans_id");
        if (txId == null) return;
        souscriptionRepo.findByTransactionId(txId).ifPresent(s -> {
            String status = verifierCinetPay(txId);
            if ("ACCEPTED".equals(status)) confirmerSouscription(s);
            else { s.setStatut(Statut.ECHEC); souscriptionRepo.save(s); }
        });
    }

    private String verifierCinetPay(String txId) {
        try {
            String url = cinetpayBaseUrl + "/payment/check?apikey=" + cinetpayApiKey
                + "&site_id=" + cinetpaySiteId + "&transaction_id=" + txId;
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            Map<String, Object> data = extractCinetPayData(resp.getBody());
            return (String) data.get("status");
        } catch (Exception e) {
            log.error("CinetPay verify error: {}", e.getMessage());
            return "ERROR";
        }
    }

    // ── Stripe (REST natif, sans SDK) ─────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private InitPaiementResponse initierStripe(SouscriptionSaas s, PlanTarifaire plan) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.setBearerAuth(stripeSecretKey);

            long montantCentimes = s.getMontant().multiply(BigDecimal.valueOf(100)).longValue();
            MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
            form.add("mode", "payment");
            form.add("success_url", stripeSuccessUrl + "?session_id={CHECKOUT_SESSION_ID}");
            form.add("cancel_url", stripeCancelUrl);
            form.add("customer_email", s.getCustomerEmail());
            form.add("metadata[souscriptionId]", s.getId().toString());
            form.add("line_items[0][quantity]", "1");
            form.add("line_items[0][price_data][currency]", "xof");
            form.add("line_items[0][price_data][unit_amount]", String.valueOf(montantCentimes));
            form.add("line_items[0][price_data][product_data][name]", "e-Compta " + plan.getNom());
            form.add("line_items[0][price_data][product_data][description]",
                plan.getDescription() + " — " + s.getPeriodicite().name());

            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                "https://api.stripe.com/v1/checkout/sessions", HttpMethod.POST,
                new HttpEntity<>(form, headers),
                new ParameterizedTypeReference<>() {});

            Map<String, Object> body = resp.getBody();
            if (body == null) throw new RuntimeException("Réponse Stripe vide");
            String sessionId = (String) body.get("id");
            String url = (String) body.get("url");

            s.setStripeSessionId(sessionId);
            s.setPaymentUrl(url);
            souscriptionRepo.save(s);

            return new InitPaiementResponse(s.getId(), "EN_ATTENTE", "STRIPE",
                url, null, s.getMontant(), s.getPlanCode(), s.getPeriodicite().name());
        } catch (Exception e) {
            log.error("Stripe init error: {}", e.getMessage());
            s.setStatut(Statut.ECHEC);
            souscriptionRepo.save(s);
            throw new RuntimeException("Erreur Stripe : " + e.getMessage());
        }
    }

    @Transactional
    public void handleStripeWebhook(String payload, String sigHeader) {
        if (!verifyStripeSignature(payload, sigHeader)) {
            log.warn("Stripe webhook signature invalide");
            return;
        }
        try {
            // Parsing minimal JSON pour extraire type et session id
            if (payload.contains("\"checkout.session.completed\"")) {
                String sessionId = extractStripeSessionId(payload);
                if (sessionId != null) {
                    souscriptionRepo.findByStripeSessionId(sessionId)
                        .ifPresent(this::confirmerSouscription);
                }
            }
        } catch (Exception e) {
            log.error("Stripe webhook error: {}", e.getMessage());
        }
    }

    private boolean verifyStripeSignature(String payload, String sigHeader) {
        if (stripeWebhookSecret == null || stripeWebhookSecret.isBlank()) return true;
        if (sigHeader == null) return false;
        try {
            String ts = null;
            String v1 = null;
            for (String part : sigHeader.split(",")) {
                if (part.startsWith("t="))  ts = part.substring(2);
                if (part.startsWith("v1=")) v1 = part.substring(3);
            }
            if (ts == null || v1 == null) return false;
            String signed = ts + "." + payload;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(stripeWebhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(signed.getBytes(StandardCharsets.UTF_8)));
            return expected.equals(v1);
        } catch (Exception e) {
            return false;
        }
    }

    private String extractStripeSessionId(String json) {
        int idx = json.indexOf("\"cs_");
        if (idx < 0) return null;
        int end = json.indexOf("\"", idx + 1);
        return end > idx ? json.substring(idx + 1, end) : null;
    }

    // ── Virement ─────────────────────────────────────────────────────────────
    private InitPaiementResponse initierVirement(SouscriptionSaas s) {
        String ref = "ECP-VIR-" + s.getId().toString().substring(0, 8).toUpperCase();
        s.setReferenceVirement(ref);
        souscriptionRepo.save(s);

        VirementDetails details = new VirementDetails(
            virementBanque, virementTitulaire, virementIban, virementSwift, ref,
            s.getMontant(),
            "Effectuez le virement en indiquant la référence " + ref +
            " en objet. Votre abonnement sera activé sous 24–48h après réception."
        );
        return new InitPaiementResponse(s.getId(), "EN_ATTENTE", "VIREMENT",
            null, details, s.getMontant(), s.getPlanCode(), s.getPeriodicite().name());
    }

    @Transactional
    public SouscriptionSaasDto confirmerVirement(UUID souscriptionId) {
        SouscriptionSaas s = souscriptionRepo.findById(souscriptionId)
            .orElseThrow(() -> new IllegalArgumentException("Souscription introuvable"));
        if (!ModePaiement.VIREMENT.equals(s.getModePaiement())) {
            throw new IllegalStateException("Cette souscription n'est pas un virement");
        }
        confirmerSouscription(s);
        return SouscriptionSaasDto.from(s);
    }

    // ── Activation entreprise ─────────────────────────────────────────────────
    private void confirmerSouscription(SouscriptionSaas s) {
        s.setStatut(Statut.CONFIRME);
        s.setConfirmedAt(ZonedDateTime.now());

        LocalDate debut = LocalDate.now();
        LocalDate fin   = Periodicite.ANNUEL.equals(s.getPeriodicite())
            ? debut.plusYears(1) : debut.plusMonths(1);
        s.setDateDebut(debut);
        s.setDateFin(fin);
        souscriptionRepo.save(s);

        Entreprise e = s.getEntreprise();
        e.setPlanExpiration(fin);
        e.setStatutAbonnement("ACTIF");
        try {
            Entreprise.PlanType pt = Entreprise.PlanType.valueOf(s.getPlanCode());
            e.setPlan(pt);
        } catch (IllegalArgumentException ex) {
            e.setPlan(Entreprise.PlanType.PRO);
        }
        entrepriseRepo.save(e);
        log.info("Souscription {} confirmée — entreprise {} plan {} jusqu'au {}",
            s.getId(), e.getId(), s.getPlanCode(), fin);
    }

    // ── Consultation ──────────────────────────────────────────────────────────
    public List<SouscriptionSaasDto> listAll() {
        return souscriptionRepo.findAll().stream().map(SouscriptionSaasDto::from).toList();
    }

    public List<SouscriptionSaasDto> listEnAttente() {
        return souscriptionRepo.findByStatutOrderByCreatedAtDesc(Statut.EN_ATTENTE)
            .stream().map(SouscriptionSaasDto::from).toList();
    }

    public List<SouscriptionSaasDto> listByEntreprise(UUID entrepriseId) {
        return souscriptionRepo.findByEntrepriseIdOrderByCreatedAtDesc(entrepriseId)
            .stream().map(SouscriptionSaasDto::from).toList();
    }
}
