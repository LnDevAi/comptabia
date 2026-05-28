package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.crm.CrmDto;
import com.edefence.comptabia.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CrmService {

    private final CrmContactRepository   contactRepo;
    private final CrmLeadRepository      leadRepo;
    private final CrmActiviteRepository  activiteRepo;
    private final CrmTemplateRepository  templateRepo;
    private final EntrepriseRepository   entrepriseRepo;

    // ─── Contacts ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CrmDto.ContactResponse> listerContacts(UUID entrepriseId, String q) {
        return contactRepo.search(entrepriseId, q == null || q.isBlank() ? null : q)
                .stream().map(this::toContactResponse).toList();
    }

    @Transactional
    public CrmDto.ContactResponse creerContact(UUID entrepriseId, CrmDto.ContactRequest req) {
        Entreprise e = entrepriseRepo.getReferenceById(entrepriseId);
        CrmContact c = CrmContact.builder()
                .entreprise(e).nom(req.nom()).email(req.email()).telephone(req.telephone())
                .societe(req.societe()).poste(req.poste()).tags(req.tags()).notes(req.notes())
                .score(req.score())
                .source(parseEnum(req.source(), CrmContact.Source.class, CrmContact.Source.MANUEL))
                .statut(parseEnum(req.statut(), CrmContact.Statut.class, CrmContact.Statut.ACTIF))
                .build();
        return toContactResponse(contactRepo.save(c));
    }

    @Transactional
    public CrmDto.ContactResponse mettreAJourContact(UUID id, UUID entrepriseId, CrmDto.ContactRequest req) {
        CrmContact c = findContact(id, entrepriseId);
        c.setNom(req.nom()); c.setEmail(req.email()); c.setTelephone(req.telephone());
        c.setSociete(req.societe()); c.setPoste(req.poste()); c.setTags(req.tags()); c.setNotes(req.notes());
        c.setScore(req.score());
        if (req.source() != null) c.setSource(parseEnum(req.source(), CrmContact.Source.class, CrmContact.Source.MANUEL));
        if (req.statut() != null) c.setStatut(parseEnum(req.statut(), CrmContact.Statut.class, CrmContact.Statut.ACTIF));
        return toContactResponse(contactRepo.save(c));
    }

    @Transactional
    public void supprimerContact(UUID id, UUID entrepriseId) {
        contactRepo.delete(findContact(id, entrepriseId));
    }

    @Transactional
    public List<CrmDto.ContactResponse> importerContacts(UUID entrepriseId, List<CrmDto.ContactRequest> contacts) {
        Entreprise e = entrepriseRepo.getReferenceById(entrepriseId);
        List<CrmContact> entities = contacts.stream().map(req -> CrmContact.builder()
                .entreprise(e).nom(req.nom()).email(req.email()).telephone(req.telephone())
                .societe(req.societe()).poste(req.poste()).source(CrmContact.Source.IMPORT)
                .statut(CrmContact.Statut.ACTIF).build()).collect(Collectors.toList());
        return contactRepo.saveAll(entities).stream().map(this::toContactResponse).toList();
    }

    // ─── Leads ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CrmDto.LeadResponse> listerLeads(UUID entrepriseId) {
        return leadRepo.findByEntrepriseIdOrderByCreatedAtDesc(entrepriseId)
                .stream().map(this::toLeadResponse).toList();
    }

    @Transactional
    public CrmDto.LeadResponse creerLead(UUID entrepriseId, CrmDto.LeadRequest req) {
        Entreprise e = entrepriseRepo.getReferenceById(entrepriseId);
        CrmLead lead = CrmLead.builder()
                .entreprise(e).titre(req.titre())
                .valeur(req.valeur() != null ? req.valeur() : BigDecimal.ZERO)
                .probabilite(req.probabilite())
                .etape(parseEnum(req.etape(), CrmLead.Etape.class, CrmLead.Etape.NOUVEAU))
                .dateCloturePrevue(req.dateCloturePrevue() != null ? LocalDate.parse(req.dateCloturePrevue()) : null)
                .produit(req.produit()).notes(req.notes())
                .build();
        if (req.contactId() != null) {
            lead.setContact(contactRepo.findById(req.contactId()).orElse(null));
        }
        return toLeadResponse(leadRepo.save(lead));
    }

    @Transactional
    public CrmDto.LeadResponse mettreAJourLead(UUID id, UUID entrepriseId, CrmDto.LeadRequest req) {
        CrmLead lead = findLead(id, entrepriseId);
        lead.setTitre(req.titre());
        if (req.valeur() != null) lead.setValeur(req.valeur());
        lead.setProbabilite(req.probabilite());
        if (req.etape() != null) lead.setEtape(parseEnum(req.etape(), CrmLead.Etape.class, lead.getEtape()));
        if (req.dateCloturePrevue() != null) lead.setDateCloturePrevue(LocalDate.parse(req.dateCloturePrevue()));
        if (req.produit() != null) lead.setProduit(req.produit());
        if (req.notes() != null) lead.setNotes(req.notes());
        if (req.contactId() != null) lead.setContact(contactRepo.findById(req.contactId()).orElse(null));
        return toLeadResponse(leadRepo.save(lead));
    }

    @Transactional
    public CrmDto.LeadResponse changerEtape(UUID id, UUID entrepriseId, String etape) {
        CrmLead lead = findLead(id, entrepriseId);
        lead.setEtape(parseEnum(etape, CrmLead.Etape.class, lead.getEtape()));
        return toLeadResponse(leadRepo.save(lead));
    }

    @Transactional
    public void supprimerLead(UUID id, UUID entrepriseId) {
        leadRepo.delete(findLead(id, entrepriseId));
    }

    // ─── Activités ────────────────────────────────────────────────────────────

    @Transactional
    public CrmDto.ActiviteResponse ajouterActivite(UUID entrepriseId, CrmDto.ActiviteRequest req, Utilisateur auteur) {
        Entreprise e = entrepriseRepo.getReferenceById(entrepriseId);
        CrmActivite act = CrmActivite.builder()
                .entreprise(e)
                .type(parseEnum(req.type(), CrmActivite.Type.class, CrmActivite.Type.NOTE))
                .contenu(req.contenu())
                .auteur(auteur)
                .build();
        if (req.leadId() != null) act.setLead(leadRepo.findById(req.leadId()).orElse(null));
        if (req.contactId() != null) act.setContact(contactRepo.findById(req.contactId()).orElse(null));
        if (req.dateActivite() != null) act.setDateActivite(java.time.OffsetDateTime.parse(req.dateActivite()));
        return toActiviteResponse(activiteRepo.save(act));
    }

    @Transactional(readOnly = true)
    public List<CrmDto.ActiviteResponse> activitesDuLead(UUID leadId) {
        return activiteRepo.findByLeadIdOrderByDateActiviteDesc(leadId)
                .stream().map(this::toActiviteResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CrmDto.ActiviteResponse> activitesDuContact(UUID contactId) {
        return activiteRepo.findByContactIdOrderByDateActiviteDesc(contactId)
                .stream().map(this::toActiviteResponse).toList();
    }

    // ─── Templates ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CrmDto.TemplateResponse> listerTemplates(UUID entrepriseId) {
        return templateRepo.findByEntrepriseIdOrderByCreatedAtDesc(entrepriseId)
                .stream().map(this::toTemplateResponse).toList();
    }

    @Transactional
    public CrmDto.TemplateResponse creerTemplate(UUID entrepriseId, CrmDto.TemplateRequest req) {
        CrmTemplate t = CrmTemplate.builder()
                .entreprise(entrepriseRepo.getReferenceById(entrepriseId))
                .nom(req.nom()).type(parseEnum(req.type(), CrmTemplate.Type.class, CrmTemplate.Type.EMAIL))
                .sujet(req.sujet()).contenu(req.contenu()).variables(req.variables())
                .build();
        return toTemplateResponse(templateRepo.save(t));
    }

    @Transactional
    public CrmDto.TemplateResponse mettreAJourTemplate(UUID id, UUID entrepriseId, CrmDto.TemplateRequest req) {
        CrmTemplate t = templateRepo.findById(id)
                .filter(x -> x.getEntreprise().getId().equals(entrepriseId))
                .orElseThrow(() -> new EntityNotFoundException("Template introuvable"));
        t.setNom(req.nom()); t.setSujet(req.sujet()); t.setContenu(req.contenu()); t.setVariables(req.variables());
        return toTemplateResponse(templateRepo.save(t));
    }

    @Transactional
    public void supprimerTemplate(UUID id, UUID entrepriseId) {
        CrmTemplate t = templateRepo.findById(id)
                .filter(x -> x.getEntreprise().getId().equals(entrepriseId))
                .orElseThrow(() -> new EntityNotFoundException("Template introuvable"));
        templateRepo.delete(t);
    }

    // ─── Dashboard ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CrmDto.DashboardResponse getDashboard(UUID entrepriseId) {
        long nbContacts   = contactRepo.countActifs(entrepriseId);
        long nbLeadsActifs = leadRepo.countActifs(entrepriseId);
        BigDecimal valeurPond = leadRepo.valeurPonderee(entrepriseId);
        long nbGagnes     = leadRepo.countGagnes(entrepriseId);
        long nbTotal      = leadRepo.countActifs(entrepriseId) + nbGagnes + leadRepo.countByEntrepriseIdAndEtape(entrepriseId, CrmLead.Etape.PERDU);
        double taux = nbTotal > 0 ? (double) nbGagnes / nbTotal * 100 : 0;

        List<CrmDto.EtapeStats> pipeline = leadRepo.statsParEtape(entrepriseId).stream()
                .map(r -> new CrmDto.EtapeStats(
                        r[0].toString(),
                        ((Number) r[1]).longValue(),
                        (BigDecimal) r[2]))
                .toList();

        return new CrmDto.DashboardResponse(nbContacts, nbLeadsActifs, valeurPond, nbGagnes, taux, pipeline, List.of());
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private CrmContact findContact(UUID id, UUID entrepriseId) {
        CrmContact c = contactRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Contact introuvable"));
        if (!c.getEntreprise().getId().equals(entrepriseId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        return c;
    }

    private CrmLead findLead(UUID id, UUID entrepriseId) {
        CrmLead l = leadRepo.findById(id).orElseThrow(() -> new EntityNotFoundException("Lead introuvable"));
        if (!l.getEntreprise().getId().equals(entrepriseId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        return l;
    }

    private <E extends Enum<E>> E parseEnum(String val, Class<E> clazz, E def) {
        if (val == null || val.isBlank()) return def;
        try { return Enum.valueOf(clazz, val.toUpperCase()); } catch (IllegalArgumentException e) { return def; }
    }

    CrmDto.ContactResponse toContactResponse(CrmContact c) {
        return new CrmDto.ContactResponse(c.getId(), c.getNom(), c.getEmail(), c.getTelephone(),
                c.getSociete(), c.getPoste(), c.getSource() != null ? c.getSource().name() : null,
                c.getTags(), c.getStatut().name(), c.getScore(), c.getNotes(), c.getCreatedAt());
    }

    private CrmDto.LeadResponse toLeadResponse(CrmLead l) {
        return new CrmDto.LeadResponse(l.getId(),
                l.getContact() != null ? toContactResponse(l.getContact()) : null,
                l.getTitre(), l.getValeur(), l.getProbabilite(), l.getEtape().name(),
                l.getDateCloturePrevue() != null ? l.getDateCloturePrevue().toString() : null,
                l.getProduit(), l.getNotes(), l.getCreatedAt(), l.getUpdatedAt());
    }

    private CrmDto.ActiviteResponse toActiviteResponse(CrmActivite a) {
        return new CrmDto.ActiviteResponse(a.getId(), a.getType().name(), a.getContenu(),
                a.getDateActivite(), a.getAuteur() != null ? a.getAuteur().getNom() : null, a.getCreatedAt());
    }

    private CrmDto.TemplateResponse toTemplateResponse(CrmTemplate t) {
        return new CrmDto.TemplateResponse(t.getId(), t.getNom(), t.getType().name(),
                t.getSujet(), t.getContenu(), t.getVariables(), t.getCreatedAt());
    }
}
