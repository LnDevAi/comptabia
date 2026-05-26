package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.liasse.LiasseFiscaleDto;
import com.edefence.ecompta.service.LiasseFiscaleService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/liasse-fiscale")
@RequiredArgsConstructor
public class LiasseFiscaleController {

    private final LiasseFiscaleService service;

    @GetMapping
    public LiasseFiscaleDto.Response get(
            @RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : LocalDate.now().getYear();
        return service.get(TenantContext.get(), annee);
    }
}
