package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.DashboardDto;
import com.edefence.ecompta.service.DashboardService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService service;

    @GetMapping
    public DashboardDto get() {
        return service.get(TenantContext.get());
    }
}
