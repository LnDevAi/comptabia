package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.dashboard.DashboardRhDto;
import com.edefence.ecompta.service.DashboardRhService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard-rh")
@RequiredArgsConstructor
public class DashboardRhController {

    private final DashboardRhService svc;

    @GetMapping
    public DashboardRhDto.DashboardRh get() {
        return svc.buildDashboard(TenantContext.get());
    }
}
