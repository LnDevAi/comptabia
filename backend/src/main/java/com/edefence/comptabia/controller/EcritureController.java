package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.EcritureComptable;
import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.ecriture.CsvImportDto;
import com.edefence.comptabia.dto.ecriture.EcritureDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.service.CsvImportService;
import com.edefence.comptabia.service.EcritureService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.UUID;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Écritures comptables", description = "Saisie, validation et consultation des écritures SYSCOHADA")
@RestController
@RequestMapping("/api/ecritures")
@RequiredArgsConstructor
public class EcritureController {

    private final EcritureService      service;
    private final CsvImportService     csvImportService;
    private final EntrepriseRepository entrepriseRepo;

    @GetMapping
    public Page<EcritureDto.Response> findAll(
            @RequestParam(required = false) EcritureComptable.Journal journal,
            @RequestParam(required = false) EcritureComptable.Statut statut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @PageableDefault(size = 20) Pageable pageable) {
        return service.findAll(TenantContext.get(), journal, statut, from, to, pageable);
    }

    @GetMapping("/stats")
    public EcritureDto.Stats stats() {
        return service.stats(TenantContext.get());
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
        return service.create(TenantContext.get(), dto, auteur, loadEntreprise());
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

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public CsvImportDto.Result importCsv(@RequestPart("file") MultipartFile file,
                                          @AuthenticationPrincipal UserDetails user) throws IOException {
        return csvImportService.importer(TenantContext.get(), user.getUsername(), file.getBytes());
    }

    private Entreprise loadEntreprise() {
        return entrepriseRepo.findById(TenantContext.get())
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
    }
}
