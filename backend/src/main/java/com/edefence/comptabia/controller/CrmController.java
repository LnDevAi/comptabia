package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.crm.CrmDto;
import com.edefence.comptabia.service.CrmCampagneService;
import com.edefence.comptabia.service.CrmService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/crm")
@RequiredArgsConstructor
public class CrmController {

    private final CrmService         crmService;
    private final CrmCampagneService campagneService;

    // ─── Dashboard ────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.DashboardResponse getDashboard() {
        return crmService.getDashboard(TenantContext.get());
    }

    // ─── Contacts ─────────────────────────────────────────────────────────────

    @GetMapping("/contacts")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<CrmDto.ContactResponse> listerContacts(@RequestParam(required = false) String q) {
        return crmService.listerContacts(TenantContext.get(), q);
    }

    @PostMapping("/contacts")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.ContactResponse creerContact(@RequestBody CrmDto.ContactRequest req) {
        return crmService.creerContact(TenantContext.get(), req);
    }

    @PostMapping("/contacts/import")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<CrmDto.ContactResponse> importerContacts(@RequestBody List<CrmDto.ContactRequest> contacts) {
        return crmService.importerContacts(TenantContext.get(), contacts);
    }

    @PatchMapping("/contacts/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.ContactResponse mettreAJourContact(@PathVariable UUID id, @RequestBody CrmDto.ContactRequest req) {
        return crmService.mettreAJourContact(id, TenantContext.get(), req);
    }

    @DeleteMapping("/contacts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimerContact(@PathVariable UUID id) {
        crmService.supprimerContact(id, TenantContext.get());
    }

    // ─── Activités contacts ───────────────────────────────────────────────────

    @GetMapping("/contacts/{id}/activites")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<CrmDto.ActiviteResponse> activitesDuContact(@PathVariable UUID id) {
        return crmService.activitesDuContact(id);
    }

    // ─── Leads ────────────────────────────────────────────────────────────────

    @GetMapping("/leads")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<CrmDto.LeadResponse> listerLeads() {
        return crmService.listerLeads(TenantContext.get());
    }

    @PostMapping("/leads")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.LeadResponse creerLead(@RequestBody CrmDto.LeadRequest req) {
        return crmService.creerLead(TenantContext.get(), req);
    }

    @PatchMapping("/leads/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.LeadResponse mettreAJourLead(@PathVariable UUID id, @RequestBody CrmDto.LeadRequest req) {
        return crmService.mettreAJourLead(id, TenantContext.get(), req);
    }

    @PatchMapping("/leads/{id}/etape")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.LeadResponse changerEtape(@PathVariable UUID id, @RequestParam String etape) {
        return crmService.changerEtape(id, TenantContext.get(), etape);
    }

    @DeleteMapping("/leads/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimerLead(@PathVariable UUID id) {
        crmService.supprimerLead(id, TenantContext.get());
    }

    @GetMapping("/leads/{id}/activites")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<CrmDto.ActiviteResponse> activitesDuLead(@PathVariable UUID id) {
        return crmService.activitesDuLead(id);
    }

    @PostMapping("/activites")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.ActiviteResponse ajouterActivite(@RequestBody CrmDto.ActiviteRequest req,
                                                    @AuthenticationPrincipal Utilisateur user) {
        return crmService.ajouterActivite(TenantContext.get(), req, user);
    }

    // ─── Templates ────────────────────────────────────────────────────────────

    @GetMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<CrmDto.TemplateResponse> listerTemplates() {
        return crmService.listerTemplates(TenantContext.get());
    }

    @PostMapping("/templates")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.TemplateResponse creerTemplate(@RequestBody CrmDto.TemplateRequest req) {
        return crmService.creerTemplate(TenantContext.get(), req);
    }

    @PatchMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.TemplateResponse mettreAJourTemplate(@PathVariable UUID id, @RequestBody CrmDto.TemplateRequest req) {
        return crmService.mettreAJourTemplate(id, TenantContext.get(), req);
    }

    @DeleteMapping("/templates/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimerTemplate(@PathVariable UUID id) {
        crmService.supprimerTemplate(id, TenantContext.get());
    }

    // ─── Campagnes ────────────────────────────────────────────────────────────

    @GetMapping("/campagnes")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<CrmDto.CampagneResponse> listerCampagnes() {
        return campagneService.listerCampagnes(TenantContext.get());
    }

    @PostMapping("/campagnes")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public CrmDto.CampagneResponse creerCampagne(@RequestBody CrmDto.CampagneRequest req) {
        return campagneService.creerCampagne(TenantContext.get(), req);
    }

    @GetMapping("/campagnes/{id}/destinataires")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<CrmDto.DestinataireResponse> listerDestinataires(@PathVariable UUID id) {
        return campagneService.listerDestinataires(id, TenantContext.get());
    }

    @PostMapping("/campagnes/{id}/envoyer")
    @PreAuthorize("hasRole('ADMIN')")
    public CrmDto.CampagneResponse lancerEnvoi(@PathVariable UUID id) {
        return campagneService.lancerEnvoi(id, TenantContext.get());
    }

    @DeleteMapping("/campagnes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void supprimerCampagne(@PathVariable UUID id) {
        campagneService.supprimerCampagne(id, TenantContext.get());
    }

    // ─── Tracking (public) ────────────────────────────────────────────────────

    @GetMapping(value = "/track/open/{id}", produces = MediaType.IMAGE_GIF_VALUE)
    public byte[] trackOpen(@PathVariable UUID id, HttpServletResponse response) {
        campagneService.marquerOuvert(id);
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        // 1×1 transparent GIF
        return new byte[]{0x47,0x49,0x46,0x38,0x39,0x61,0x01,0x00,0x01,0x00,(byte)0x80,0x00,0x00,
                (byte)0xff,(byte)0xff,(byte)0xff,0x00,0x00,0x00,0x21,(byte)0xf9,0x04,0x01,0x00,
                0x00,0x00,0x00,0x2c,0x00,0x00,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0x02,0x02,
                0x44,0x01,0x00,0x3b};
    }

    @GetMapping("/track/click/{id}")
    public void trackClick(@PathVariable UUID id, @RequestParam String url, HttpServletResponse response) throws IOException {
        String redirect = campagneService.marquerClique(id, url);
        response.sendRedirect(redirect);
    }
}
