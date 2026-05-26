package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.alerte.AlerteDto;
import com.edefence.ecompta.service.AlerteService;
import com.edefence.ecompta.service.EmailNotificationService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
public class AlerteController {

    private final AlerteService            service;
    private final EmailNotificationService emailService;

    @GetMapping
    public AlerteDto.AlerteResponse getAlertes() {
        return service.getAlertes(TenantContext.get());
    }

    @PostMapping("/test-email")
    public ResponseEntity<Void> testEmail() {
        emailService.sendTestEmail(TenantContext.get());
        return ResponseEntity.ok().build();
    }
}
