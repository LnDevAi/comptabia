package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.alerte.AlerteDto;
import com.edefence.ecompta.service.AlerteService;
import com.edefence.ecompta.service.EmailNotificationService;
import com.edefence.ecompta.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Alertes", description = "Alertes comptables automatiques et notifications email")
@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
public class AlerteController {

    private final AlerteService            service;
    private final EmailNotificationService emailService;

    @Operation(summary = "Liste des alertes", description = "Retourne toutes les alertes détectées automatiquement (exercice non clôturé, brouillons, TVA, budgets dépassés, mises en demeure)")
    @GetMapping
    public AlerteDto.AlerteResponse getAlertes() {
        return service.getAlertes(TenantContext.get());
    }

    @Operation(summary = "Envoyer un email de test", description = "Déclenche immédiatement l'envoi du digest email vers les administrateurs actifs. Nécessite MAIL_ENABLED=true.")
    @PostMapping("/test-email")
    public ResponseEntity<Void> testEmail() {
        emailService.sendTestEmail(TenantContext.get());
        return ResponseEntity.ok().build();
    }
}
