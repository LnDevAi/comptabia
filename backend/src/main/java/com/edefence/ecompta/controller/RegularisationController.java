package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.regularisation.RegularisationDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.service.RegularisationService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/regularisations")
@RequiredArgsConstructor
public class RegularisationController {

    private final RegularisationService svc;
    private final EntrepriseRepository  entrepriseRepo;

    @GetMapping
    public List<RegularisationDto.Response> findAll(
            @RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : LocalDate.now().getYear();
        return svc.findAll(TenantContext.get(), annee);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public RegularisationDto.Response create(@Valid @RequestBody RegularisationDto.SaveRequest req) {
        return svc.create(TenantContext.get(), req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public RegularisationDto.Response update(@PathVariable UUID id,
                                              @Valid @RequestBody RegularisationDto.SaveRequest req) {
        return svc.update(id, TenantContext.get(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void delete(@PathVariable UUID id) {
        svc.delete(id, TenantContext.get());
    }

    @PostMapping("/{id}/comptabiliser")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public RegularisationDto.Response comptabiliser(@PathVariable UUID id,
                                                     @AuthenticationPrincipal Utilisateur auteur) {
        UUID eid = TenantContext.get();
        return svc.comptabiliser(id, eid, entrepriseRepo.getReferenceById(eid), auteur);
    }

    @PostMapping("/{id}/extourner")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public RegularisationDto.Response extourner(@PathVariable UUID id,
                                                 @AuthenticationPrincipal Utilisateur auteur) {
        UUID eid = TenantContext.get();
        return svc.extourner(id, eid, entrepriseRepo.getReferenceById(eid), auteur);
    }
}
