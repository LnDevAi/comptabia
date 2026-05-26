package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.consolidation.ConsolidationDto;
import com.edefence.ecompta.service.ConsolidationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/consolidation")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ConsolidationController {

    private final ConsolidationService service;

    // ─── Groupes CRUD ─────────────────────────────────────────────────────────

    @GetMapping("/groupes")
    public List<ConsolidationDto.GroupeResponse> listGroupes(@AuthenticationPrincipal Utilisateur user) {
        return service.listGroupes(user);
    }

    @GetMapping("/groupes/{id}")
    public ConsolidationDto.GroupeResponse getGroupe(@PathVariable UUID id, @AuthenticationPrincipal Utilisateur user) {
        return service.getGroupe(id, user);
    }

    @PostMapping("/groupes")
    @ResponseStatus(HttpStatus.CREATED)
    public ConsolidationDto.GroupeResponse createGroupe(@RequestBody ConsolidationDto.GroupeRequest req, @AuthenticationPrincipal Utilisateur user) {
        return service.createGroupe(req, user);
    }

    @PutMapping("/groupes/{id}")
    public ConsolidationDto.GroupeResponse updateGroupe(@PathVariable UUID id, @RequestBody ConsolidationDto.GroupeRequest req, @AuthenticationPrincipal Utilisateur user) {
        return service.updateGroupe(id, req, user);
    }

    @DeleteMapping("/groupes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroupe(@PathVariable UUID id, @AuthenticationPrincipal Utilisateur user) {
        service.deleteGroupe(id, user);
    }

    // ─── Éliminations interco ─────────────────────────────────────────────────

    @GetMapping("/groupes/{id}/eliminations")
    public List<ConsolidationDto.EliminationResponse> listEliminations(
            @PathVariable UUID id,
            @RequestParam int exercice,
            @AuthenticationPrincipal Utilisateur user) {
        return service.listEliminations(id, exercice, user);
    }

    @PostMapping("/groupes/{id}/eliminations")
    @ResponseStatus(HttpStatus.CREATED)
    public ConsolidationDto.EliminationResponse addElimination(
            @PathVariable UUID id,
            @RequestBody ConsolidationDto.EliminationRequest req,
            @AuthenticationPrincipal Utilisateur user) {
        return service.addElimination(id, req, user);
    }

    @DeleteMapping("/groupes/{groupeId}/eliminations/{elimId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteElimination(
            @PathVariable UUID groupeId,
            @PathVariable UUID elimId,
            @AuthenticationPrincipal Utilisateur user) {
        service.deleteElimination(groupeId, elimId, user);
    }

    // ─── États consolidés ─────────────────────────────────────────────────────

    @GetMapping("/groupes/{id}/bilan")
    public ConsolidationDto.BilanConsolide getBilan(
            @PathVariable UUID id,
            @RequestParam int exercice,
            @AuthenticationPrincipal Utilisateur user) {
        return service.getBilanConsolide(id, exercice, user);
    }

    @GetMapping("/groupes/{id}/compte-resultat")
    public ConsolidationDto.CompteResultatConsolide getCompteResultat(
            @PathVariable UUID id,
            @RequestParam int exercice,
            @AuthenticationPrincipal Utilisateur user) {
        return service.getCompteResultatConsolide(id, exercice, user);
    }

    @GetMapping("/groupes/{id}/tft")
    public ConsolidationDto.TFTConsolide getTFT(
            @PathVariable UUID id,
            @RequestParam int exercice,
            @AuthenticationPrincipal Utilisateur user) {
        return service.getTFTConsolide(id, exercice, user);
    }
}
