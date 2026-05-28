package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.social.SocialDto;
import com.edefence.comptabia.service.GestionSocialeService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/social")
@RequiredArgsConstructor
public class GestionSocialeController {

    private final GestionSocialeService svc;

    @GetMapping("/ref")
    public List<SocialDto.CotisationRefResponse> refParPays(@RequestParam String codePays) {
        return svc.refParPays(codePays);
    }

    @GetMapping("/ref/organismes")
    public List<SocialDto.OrganismeResume> organismesByPays(@RequestParam String codePays) {
        return svc.organismesByPays(codePays);
    }

    @PostMapping("/calculer")
    public SocialDto.CalculResult calculer(@RequestParam String codePays,
                                           @Valid @RequestBody SocialDto.CalculRequest req) {
        return svc.calculer(codePays, req);
    }

    @GetMapping
    public List<SocialDto.DeclarationResponse> findAll() {
        return svc.findAll(TenantContext.get());
    }

    @GetMapping("/annee/{annee}")
    public List<SocialDto.DeclarationResponse> findByAnnee(@PathVariable int annee) {
        return svc.findByAnnee(TenantContext.get(), annee);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public SocialDto.DeclarationResponse create(@Valid @RequestBody SocialDto.DeclarationSaveRequest req) {
        return svc.create(TenantContext.get(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public SocialDto.DeclarationResponse update(@PathVariable UUID id,
                                                @Valid @RequestBody SocialDto.DeclarationUpdateRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }
}
