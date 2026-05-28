package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.pilotage.PilotageDto;
import com.edefence.comptabia.service.PilotageService;
import com.edefence.comptabia.tenant.TenantContext;
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
