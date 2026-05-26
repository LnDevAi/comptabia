package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.alerte.AlerteDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.UtilisateurRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailNotificationService {

    private final JavaMailSender        mailSender;
    private final AlerteService         alerteService;
    private final EntrepriseRepository  entrepriseRepo;
    private final UtilisateurRepository utilisateurRepo;

    @Value("${app.mail.from:noreply@ecompta.app}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    // ─── Digest quotidien à 8h ────────────────────────────────────────────────

    @Scheduled(cron = "0 0 8 * * *")
    public void digestQuotidien() {
        if (!mailEnabled) return;

        List<Entreprise> toutes = entrepriseRepo.findAll();
        for (Entreprise e : toutes) {
            try {
                AlerteDto.AlerteResponse alertes = alerteService.getAlertes(e.getId());
                if (alertes.countDanger() > 0) {
                    envoyerDigestDanger(e, alertes);
                }
            } catch (Exception ex) {
                log.warn("Email digest failed for entreprise {}: {}", e.getId(), ex.getMessage());
            }
        }
    }

    // ─── Envoi immédiat sur demande ───────────────────────────────────────────

    public void sendTestEmail(UUID entrepriseId) {
        if (!mailEnabled) {
            throw new IllegalStateException("Les notifications email sont désactivées (MAIL_ENABLED=false).");
        }
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Entreprise introuvable"));

        AlerteDto.AlerteResponse alertes = alerteService.getAlertes(entrepriseId);
        envoyerDigestDanger(e, alertes);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void envoyerDigestDanger(Entreprise entreprise, AlerteDto.AlerteResponse alertes) {
        List<Utilisateur> admins = utilisateurRepo.findAdminsByEntrepriseId(
                entreprise.getId(), Utilisateur.Role.ADMIN);

        if (admins.isEmpty()) {
            log.debug("Aucun admin actif pour {} — email ignoré", entreprise.getNom());
            return;
        }

        String sujet = String.format("[e-Compta] %d alerte(s) critique(s) — %s",
                alertes.countDanger(), entreprise.getNom());

        String html = buildHtml(entreprise, alertes);

        for (Utilisateur admin : admins) {
            try {
                envoyer(admin.getEmail(), sujet, html);
                log.info("Email digest envoyé à {} ({})", admin.getEmail(), entreprise.getNom());
            } catch (Exception ex) {
                log.error("Échec envoi email à {}: {}", admin.getEmail(), ex.getMessage());
            }
        }
    }

    private void envoyer(String to, String subject, String html) throws MessagingException {
        MimeMessage msg = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(msg, false, "UTF-8");
        helper.setFrom(from);
        helper.setTo(to);
        helper.setSubject(subject);
        helper.setText(html, true);
        mailSender.send(msg);
    }

    private String buildHtml(Entreprise entreprise, AlerteDto.AlerteResponse alertes) {
        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));

        StringBuilder rows = new StringBuilder();
        for (AlerteDto.Alerte a : alertes.alertes()) {
            String color = switch (a.niveau()) {
                case DANGER  -> "#dc2626";
                case WARNING -> "#ea580c";
                case INFO    -> "#2563eb";
            };
            String badge = switch (a.niveau()) {
                case DANGER  -> "CRITIQUE";
                case WARNING -> "AVERTISSEMENT";
                case INFO    -> "INFO";
            };
            rows.append(String.format("""
                <tr>
                  <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;">
                    <span style="display:inline-block;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;background:%s22;color:%s;">%s</span>
                  </td>
                  <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111827;">%s</td>
                  <td style="padding:10px 16px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:13px;">%s</td>
                </tr>
                """, color, color, badge,
                    escapeHtml(a.titre()),
                    escapeHtml(a.message())));
        }

        return String.format("""
            <!DOCTYPE html>
            <html lang="fr">
            <head><meta charset="UTF-8"></head>
            <body style="margin:0;padding:0;background:#f9fafb;font-family:sans-serif;">
              <div style="max-width:640px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

                <!-- Header -->
                <div style="background:#1d4ed8;padding:24px 32px;">
                  <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">e-Compta</h1>
                  <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Rapport d'alertes du %s</p>
                </div>

                <!-- Summary -->
                <div style="padding:24px 32px 0;">
                  <p style="margin:0;font-size:15px;color:#374151;">
                    Bonjour,<br><br>
                    Voici le résumé des alertes comptables détectées pour <strong>%s</strong> au %s.
                  </p>
                  <div style="display:flex;gap:16px;margin:20px 0;">
                    <div style="flex:1;text-align:center;padding:16px;background:#fef2f2;border-radius:8px;">
                      <p style="margin:0;font-size:28px;font-weight:700;color:#dc2626;">%d</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#ef4444;text-transform:uppercase;letter-spacing:.05em;">Critiques</p>
                    </div>
                    <div style="flex:1;text-align:center;padding:16px;background:#fff7ed;border-radius:8px;">
                      <p style="margin:0;font-size:28px;font-weight:700;color:#ea580c;">%d</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#f97316;text-transform:uppercase;letter-spacing:.05em;">Avertissements</p>
                    </div>
                    <div style="flex:1;text-align:center;padding:16px;background:#eff6ff;border-radius:8px;">
                      <p style="margin:0;font-size:28px;font-weight:700;color:#2563eb;">%d</p>
                      <p style="margin:4px 0 0;font-size:12px;color:#3b82f6;text-transform:uppercase;letter-spacing:.05em;">Informations</p>
                    </div>
                  </div>
                </div>

                <!-- Alert table -->
                <div style="padding:0 32px 24px;">
                  <table style="width:100%%;border-collapse:collapse;font-size:14px;">
                    <thead>
                      <tr style="background:#f9fafb;">
                        <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e5e7eb;">Niveau</th>
                        <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e5e7eb;">Alerte</th>
                        <th style="padding:10px 16px;text-align:left;font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.05em;border-bottom:2px solid #e5e7eb;">Détail</th>
                      </tr>
                    </thead>
                    <tbody>%s</tbody>
                  </table>
                </div>

                <!-- Footer -->
                <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
                    Connectez-vous à e-Compta pour traiter ces alertes.<br>
                    Cet email est généré automatiquement — ne pas répondre.
                  </p>
                </div>
              </div>
            </body>
            </html>
            """,
                date,
                escapeHtml(entreprise.getNom()), date,
                alertes.countDanger(), alertes.countWarning(), alertes.countInfo(),
                rows);
    }

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
