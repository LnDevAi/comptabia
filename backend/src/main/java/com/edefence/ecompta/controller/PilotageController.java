package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.pilotage.PilotageDto;
import com.edefence.ecompta.service.PilotageService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/pilotage")
@RequiredArgsConstructor
public class PilotageController {

    private final PilotageService svc;

    @GetMapping
    public PilotageDto.Response get(@RequestParam(defaultValue = "0") int exercice) {
        int year = exercice > 0 ? exercice : LocalDate.now().getYear();
        return svc.getTableauBord(TenantContext.get(), year);
    }
}
