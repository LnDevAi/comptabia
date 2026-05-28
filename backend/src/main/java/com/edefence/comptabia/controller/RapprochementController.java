package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.rapprochement.RapprochementDto;
import com.edefence.comptabia.service.RapprochementService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rapprochement")
@RequiredArgsConstructor
public class RapprochementController {

    private final RapprochementService service;

    @GetMapping("/comptes")
    public List<String> comptes() {
        return service.getComptes(TenantContext.get());
    }

    @GetMapping
    public RapprochementDto.EtatRapprochement etat(@RequestParam String compte) {
        return service.getEtat(TenantContext.get(), compte);
    }

    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public RapprochementDto.ImportResult importerReleve(
            @RequestParam String compte,
            @RequestPart("file") MultipartFile file) throws IOException {
        return service.importerReleve(TenantContext.get(), compte, file.getBytes());
    }

    @PostMapping("/rapprocher")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void rapprocher(@RequestBody RapprochementDto.RapprocherRequest req) {
        service.rapprocher(TenantContext.get(), req.releveLigneId(), req.ecritureLigneId());
    }

    @PostMapping("/derapprocher/{releveLigneId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void derapprocher(@PathVariable UUID releveLigneId) {
        service.derapprocher(TenantContext.get(), releveLigneId);
    }

    @DeleteMapping("/releve/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void supprimerReleve(@PathVariable UUID id) {
        service.supprimerReleve(TenantContext.get(), id);
    }
}
