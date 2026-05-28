package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.Facture;
import com.edefence.comptabia.domain.Tiers;
import com.edefence.comptabia.dto.portail.ClientPortailDto;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.FactureRepository;
import com.edefence.comptabia.repository.TiersRepository;
import com.edefence.comptabia.security.JwtService;
import io.jsonwebtoken.Claims;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClientPortailService {

    private final TiersRepository       tiersRepo;
    private final FactureRepository     factureRepo;
    private final EntrepriseRepository  entrepriseRepo;
    private final JwtService            jwtService;
    private final StringRedisTemplate   redis;
    private final JavaMailSender        mailSender;

    private static final String OTP_PREFIX = "portail_otp:";

    @Value("${app.mail.from:noreply@ecompta.app}")
    private String from;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    // ─── Étape 1 : envoi OTP ─────────────────────────────────────────────────

    public void sendOtp(UUID entrepriseId, String email) {
        Tiers tiers = tiersRepo.findByEmailIgnoreCaseAndEntrepriseIdAndType(
                email, entrepriseId, Tiers.TypeTiers.CLIENT)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Aucun client trouvé avec cet email dans cet espace."));

        String code = String.format("%06d", new SecureRandom().nextInt(1_000_000));
        redis.opsForValue().set(OTP_PREFIX + tiers.getId(), code, Duration.ofMinutes(15));

        sendOtpEmail(tiers, code);
    }

    // ─── Étape 2 : vérification OTP → token portail ──────────────────────────

    public ClientPortailDto.PortailTokenResponse verify(UUID entrepriseId, String email, String code) {
        Tiers tiers = tiersRepo.findByEmailIgnoreCaseAndEntrepriseIdAndType(
                email, entrepriseId, Tiers.TypeTiers.CLIENT)
                .orElseThrow(() -> new BadCredentialsException("Email ou code invalide."));

        String stored = redis.opsForValue().get(OTP_PREFIX + tiers.getId());
        if (stored == null || !stored.equals(code)) {
            throw new BadCredentialsException("Code invalide ou expiré.");
        }

        redis.delete(OTP_PREFIX + tiers.getId());
        String token = jwtService.generatePortal(email, entrepriseId, tiers.getId());
        String nomEntreprise = tiers.getEntreprise().getNom();
        return new ClientPortailDto.PortailTokenResponse(token, tiers.getNom(), nomEntreprise);
    }

    // ─── Lister les factures du client ───────────────────────────────────────

    public List<ClientPortailDto.FactureClientResponse> getFactures(String portalToken) {
        Claims claims = validatePortalToken(portalToken);
        UUID entrepriseId = UUID.fromString(claims.get("entrepriseId", String.class));
        UUID tiersId      = UUID.fromString(claims.get("tiersId", String.class));

        String nomEntreprise = entrepriseRepo.findById(entrepriseId)
                .map(e -> e.getNom()).orElse("");

        return factureRepo.findByTiersPortail(entrepriseId, tiersId)
                .stream()
                .map(f -> toResponse(f, nomEntreprise))
                .toList();
    }

    // ─── Détail d'une facture ─────────────────────────────────────────────────

    public ClientPortailDto.FactureClientResponse getFacture(String portalToken, UUID factureId) {
        Claims claims = validatePortalToken(portalToken);
        UUID entrepriseId = UUID.fromString(claims.get("entrepriseId", String.class));
        UUID tiersId      = UUID.fromString(claims.get("tiersId", String.class));

        Facture f = factureRepo.findByIdAndEntrepriseId(factureId, entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Facture introuvable."));

        if (f.getTiers() == null || !f.getTiers().getId().equals(tiersId)) {
            throw new IllegalStateException("Accès refusé.");
        }

        String nomEntreprise = f.getEntreprise().getNom();
        return toResponse(f, nomEntreprise);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Claims validatePortalToken(String bearerToken) {
        String token = bearerToken != null && bearerToken.startsWith("Bearer ")
                ? bearerToken.substring(7) : bearerToken;
        try {
            Claims claims = jwtService.parse(token);
            if (!"PORTAIL".equals(claims.get("role", String.class))) {
                throw new BadCredentialsException("Token portail invalide.");
            }
            return claims;
        } catch (BadCredentialsException e) {
            throw e;
        } catch (Exception e) {
            throw new BadCredentialsException("Token portail invalide ou expiré.");
        }
    }

    private ClientPortailDto.FactureClientResponse toResponse(Facture f, String nomEntreprise) {
        return new ClientPortailDto.FactureClientResponse(
                f.getId(), f.getNumero(), f.getDateFacture(), f.getDateEcheance(),
                f.getStatut().name(), f.getMontantHt(), f.getMontantTva(), f.getMontantTtc(),
                nomEntreprise, f.getCreatedAt()
        );
    }

    private void sendOtpEmail(Tiers tiers, String code) {
        if (!mailEnabled) {
            log.info("Mail disabled — OTP portail pour {} : {}", tiers.getEmail(), code);
            return;
        }
        try {
            MimeMessage msg = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(msg, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(tiers.getEmail());
            helper.setSubject("Votre code d'accès au portail client");
            helper.setText(buildOtpHtml(tiers.getNom(), code), true);
            mailSender.send(msg);
        } catch (MessagingException e) {
            log.error("Échec envoi OTP portail à {}", tiers.getEmail(), e);
        }
    }

    private String buildOtpHtml(String nom, String code) {
        return """
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
              <h2 style="color:#1d4ed8">Code d'accès portail</h2>
              <p>Bonjour <strong>%s</strong>,</p>
              <p>Voici votre code d'accès à votre espace de consultation de factures :</p>
              <div style="text-align:center;margin:24px 0">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1d4ed8">%s</span>
              </div>
              <p style="color:#6b7280;font-size:13px">
                Ce code est valable <strong>15 minutes</strong>. Ne le partagez pas.
              </p>
            </div>
            """.formatted(esc(nom), code);
    }

    private String esc(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
