package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.paie.PayeDto;
import com.edefence.comptabia.service.PayeService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/paie")
@RequiredArgsConstructor
public class PayeController {

    private final PayeService svc;

    @GetMapping
    public List<PayeDto.Response> lister(
            @RequestParam(defaultValue = "0") int exercice) {
        int year = exercice > 0 ? exercice : LocalDate.now().getYear();
        return svc.lister(TenantContext.get(), year);
    }

    @PostMapping("/{exercice}")
    @ResponseStatus(HttpStatus.CREATED)
    public PayeDto.Response sauvegarder(
            @PathVariable int exercice,
            @Valid @RequestBody PayeDto.SauvegarderRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return svc.sauvegarder(TenantContext.get(), exercice, req, user.getUsername());
    }

    @PostMapping("/{id}/comptabiliser")
    public PayeDto.Response comptabiliser(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserDetails user) {
        return svc.comptabiliser(TenantContext.get(), id, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable UUID id) {
        svc.supprimer(TenantContext.get(), id);
    }
}
