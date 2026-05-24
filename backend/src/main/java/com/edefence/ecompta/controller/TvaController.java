package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.tva.TvaDto;
import com.edefence.ecompta.service.TvaService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tva")
@RequiredArgsConstructor
public class TvaController {

    private final TvaService service;

    @GetMapping
    public List<TvaDto.Declaration> lister() {
        return service.lister(TenantContext.get());
    }

    @GetMapping("/simuler")
    public TvaDto.Simulation simuler(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return service.simuler(TenantContext.get(), debut, fin);
    }

    @PostMapping("/valider")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TvaDto.Declaration valider(@Valid @RequestBody TvaDto.ValiderRequest req,
                                      @AuthenticationPrincipal UserDetails user) {
        return service.valider(TenantContext.get(), req.periodeDebut(), req.periodeFin(), user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimer(@PathVariable UUID id) {
        service.supprimer(id, TenantContext.get());
    }
}
