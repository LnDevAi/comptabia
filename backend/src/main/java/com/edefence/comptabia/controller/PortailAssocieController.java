package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.gouvernance.AssembleeDto;
import com.edefence.comptabia.service.AssocieService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Tag(name = "Portail associé", description = "Accès en lecture seule pour les associés (token permanent)")
@RestController
@RequestMapping("/api/portail-associe")
@RequiredArgsConstructor
public class PortailAssocieController {

    private final AssocieService svc;

    @Operation(summary = "Accès portail associé — états financiers + AG/CA")
    @GetMapping("/{token}")
    public AssembleeDto.PortailResponse getPortail(@PathVariable UUID token) {
        return svc.getPortail(token);
    }
}
