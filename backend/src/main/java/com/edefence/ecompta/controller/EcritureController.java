package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.ecriture.EcritureDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.service.EcritureService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/ecritures")
@RequiredArgsConstructor
public class EcritureController {

    private final EcritureService service;
    private final EntrepriseRepository entrepriseRepo;

    @GetMapping
    public Page<EcritureDto.Response> findAll(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.findAll(TenantContext.get(), from, to, pageable);
    }

    @GetMapping("/{id}")
    public EcritureDto.Response findOne(@PathVariable UUID id) {
        return service.findOne(id, TenantContext.get());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public EcritureDto.Response create(@Valid @RequestBody EcritureDto.Request dto,
                                       @AuthenticationPrincipal Utilisateur auteur) {
        Entreprise entreprise = loadEntreprise();
        return service.create(TenantContext.get(), dto, auteur, entreprise);
    }

    @PostMapping("/{id}/valider")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public EcritureDto.Response valider(@PathVariable UUID id) {
        return service.valider(id, TenantContext.get());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void supprimer(@PathVariable UUID id) {
        service.supprimer(id, TenantContext.get());
    }

    private Entreprise loadEntreprise() {
        return entrepriseRepo.findById(TenantContext.get())
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
    }
}
