package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.DashboardDto;
import com.edefence.comptabia.dto.DashboardStatsDto;
import com.edefence.comptabia.service.DashboardService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Tableau de bord", description = "KPIs et statistiques globales de l'entreprise")
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping
    public DashboardDto get() {
        return service.get(TenantContext.get());
    }

    @GetMapping("/stats")
    public DashboardStatsDto stats() {
        return service.stats(TenantContext.get());
    }
}
