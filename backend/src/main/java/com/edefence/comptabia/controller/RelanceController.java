package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.relance.RelanceDto;
import com.edefence.comptabia.service.RelanceService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/relances")
@RequiredArgsConstructor
public class RelanceController {

    private final RelanceService service;

    @GetMapping("/impayes")
    public RelanceDto.ListeImpayes getImpayes() {
        return service.getImpayes(TenantContext.get());
    }

    @GetMapping
    public List<RelanceDto.RelanceRecord> lister() {
        return service.lister(TenantContext.get());
    }

    @GetMapping("/tiers/{tiersId}")
    public List<RelanceDto.RelanceRecord> listerParTiers(@PathVariable UUID tiersId) {
        return service.listerParTiers(TenantContext.get(), tiersId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RelanceDto.RelanceRecord creer(@RequestBody RelanceDto.CreerRelanceRequest req) {
        return service.creer(TenantContext.get(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable UUID id) {
        service.supprimer(TenantContext.get(), id);
    }
}
