package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.alerte.AlerteDto;
import com.edefence.ecompta.service.AlerteService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/alertes")
@RequiredArgsConstructor
public class AlerteController {

    private final AlerteService service;

    @GetMapping
    public AlerteDto.AlerteResponse getAlertes() {
        return service.getAlertes(TenantContext.get());
    }
}
