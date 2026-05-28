package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Immobilisation;
import com.edefence.comptabia.dto.immobilisation.ImmobilisationDto;
import com.edefence.comptabia.service.ImmobilisationService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
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
@RequestMapping("/api/immobilisations")
@RequiredArgsConstructor
public class ImmobilisationController {

    private final ImmobilisationService service;

    @GetMapping
    public Page<ImmobilisationDto.Response> findAll(
            @RequestParam(required = false) Immobilisation.Categorie categorie,
            @RequestParam(required = false) Immobilisation.Statut statut,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.findAll(TenantContext.get(), categorie, statut, search, pageable);
    }

    @GetMapping("/stats")
    public ImmobilisationDto.Stats stats() {
        return service.stats(TenantContext.get());
    }

    @GetMapping("/stats-par-categorie")
    public List<ImmobilisationDto.StatsCat> statsParCategorie() {
        return service.statsParCategorie(TenantContext.get());
    }

    @GetMapping("/{id}/plan")
    public ImmobilisationDto.PlanAmortissement plan(@PathVariable UUID id) {
        return service.planAmortissement(id, TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public ImmobilisationDto.Response create(@Valid @RequestBody ImmobilisationDto.Request dto) {
        return service.create(TenantContext.get(), dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public ImmobilisationDto.Response update(@PathVariable UUID id,
                                              @Valid @RequestBody ImmobilisationDto.Request dto) {
        return service.update(id, TenantContext.get(), dto);
    }

    @PostMapping("/{id}/ceder")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public ImmobilisationDto.Response ceder(
            @PathVariable UUID id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateCession) {
        return service.ceder(id, TenantContext.get(), dateCession);
    }

    @PostMapping("/{id}/doter")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public ImmobilisationDto.DotationResult doter(
            @PathVariable UUID id,
            @RequestParam int exercice,
            @AuthenticationPrincipal UserDetails user) {
        return service.doterExercice(id, TenantContext.get(), exercice, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id, TenantContext.get());
    }
}
