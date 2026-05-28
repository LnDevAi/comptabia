package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.dashboard.DashboardRhDto;
import com.edefence.comptabia.service.DashboardRhService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard-rh")
@RequiredArgsConstructor
public class DashboardRhController {

    private final DashboardRhService svc;

    @GetMapping
    public DashboardRhDto.DashboardRh get() {
        return svc.buildDashboard(TenantContext.get());
    }

    @GetMapping("/comparatif")
    public DashboardRhDto.ComparatifRh getComparatif(
            @RequestParam(required = false) Integer annee) {
        int a = annee != null ? annee : LocalDate.now().getYear();
        return svc.buildComparatif(TenantContext.get(), a);
    }
}
