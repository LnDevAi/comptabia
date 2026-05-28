package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.admin.InvitationDto;
import com.edefence.comptabia.dto.auth.AuthResponseDto;
import com.edefence.comptabia.dto.auth.LoginDto;
import com.edefence.comptabia.dto.auth.ProfileDto;
import com.edefence.comptabia.dto.auth.RegisterDto;
import com.edefence.comptabia.dto.auth.UpdateProfileDto;
import com.edefence.comptabia.service.AdminUtilisateurService;
import com.edefence.comptabia.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;

@Tag(name = "Authentification", description = "Inscription, connexion, profil utilisateur")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AdminUtilisateurService adminUtilisateurService;
    private final StringRedisTemplate redisTemplate;

    @Operation(summary = "Créer un compte entreprise", description = "Crée une nouvelle entreprise et un utilisateur ADMIN. Retourne un JWT valide immédiatement.")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponseDto register(@Valid @RequestBody RegisterDto dto) {
        return authService.register(dto);
    }

    @Operation(summary = "Se connecter", description = "Authentifie un utilisateur et retourne un JWT Bearer à utiliser dans toutes les requêtes suivantes.")
    @PostMapping("/login")
    public AuthResponseDto login(@Valid @RequestBody LoginDto dto) {
        return authService.login(dto);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader("Authorization") String authHeader,
                       @AuthenticationPrincipal UserDetails user) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            redisTemplate.opsForValue().set("blacklist:" + token, "1", Duration.ofHours(24));
        }
    }

    @GetMapping("/me")
    public ProfileDto me(@AuthenticationPrincipal UserDetails user) {
        return authService.getMe(user.getUsername());
    }

    @PatchMapping("/me")
    public ProfileDto updateMe(@AuthenticationPrincipal UserDetails user,
                               @Valid @RequestBody UpdateProfileDto dto) {
        return authService.updateMe(user.getUsername(), dto);
    }

    @Operation(summary = "Accepter une invitation", description = "Définit le mot de passe et active le compte après clic sur le lien d'invitation.")
    @PostMapping("/accept-invite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void acceptInvite(@RequestBody InvitationDto.AcceptInviteRequest req) {
        adminUtilisateurService.accepterInvitation(req);
    }
}
