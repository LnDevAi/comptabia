package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.liasse.LiasseFiscaleDto;
import com.edefence.ecompta.service.LiasseFiscaleService;
import com.edefence.ecompta.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@Tag(name = "États financiers", description = "Balance, Bilan, Compte de résultat, Grand livre, Journal, TFT, EVCAP, Notes annexes, SMT, Import balance")
@RestController
@RequestMapping("/api/liasse-fiscale")
@RequiredArgsConstructor
public class LiasseFiscaleController {

    private final LiasseFiscaleService service;

    @Operation(summary = "Liasse fiscale SYSCOHADA", description = "Assemble Bilan + CR + TFT + EVCAP + Notes annexes pour le dépôt légal OHADA")
    @GetMapping
    public LiasseFiscaleDto.Response get(
            @RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : LocalDate.now().getYear();
        return service.get(TenantContext.get(), annee);
    }
}
