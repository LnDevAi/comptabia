package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.admin.InvitationDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUtilisateurService {

    private final UtilisateurRepository utilisateurRepo;
    private final EntrepriseRepository  entrepriseRepo;
    private final PasswordEncoder       encoder;
    private final JavaMailSender        mailSender;

    @Value("${app.mail.from:noreply@ecompta.app}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.frontend-url:http://localhost:4200}")
    private String frontendUrl;

    // ─── Lister les utilisateurs de l'entreprise ─────────────────────────────

    @Transactional(readOnly = true)
    public List<InvitationDto.UtilisateurAdminResponse> lister(UUID entrepriseId) {
        return utilisateurRepo.findByEntrepriseIdOrderByCreatedAtDesc(entrepriseId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    // ─── Inviter un nouvel utilisateur ────────────────────────────────────────

    @Transactional
    public InvitationDto.UtilisateurAdminResponse inviter(UUID entrepriseId,
                                                          InvitationDto.InviteRequest req,
                                                          String invitedByEmail) {
        if (utilisateurRepo.existsByEmail(req.email())) {
            throw new IllegalStateException("Cet email est déjà utilisé.");
        }
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));

        String token = UUID.randomUUID().toString();
        Utilisateur u = utilisateurRepo.save(Utilisateur.builder()
                .nom(req.nom())
                .email(req.email())
                .motDePasseHash(encoder.encode(UUID.randomUUID().toString()))
                .role(req.role())
                .entreprise(entreprise)
                .actif(false)
                .inviteToken(token)
                .inviteExpiresAt(OffsetDateTime.now().plusDays(7))
                .build());

        sendInviteEmail(u, invitedByEmail, entreprise.getNom());
        return toResponse(u);
    }

    // ─── Accepter une invitation (public) ────────────────────────────────────

    @Transactional
    public void accepterInvitation(InvitationDto.AcceptInviteRequest req) {
        Utilisateur u = utilisateurRepo.findByInviteToken(req.token())
                .orElseThrow(() -> new IllegalStateException("Invitation invalide ou expirée."));

        if (!u.isInvitePending()) {
            throw new IllegalStateException("Invitation déjà utilisée.");
        }
        if (OffsetDateTime.now().isAfter(u.getInviteExpiresAt())) {
            throw new IllegalStateException("Invitation expirée. Demandez une nouvelle invitation.");
        }
        if (req.motDePasse() == null || req.motDePasse().length() < 8) {
            throw new IllegalArgumentException("Mot de passe : 8 caractères minimum.");
        }

        u.setMotDePasseHash(encoder.encode(req.motDePasse()));
        u.setActif(true);
        u.setInviteToken(null);
        u.setInviteExpiresAt(null);
        utilisateurRepo.save(u);
    }

    // ─── Changer le rôle ─────────────────────────────────────────────────────

    @Transactional
    public InvitationDto.UtilisateurAdminResponse changerRole(UUID entrepriseId, UUID utilisateurId,
                                                              InvitationDto.ChangeRoleRequest req,
                                                              String currentUserEmail) {
        Utilisateur u = getUtilisateurDuTenant(entrepriseId, utilisateurId);
        if (u.getEmail().equals(currentUserEmail)) {
            throw new IllegalStateException("Vous ne pouvez pas modifier votre propre rôle.");
        }
        u.setRole(req.role());
        return toResponse(utilisateurRepo.save(u));
    }

    // ─── Activer / désactiver ─────────────────────────────────────────────────

    @Transactional
    public InvitationDto.UtilisateurAdminResponse toggleActif(UUID entrepriseId, UUID utilisateurId,
                                                              boolean actif, String currentUserEmail) {
        Utilisateur u = getUtilisateurDuTenant(entrepriseId, utilisateurId);
        if (u.getEmail().equals(currentUserEmail)) {
            throw new IllegalStateException("Vous ne pouvez pas désactiver votre propre compte.");
        }
        u.setActif(actif);
        return toResponse(utilisateurRepo.save(u));
    }

    // ─── Supprimer (désactivation définitive) ────────────────────────────────

    @Transactional
    public void supprimer(UUID entrepriseId, UUID utilisateurId, String currentUserEmail) {
        Utilisateur u = getUtilisateurDuTenant(entrepriseId, utilisateurId);
        if (u.getEmail().equals(currentUserEmail)) {
            throw new IllegalStateException("Vous ne pouvez pas supprimer votre propre compte.");
        }
        utilisateurRepo.delete(u);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Utilisateur getUtilisateurDuTenant(UUID entrepriseId, UUID utilisateurId) {
        Utilisateur u = utilisateurRepo.findById(utilisateurId)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        if (!u.getEntreprise().getId().equals(entrepriseId)) {
            throw new IllegalStateException("Accès refusé.");
        }
        return u;
    }

    private InvitationDto.UtilisateurAdminResponse toResponse(Utilisateur u) {
        return new InvitationDto.UtilisateurAdminResponse(
                u.getId(), u.getNom(), u.getEmail(), u.getRole().name(),
                u.isActif(), u.isInvitePending(), u.isTotpEnabled(), u.getCreatedAt()
        );
    }

    private void sendInviteEmail(Utilisateur u, String invitedByEmail, String entrepriseNom) {
        if (!mailEnabled) {
            log.info("Mail disabled — invitation link for {}: {}/auth/accept-invite?token={}",
                    u.getEmail(), frontendUrl, u.getInviteToken());
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(u.getEmail());
            helper.setSubject("Invitation à rejoindre " + entrepriseNom + " sur e-Compta");
            String link = frontendUrl + "/auth/accept-invite?token=" + u.getInviteToken();
            helper.setText(buildInviteHtml(u.getNom(), entrepriseNom, invitedByEmail, link), true);
            mailSender.send(msg);
        } catch (MessagingException e) {
            log.error("Échec envoi invitation à {}", u.getEmail(), e);
        }
    }

    private String buildInviteHtml(String nom, String entreprise, String invitedBy, String link) {
        return """
            <div style="font-family:sans-serif;max-width:560px;margin:auto">
              <h2 style="color:#1d4ed8">Invitation e-Compta</h2>
              <p>Bonjour <strong>%s</strong>,</p>
              <p>%s vous invite à rejoindre l'espace comptable <strong>%s</strong> sur e-Compta.</p>
              <p style="margin:24px 0">
                <a href="%s" style="background:#1d4ed8;color:#fff;padding:12px 24px;
                   border-radius:8px;text-decoration:none;font-weight:600">
                  Créer mon mot de passe
                </a>
              </p>
              <p style="color:#6b7280;font-size:13px">
                Ce lien est valable 7 jours. Si vous n'attendiez pas cette invitation, ignorez cet email.
              </p>
            </div>
            """.formatted(escHtml(nom), escHtml(invitedBy), escHtml(entreprise), link);
    }

    private String escHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
