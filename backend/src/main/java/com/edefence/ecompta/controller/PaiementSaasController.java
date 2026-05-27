package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.paiement.InitPaiementRequest;
import com.edefence.ecompta.dto.paiement.InitPaiementResponse;
import com.edefence.ecompta.dto.paiement.PlanPublicDto;
import com.edefence.ecompta.dto.paiement.SouscriptionSaasDto;
import com.edefence.ecompta.service.PaiementSaasService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PaiementSaasController {

    private final PaiementSaasService svc;

    // ── Plans publics (sans auth) ─────────────────────────────────────────────
    @GetMapping("/api/public/plans")
    public List<PlanPublicDto> getPlans() {
        return svc.getPlans();
    }

    // ── Initier paiement (utilisateur connecté) ───────────────────────────────
    @PostMapping("/api/paiement/init")
    public ResponseEntity<InitPaiementResponse> init(@Valid @RequestBody InitPaiementRequest req) {
        UUID entrepriseId = TenantContext.get();
        return ResponseEntity.ok(svc.initier(entrepriseId, req));
    }

    // ── CinetPay webhook (sans auth, appelé par CinetPay) ────────────────────
    @PostMapping("/api/public/paiement/cinetpay/notify")
    public ResponseEntity<Void> cinetpayNotify(@RequestBody Map<String, Object> payload) {
        svc.handleCinetPayNotify(payload);
        return ResponseEntity.ok().build();
    }

    // ── Stripe webhook (sans auth, appelé par Stripe) ─────────────────────────
    @PostMapping("/api/public/paiement/stripe/webhook")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sig) {
        svc.handleStripeWebhook(payload, sig);
        return ResponseEntity.ok().build();
    }

    // ── Admin : lister toutes les souscriptions ────────────────────────────────
    @GetMapping("/api/admin/souscriptions")
    @PreAuthorize("hasRole('ADMIN')")
    public List<SouscriptionSaasDto> listAll() {
        return svc.listAll();
    }

    // ── Admin : souscriptions en attente (virements) ───────────────────────────
    @GetMapping("/api/admin/souscriptions/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public List<SouscriptionSaasDto> listEnAttente() {
        return svc.listEnAttente();
    }

    // ── Admin : confirmer un virement ─────────────────────────────────────────
    @PostMapping("/api/admin/souscriptions/{id}/confirmer-virement")
    @PreAuthorize("hasRole('ADMIN')")
    public SouscriptionSaasDto confirmerVirement(@PathVariable UUID id) {
        return svc.confirmerVirement(id);
    }

    // ── Utilisateur : ses propres souscriptions ────────────────────────────────
    @GetMapping("/api/paiement/mes-souscriptions")
    public List<SouscriptionSaasDto> mesSouscriptions() {
        return svc.listByEntreprise(TenantContext.get());
    }
}
