package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.is.DeclarationIsDto;
import com.edefence.ecompta.service.DeclarationIsService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/is")
@RequiredArgsConstructor
public class DeclarationIsController {

    private final DeclarationIsService svc;

    @GetMapping
    public List<DeclarationIsDto.Response> lister() {
        return svc.lister(TenantContext.get());
    }

    @GetMapping("/{exercice}")
    public DeclarationIsDto.Response getOrCompute(@PathVariable int exercice) {
        return svc.getOrCompute(TenantContext.get(), exercice);
    }

    @PutMapping("/{exercice}")
    public DeclarationIsDto.Response sauvegarder(
            @PathVariable int exercice,
            @RequestBody DeclarationIsDto.SaveRequest req) {
        return svc.sauvegarder(TenantContext.get(), exercice, req);
    }

    @PostMapping("/{exercice}/valider")
    public DeclarationIsDto.Response valider(
            @PathVariable int exercice,
            @AuthenticationPrincipal UserDetails user) {
        return svc.valider(TenantContext.get(), exercice, user.getUsername());
    }
}
