package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.*;
import com.edefence.comptabia.dto.crm.CrmDto;
import com.edefence.comptabia.repository.*;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrmCampagneService {

    private final CrmCampagneRepository   campagneRepo;
    private final CrmDestinataireRepository destinataireRepo;
    private final CrmContactRepository    contactRepo;
    private final CrmTemplateRepository   templateRepo;
    private final EntrepriseRepository    entrepriseRepo;
    private final CrmService              crmService;
    private final JavaMailSender          mailSender;

    @Value("${app.mail.from:noreply@ecompta.app}")
    private String mailFrom;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.sms.provider:mock}")
    private String smsProvider;

    @Value("${app.sms.api-url:}")
    private String smsApiUrl;

    @Value("${app.sms.api-key:}")
    private String smsApiKey;

    @Value("${app.sms.sender-id:eCompta}")
    private String smsSenderId;

    @Value("${API_BASE_URL:http://localhost:8080}")
    private String apiBaseUrl;

    // ─── CRUD campagnes ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CrmDto.CampagneResponse> listerCampagnes(UUID entrepriseId) {
        return campagneRepo.findByEntrepriseIdOrderByCreatedAtDesc(entrepriseId)
                .stream().map(this::toCampagneResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CrmDto.DestinataireResponse> listerDestinataires(UUID campagneId, UUID entrepriseId) {
        CrmCampagne c = findCampagne(campagneId, entrepriseId);
        return destinataireRepo.findByCampagneIdOrderByCreatedAtAsc(c.getId())
                .stream().map(this::toDestinataireResponse).toList();
    }

    @Transactional
    public CrmDto.CampagneResponse creerCampagne(UUID entrepriseId, CrmDto.CampagneRequest req) {
        Entreprise e = entrepriseRepo.getReferenceById(entrepriseId);

        CrmCampagne.Type type = req.type().equalsIgnoreCase("SMS")
                ? CrmCampagne.Type.SMS : CrmCampagne.Type.EMAIL;

        CrmCampagne camp = CrmCampagne.builder()
                .entreprise(e).nom(req.nom()).type(type)
                .sujet(req.sujet()).contenu(req.contenu())
                .build();

        if (req.templateId() != null) {
            templateRepo.findById(req.templateId()).ifPresent(camp::setTemplate);
        }
        camp = campagneRepo.save(camp);

        // Résoudre les destinataires
        List<CrmContact> contacts = resolveContacts(entrepriseId, req);
        final CrmCampagne finalCamp = camp;
        List<CrmDestinataire> dests = contacts.stream().map(ct ->
                CrmDestinataire.builder()
                        .campagne(finalCamp)
                        .contact(ct)
                        .nom(ct.getNom())
                        .email(ct.getEmail())
                        .telephone(ct.getTelephone())
                        .build()
        ).toList();

        destinataireRepo.saveAll(dests);
        camp.setNbDestinataires(dests.size());
        camp = campagneRepo.save(camp);

        return toCampagneResponse(camp);
    }

    @Transactional
    public void supprimerCampagne(UUID id, UUID entrepriseId) {
        campagneRepo.delete(findCampagne(id, entrepriseId));
    }

    // ─── Envoi ────────────────────────────────────────────────────────────────

    @Transactional
    public CrmDto.CampagneResponse lancerEnvoi(UUID campagneId, UUID entrepriseId) {
        CrmCampagne camp = findCampagne(campagneId, entrepriseId);
        if (camp.getStatut() == CrmCampagne.Statut.TERMINE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Campagne déjà envoyée");
        }
        camp.setStatut(CrmCampagne.Statut.EN_COURS);
        campagneRepo.save(camp);
        envoyerAsync(campagneId);
        return toCampagneResponse(camp);
    }

    @Async
    protected void envoyerAsync(UUID campagneId) {
        try {
            CrmCampagne camp = campagneRepo.findById(campagneId).orElseThrow();
            List<CrmDestinataire> dests = destinataireRepo.findByCampagneIdOrderByCreatedAtAsc(campagneId);

            int envoyes = 0, echecs = 0;

            for (CrmDestinataire dest : dests) {
                if (dest.getStatut() != CrmDestinataire.Statut.EN_ATTENTE) continue;

                String contenuRendu = renderTemplate(camp.getContenu(), dest);
                boolean ok;

                if (camp.getType() == CrmCampagne.Type.EMAIL) {
                    String sujet = renderTemplate(camp.getSujet() != null ? camp.getSujet() : camp.getNom(), dest);
                    String html  = wrapHtmlEmail(sujet, contenuRendu, dest.getId());
                    ok = sendEmail(dest.getEmail(), sujet, html);
                } else {
                    ok = sendSms(dest.getTelephone(), contenuRendu);
                }

                dest.setStatut(ok ? CrmDestinataire.Statut.ENVOYE : CrmDestinataire.Statut.ECHEC);
                if (!ok) dest.setErreur("Échec d'envoi");
                dest.setSentAt(OffsetDateTime.now());
                destinataireRepo.save(dest);

                if (ok) envoyes++; else echecs++;
            }

            camp.setNbEnvoyes(envoyes);
            camp.setNbEchecs(echecs);
            camp.setStatut(CrmCampagne.Statut.TERMINE);
            camp.setDateEnvoiReel(OffsetDateTime.now());
            campagneRepo.save(camp);

            log.info("Campagne {} terminée: {} envoyés, {} échecs", campagneId, envoyes, echecs);
        } catch (Exception ex) {
            log.error("Erreur envoi campagne {}: {}", campagneId, ex.getMessage());
            campagneRepo.findById(campagneId).ifPresent(c -> {
                c.setStatut(CrmCampagne.Statut.ANNULE);
                campagneRepo.save(c);
            });
        }
    }

    // ─── Tracking ─────────────────────────────────────────────────────────────

    @Transactional
    public void marquerOuvert(UUID destinataireId) {
        destinataireRepo.findById(destinataireId).ifPresent(d -> {
            if (d.getStatut() == CrmDestinataire.Statut.ENVOYE) {
                d.setStatut(CrmDestinataire.Statut.OUVERT);
                d.setOpenedAt(OffsetDateTime.now());
                destinataireRepo.save(d);
                campagneRepo.findById(d.getCampagne().getId()).ifPresent(c -> {
                    c.setNbOuverts(c.getNbOuverts() + 1);
                    campagneRepo.save(c);
                });
            }
        });
    }

    @Transactional
    public String marquerClique(UUID destinataireId, String url) {
        destinataireRepo.findById(destinataireId).ifPresent(d -> {
            if (d.getStatut() != CrmDestinataire.Statut.CLIQUE) {
                d.setStatut(CrmDestinataire.Statut.CLIQUE);
                destinataireRepo.save(d);
                campagneRepo.findById(d.getCampagne().getId()).ifPresent(c -> {
                    c.setNbCliques(c.getNbCliques() + 1);
                    campagneRepo.save(c);
                });
            }
        });
        return url;
    }

    // ─── Envoi email ──────────────────────────────────────────────────────────

    private boolean sendEmail(String to, String subject, String html) {
        if (to == null || to.isBlank()) return false;
        if (!mailEnabled) {
            log.info("[EMAIL MOCK] → {} | {}", to, subject);
            return true;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper h = new MimeMessageHelper(msg, false, "UTF-8");
            h.setFrom(mailFrom); h.setTo(to); h.setSubject(subject); h.setText(html, true);
            mailSender.send(msg);
            return true;
        } catch (MessagingException ex) {
            log.error("Échec email → {}: {}", to, ex.getMessage());
            return false;
        }
    }

    // ─── Envoi SMS ────────────────────────────────────────────────────────────

    private boolean sendSms(String to, String message) {
        if (to == null || to.isBlank()) return false;
        if ("mock".equalsIgnoreCase(smsProvider)) {
            log.info("[SMS MOCK] → {} : {}", to, message);
            return true;
        }
        try {
            RestClient client = RestClient.create();
            Map<String, String> body = Map.of(
                    "to", to, "message", message,
                    "sender", smsSenderId, "apiKey", smsApiKey);
            client.post().uri(smsApiUrl).body(body).retrieve().toBodilessEntity();
            return true;
        } catch (Exception ex) {
            log.error("Échec SMS → {}: {}", to, ex.getMessage());
            return false;
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private List<CrmContact> resolveContacts(UUID entrepriseId, CrmDto.CampagneRequest req) {
        if (req.tousContacts()) {
            return contactRepo.findByEntrepriseIdAndStatutOrderByCreatedAtDesc(entrepriseId, CrmContact.Statut.ACTIF);
        }
        if (req.filtreTag() != null && !req.filtreTag().isBlank()) {
            String tag = req.filtreTag().toLowerCase();
            return contactRepo.search(entrepriseId, null).stream()
                    .filter(c -> c.getTags() != null && c.getTags().toLowerCase().contains(tag))
                    .toList();
        }
        if (req.contactIds() != null && !req.contactIds().isEmpty()) {
            return contactRepo.findAllById(req.contactIds());
        }
        return List.of();
    }

    private String renderTemplate(String template, CrmDestinataire dest) {
        if (template == null) return "";
        return template
                .replace("{{nom}}", dest.getNom() != null ? dest.getNom() : "")
                .replace("{{email}}", dest.getEmail() != null ? dest.getEmail() : "")
                .replace("{{telephone}}", dest.getTelephone() != null ? dest.getTelephone() : "")
                .replace("{{societe}}", dest.getContact() != null && dest.getContact().getSociete() != null
                        ? dest.getContact().getSociete() : "")
                .replace("{{poste}}", dest.getContact() != null && dest.getContact().getPoste() != null
                        ? dest.getContact().getPoste() : "");
    }

    private String wrapHtmlEmail(String sujet, String contenu, UUID destinataireId) {
        String trackOpen  = apiBaseUrl + "/api/crm/track/open/"  + destinataireId;
        String pixelImg   = "<img src=\"" + trackOpen + "\" width=\"1\" height=\"1\" alt=\"\" style=\"display:none;\">";
        String htmlBody   = contenu.contains("<") ? contenu : contenu.replace("\n", "<br>");
        return """
            <!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
            <title>%s</title></head>
            <body style="font-family:sans-serif;max-width:640px;margin:32px auto;color:#1f2937;">
              %s
              %s
            </body></html>
            """.formatted(escapeHtml(sujet), htmlBody, pixelImg);
    }

    private CrmCampagne findCampagne(UUID id, UUID entrepriseId) {
        CrmCampagne c = campagneRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Campagne introuvable"));
        if (!c.getEntreprise().getId().equals(entrepriseId))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Accès refusé");
        return c;
    }

    CrmDto.CampagneResponse toCampagneResponse(CrmCampagne c) {
        return new CrmDto.CampagneResponse(c.getId(), c.getNom(), c.getType().name(),
                c.getSujet(), c.getStatut().name(),
                c.getNbDestinataires(), c.getNbEnvoyes(), c.getNbOuverts(),
                c.getNbCliques(), c.getNbEchecs(),
                c.getDateEnvoiReel(), c.getCreatedAt());
    }

    private CrmDto.DestinataireResponse toDestinataireResponse(CrmDestinataire d) {
        return new CrmDto.DestinataireResponse(d.getId(), d.getNom(), d.getEmail(),
                d.getTelephone(), d.getStatut().name(), d.getErreur(), d.getSentAt());
    }

    private static String escapeHtml(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
