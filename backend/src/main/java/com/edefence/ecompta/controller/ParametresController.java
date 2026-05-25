package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.parametres.ParametresDto;
import com.edefence.ecompta.service.ParametresService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/parametres")
@RequiredArgsConstructor
public class ParametresController {

    private final ParametresService service;

    @GetMapping
    public ParametresDto.EntrepriseResponse get() {
        return service.get(TenantContext.get());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ParametresDto.EntrepriseResponse update(@RequestBody ParametresDto.UpdateRequest req) {
        return service.update(TenantContext.get(), req);
    }
}
