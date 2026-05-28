package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.ratios.RatiosDto;
import com.edefence.comptabia.service.RatiosFinanciersService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/ratios")
@RequiredArgsConstructor
public class RatiosFinanciersController {

    private final RatiosFinanciersService svc;

    @GetMapping
    public RatiosDto.Response calculer(@RequestParam(defaultValue = "0") int exercice) {
        int year = exercice > 0 ? exercice : LocalDate.now().getYear();
        return svc.calculer(TenantContext.get(), year);
    }
}
