package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.commercial.CommercialDto;
import com.edefence.ecompta.service.GestionCommercialeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/commercial")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class GestionCommercialeController {

    private final GestionCommercialeService svc;

    // ─── Dashboard ───────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public CommercialDto.DashboardCommercial getDashboard() {
        return svc.getDashboard();
    }

    // ─── Plans ───────────────────────────────────────────────────────────────

    @GetMapping("/plans")
    public List<CommercialDto.PlanResponse> listerPlans() {
        return svc.listerPlans();
    }

    @PostMapping("/plans")
    @ResponseStatus(HttpStatus.CREATED)
    public CommercialDto.PlanResponse creerPlan(@RequestBody CommercialDto.PlanRequest req) {
        return svc.creerPlan(req);
    }

    @PutMapping("/plans/{id}")
    public CommercialDto.PlanResponse mettreAJourPlan(@PathVariable UUID id,
                                                       @RequestBody CommercialDto.PlanRequest req) {
        return svc.mettreAJourPlan(id, req);
    }

    @DeleteMapping("/plans/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimerPlan(@PathVariable UUID id) {
        svc.supprimerPlan(id);
    }

    // ─── Abonnements ─────────────────────────────────────────────────────────

    @GetMapping("/abonnements")
    public List<CommercialDto.AbonnementResponse> listerAbonnements() {
        return svc.listerAbonnements();
    }

    @PostMapping("/abonnements")
    @ResponseStatus(HttpStatus.CREATED)
    public CommercialDto.AbonnementResponse creerAbonnement(@RequestBody CommercialDto.AbonnementRequest req) {
        return svc.creerAbonnement(req);
    }

    @PutMapping("/abonnements/{id}")
    public CommercialDto.AbonnementResponse mettreAJourAbonnement(@PathVariable UUID id,
                                                                    @RequestBody CommercialDto.AbonnementRequest req) {
        return svc.mettreAJourAbonnement(id, req);
    }

    @DeleteMapping("/abonnements/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimerAbonnement(@PathVariable UUID id) {
        svc.supprimerAbonnement(id);
    }

    @GetMapping("/abonnements/{id}/licence")
    public ResponseEntity<byte[]> telechargerLicence(@PathVariable UUID id) {
        byte[] licenceBytes = svc.genererFichierLicence(id);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "licence-" + id + ".lic");
        return ResponseEntity.ok().headers(headers).body(licenceBytes);
    }

    // ─── Factures ────────────────────────────────────────────────────────────

    @GetMapping("/factures")
    public List<CommercialDto.FactureResponse> listerFactures() {
        return svc.listerFactures();
    }

    @GetMapping("/abonnements/{abonnementId}/factures")
    public List<CommercialDto.FactureResponse> listerFacturesClient(@PathVariable UUID abonnementId) {
        return svc.listerFacturesClient(abonnementId);
    }

    @PostMapping("/factures")
    @ResponseStatus(HttpStatus.CREATED)
    public CommercialDto.FactureResponse genererFacture(@RequestBody CommercialDto.FactureRequest req) {
        return svc.genererFacture(req);
    }

    @PatchMapping("/factures/{id}/statut")
    public CommercialDto.FactureResponse changerStatutFacture(@PathVariable UUID id,
                                                               @RequestParam String statut) {
        return svc.changerStatutFacture(id, statut);
    }

    // ─── Paiements ───────────────────────────────────────────────────────────

    @PostMapping("/paiements")
    @ResponseStatus(HttpStatus.CREATED)
    public CommercialDto.PaiementResponse enregistrerPaiement(@RequestBody CommercialDto.PaiementRequest req) {
        return svc.enregistrerPaiement(req);
    }
}
