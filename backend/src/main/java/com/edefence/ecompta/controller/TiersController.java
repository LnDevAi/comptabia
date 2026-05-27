package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Tiers.TypeTiers;
import com.edefence.ecompta.dto.tiers.TiersDto;
import com.edefence.ecompta.service.TiersService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/tiers")
@RequiredArgsConstructor
public class TiersController {

    private final TiersService service;

    @GetMapping
    public Page<TiersDto.Response> findAll(
            @RequestParam(required = false) TypeTiers type,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean actifOnly,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.findAll(TenantContext.get(), type, search, actifOnly, pageable);
    }

    @GetMapping("/stats")
    public TiersDto.Stats stats() {
        return service.stats(TenantContext.get());
    }

    @GetMapping("/stats-evolution")
    public TiersDto.StatsEvolution statsEvolution(@RequestParam(defaultValue = "0") int exercice) {
        return service.getStatsEvolution(TenantContext.get(), exercice);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TiersDto.Response create(@Valid @RequestBody TiersDto.Request dto) {
        return service.create(TenantContext.get(), dto);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TiersDto.Response update(@PathVariable UUID id,
                                    @Valid @RequestBody TiersDto.Request dto) {
        return service.update(id, TenantContext.get(), dto);
    }

    @PostMapping("/{id}/toggle-actif")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TiersDto.Response toggleActif(@PathVariable UUID id) {
        return service.toggleActif(id, TenantContext.get());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id, TenantContext.get());
    }
}
