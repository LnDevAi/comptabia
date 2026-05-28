package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.approbation.ApprobationDto;
import com.edefence.comptabia.service.ApprobationService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/approbations")
@RequiredArgsConstructor
public class ApprobationController {

    private final ApprobationService svc;

    @GetMapping("/en-attente")
    @PreAuthorize("hasRole('ADMIN')")
    public List<ApprobationDto.EcritureEnAttenteResume> enAttente() {
        return svc.listeEnAttente(TenantContext.get());
    }

    @GetMapping("/historique/{ecritureId}")
    public List<ApprobationDto.ApprobationResponse> historique(
            @PathVariable UUID ecritureId) {
        return svc.historique(ecritureId, TenantContext.get());
    }

    @PostMapping("/soumettre/{ecritureId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('COMPTABLE') or hasRole('ADMIN')")
    public void soumettre(@PathVariable UUID ecritureId,
                          @AuthenticationPrincipal Utilisateur auteur) {
        svc.soumettre(ecritureId, TenantContext.get(), auteur);
    }

    @PostMapping("/decider/{ecritureId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApprobationDto.ApprobationResponse decider(
            @PathVariable UUID ecritureId,
            @Valid @RequestBody ApprobationDto.DecisionRequest req,
            @AuthenticationPrincipal Utilisateur approbateur) {
        return svc.decider(ecritureId, TenantContext.get(), approbateur, req);
    }

    @PostMapping("/annuler/{ecritureId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('COMPTABLE') or hasRole('ADMIN')")
    public void annuler(@PathVariable UUID ecritureId) {
        svc.annuler(ecritureId, TenantContext.get());
    }
}
