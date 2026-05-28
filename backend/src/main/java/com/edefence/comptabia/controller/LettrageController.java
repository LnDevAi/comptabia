package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.lettrage.LettrageDto;
import com.edefence.comptabia.service.LettrageService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lettrage")
@RequiredArgsConstructor
public class LettrageController {

    private final LettrageService service;

    @GetMapping("/{compteNumero}")
    public LettrageDto.CompteLettrageView getLignes(@PathVariable String compteNumero) {
        return service.getLignes(TenantContext.get(), compteNumero);
    }

    @PostMapping("/{compteNumero}/lettrer")
    public LettrageDto.LettrageResult lettrer(
            @PathVariable String compteNumero,
            @RequestBody LettrageDto.LettrerRequest req) {
        return service.lettrer(TenantContext.get(), compteNumero, req.ligneIds());
    }

    @PostMapping("/{compteNumero}/delettrer")
    public void delettrer(
            @PathVariable String compteNumero,
            @RequestBody LettrageDto.DelettrerRequest req) {
        service.delettrer(TenantContext.get(), compteNumero, req.lettre());
    }
}
