package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.previsions.PrevisionsTresorerieDto;
import com.edefence.ecompta.service.PrevisionsTresorerieService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/previsions-tresorerie")
@RequiredArgsConstructor
public class PrevisionsTresorerieController {

    private final PrevisionsTresorerieService service;

    @GetMapping
    public PrevisionsTresorerieDto.Response getProjection(
            @RequestParam(defaultValue = "13") int semaines,
            @RequestParam(defaultValue = "0")  BigDecimal seuil) {
        return service.getProjection(TenantContext.get(), semaines, seuil);
    }

    @GetMapping("/flux")
    public List<PrevisionsTresorerieDto.FluxResponse> listFlux() {
        return service.listFlux(TenantContext.get());
    }

    @PostMapping("/flux")
    @ResponseStatus(HttpStatus.CREATED)
    public PrevisionsTresorerieDto.FluxResponse addFlux(
            @RequestBody PrevisionsTresorerieDto.FluxRequest req) {
        return service.saveFlux(TenantContext.get(), req);
    }

    @DeleteMapping("/flux/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteFlux(@PathVariable UUID id) {
        service.deleteFlux(TenantContext.get(), id);
    }
}
