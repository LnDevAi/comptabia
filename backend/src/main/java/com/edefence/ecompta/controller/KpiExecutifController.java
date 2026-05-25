package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.kpi.KpiExecutifDto;
import com.edefence.ecompta.service.KpiExecutifService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/kpi-executif")
@RequiredArgsConstructor
public class KpiExecutifController {

    private final KpiExecutifService service;

    @GetMapping
    public KpiExecutifDto.Response get(
            @RequestParam(defaultValue = "0") int exercice) {
        int year = exercice > 0 ? exercice : LocalDate.now().getYear();
        return service.get(TenantContext.get(), year);
    }
}
