package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.dashboard.DashboardGlobalDto;
import com.edefence.ecompta.service.DashboardGlobalService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard-global")
@RequiredArgsConstructor
public class DashboardGlobalController {

    private final DashboardGlobalService service;

    @GetMapping
    public DashboardGlobalDto.Response get(
            @RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : LocalDate.now().getYear();
        return service.get(TenantContext.get(), annee);
    }
}
