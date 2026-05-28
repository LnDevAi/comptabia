package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.tresorerie.TresorerieDto;
import com.edefence.comptabia.service.TresorerieService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tresorerie")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class TresorerieController {

    private final TresorerieService service;

    // ─── Dashboard ────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public TresorerieDto.Dashboard dashboard() {
        return service.dashboard(TenantContext.get());
    }

    // ─── Comptes bancaires ────────────────────────────────────────────────────

    @GetMapping("/comptes")
    public List<TresorerieDto.CompteResponse> listComptes() {
        return service.findComptes(TenantContext.get());
    }

    @PostMapping("/comptes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TresorerieDto.CompteResponse createCompte(@RequestBody @Valid TresorerieDto.CompteRequest dto) {
        return service.createCompte(TenantContext.get(), dto);
    }

    @PutMapping("/comptes/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TresorerieDto.CompteResponse updateCompte(@PathVariable UUID id,
                                                      @RequestBody @Valid TresorerieDto.CompteRequest dto) {
        return service.updateCompte(id, TenantContext.get(), dto);
    }

    @PatchMapping("/comptes/{id}/solde")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TresorerieDto.CompteResponse updateSolde(@PathVariable UUID id,
                                                     @RequestBody @Valid TresorerieDto.SoldeRequest dto) {
        return service.updateSolde(id, TenantContext.get(), dto);
    }

    @DeleteMapping("/comptes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCompte(@PathVariable UUID id) {
        service.deleteCompte(id, TenantContext.get());
    }

    // ─── Mouvements ───────────────────────────────────────────────────────────

    @GetMapping("/mouvements")
    public Page<TresorerieDto.MouvementResponse> listMovements(
            @RequestParam(required = false) UUID compteId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return service.findMovements(TenantContext.get(), compteId,
                PageRequest.of(page, Math.min(size, 100)));
    }

    @PostMapping("/mouvements")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TresorerieDto.MouvementResponse createMouvement(@RequestBody @Valid TresorerieDto.MouvementRequest dto) {
        return service.createMouvement(TenantContext.get(), dto);
    }

    @DeleteMapping("/mouvements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteMouvement(@PathVariable UUID id) {
        service.deleteMouvement(id, TenantContext.get());
    }

    // ─── Alertes ──────────────────────────────────────────────────────────────

    @GetMapping("/alertes")
    public List<TresorerieDto.AlerteResponse> listAlertes(
            @RequestParam(defaultValue = "false") boolean acquittees) {
        return service.findAlertes(TenantContext.get(), acquittees);
    }

    @PatchMapping("/alertes/{id}/acquitter")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TresorerieDto.AlerteResponse acquitter(@PathVariable UUID id) {
        return service.acquitterAlerte(id, TenantContext.get());
    }

    // ─── Flux mensuels ────────────────────────────────────────────────────────

    @GetMapping("/flux-mensuel")
    public TresorerieDto.StatFlux fluxMensuel(
            @RequestParam(defaultValue = "0") int exercice) {
        int ex = exercice == 0 ? java.time.LocalDate.now().getYear() : exercice;
        return service.getStatFlux(TenantContext.get(), ex);
    }

    // ─── Import OFX ───────────────────────────────────────────────────────────

    @PostMapping(value = "/import-ofx", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public TresorerieDto.ImportResult importOFX(
            @RequestParam String compteNumero,
            @RequestPart("file") MultipartFile file) throws IOException {
        return service.importerOFX(TenantContext.get(), compteNumero, file.getBytes());
    }
}
