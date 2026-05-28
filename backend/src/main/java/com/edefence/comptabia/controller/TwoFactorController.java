package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.auth.AuthResponseDto;
import com.edefence.comptabia.dto.auth.TwoFactorDto;
import com.edefence.comptabia.repository.UtilisateurRepository;
import com.edefence.comptabia.security.JwtService;
import com.edefence.comptabia.service.TotpService;
import com.edefence.comptabia.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Tag(name = "Authentification", description = "Inscription, connexion, profil utilisateur")
@RestController
@RequestMapping("/api/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final TotpService              totpService;
    private final UtilisateurRepository    utilisateurRepo;
    private final JwtService               jwtService;
    private final StringRedisTemplate      redisTemplate;

    // ─── Setup : génère secret + QR code ─────────────────────────────────────

    @Operation(summary = "Initialiser la 2FA", description = "Génère un secret TOTP et son QR code à scanner dans Google Authenticator / Authy. Le secret est stocké temporairement 10 min.")
    @GetMapping("/setup")
    public TwoFactorDto.SetupResponse setup(@AuthenticationPrincipal UserDetails user) {
        Utilisateur u = findUser(user.getUsername());
        if (u.isTotpEnabled()) {
            throw new IllegalStateException("La 2FA est déjà activée.");
        }
        String secret = totpService.generateSecret();
        // Stockage temporaire jusqu'à confirmation
        redisTemplate.opsForValue().set("2fa_setup:" + u.getId(), secret, Duration.ofMinutes(10));
        String qr  = totpService.getQrCodeBase64(u.getEmail(), secret);
        String uri = totpService.getOtpUri(u.getEmail(), secret);
        return new TwoFactorDto.SetupResponse(qr, secret, uri);
    }

    // ─── Enable : valider le code + persister ─────────────────────────────────

    @Operation(summary = "Activer la 2FA", description = "Vérifie le code TOTP saisi par l'utilisateur puis active la 2FA sur le compte.")
    @PostMapping("/enable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void enable(@AuthenticationPrincipal UserDetails user,
                       @RequestBody TwoFactorDto.EnableRequest req) {
        Utilisateur u = findUser(user.getUsername());
        String secret = redisTemplate.opsForValue().get("2fa_setup:" + u.getId());
        if (secret == null) {
            throw new IllegalStateException("Session d'initialisation expirée. Recommencez la configuration.");
        }
        if (!totpService.isValid(secret, req.code())) {
            throw new BadCredentialsException("Code TOTP invalide.");
        }
        u.setTotpSecret(secret);
        u.setTotpEnabled(true);
        utilisateurRepo.save(u);
        redisTemplate.delete("2fa_setup:" + u.getId());
    }

    // ─── Disable : désactiver après vérification du code ─────────────────────

    @Operation(summary = "Désactiver la 2FA", description = "Désactive la 2FA après vérification d'un code TOTP valide.")
    @PostMapping("/disable")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void disable(@AuthenticationPrincipal UserDetails user,
                        @RequestBody TwoFactorDto.DisableRequest req) {
        Utilisateur u = findUser(user.getUsername());
        if (!u.isTotpEnabled()) {
            throw new IllegalStateException("La 2FA n'est pas activée.");
        }
        if (!totpService.isValid(u.getTotpSecret(), req.code())) {
            throw new BadCredentialsException("Code TOTP invalide.");
        }
        u.setTotpEnabled(false);
        u.setTotpSecret(null);
        utilisateurRepo.save(u);
    }

    // ─── Verify : vérifier code pendant le login ──────────────────────────────

    @Operation(summary = "Vérifier le code 2FA", description = "Appelé après le login quand requiresTwoFactor=true. Retourne le JWT complet si le code est valide.")
    @PostMapping("/verify")
    public AuthResponseDto verify(@RequestBody TwoFactorDto.VerifyRequest req) {
        String email = redisTemplate.opsForValue().get(AuthService.TOTP_PENDING_PREFIX + req.tempToken());
        if (email == null) {
            throw new IllegalStateException("Session 2FA expirée ou invalide. Reconnectez-vous.");
        }
        Utilisateur u = findUser(email);
        if (!totpService.isValid(u.getTotpSecret(), req.code())) {
            throw new BadCredentialsException("Code TOTP invalide.");
        }
        redisTemplate.delete(AuthService.TOTP_PENDING_PREFIX + req.tempToken());
        String token = jwtService.generate(u.getEmail(), u.getEntreprise().getId(), u.getRole().name());
        return new AuthResponseDto(token, u.getEmail(), u.getNom(), u.getRole().name(),
                u.getEntreprise().getId(), u.getEntreprise().getNom(), null, null);
    }

    // ─── Status ───────────────────────────────────────────────────────────────

    @Operation(summary = "Statut 2FA", description = "Retourne si la 2FA est activée pour l'utilisateur courant.")
    @GetMapping("/status")
    public TwoFactorDto.StatusResponse status(@AuthenticationPrincipal UserDetails user) {
        return new TwoFactorDto.StatusResponse(findUser(user.getUsername()).isTotpEnabled());
    }

    // ─────────────────────────────────────────────────────────────────────────

    private Utilisateur findUser(String email) {
        return utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
    }
}
