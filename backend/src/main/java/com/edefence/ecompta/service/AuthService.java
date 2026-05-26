package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.auth.AuthResponseDto;
import com.edefence.ecompta.dto.auth.LoginDto;
import com.edefence.ecompta.dto.auth.ProfileDto;
import com.edefence.ecompta.dto.auth.RegisterDto;
import com.edefence.ecompta.dto.auth.UpdateProfileDto;
import com.edefence.ecompta.domain.ReferentielFiscalPays;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.ReferentielFiscalPaysRepository;
import com.edefence.ecompta.repository.UtilisateurRepository;
import com.edefence.ecompta.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EntrepriseRepository              entrepriseRepo;
    private final UtilisateurRepository             utilisateurRepo;
    private final ReferentielFiscalPaysRepository   referentielRepo;
    private final CompteComptableService            compteService;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;
    private final StringRedisTemplate redisTemplate;

    public static final String TOTP_PENDING_PREFIX = "2fa_pending:";

    @Transactional
    public AuthResponseDto register(RegisterDto dto) {
        if (utilisateurRepo.existsByEmail(dto.email())) {
            throw new IllegalStateException("Email déjà utilisé");
        }

        // Résolution du référentiel fiscal par code pays
        ReferentielFiscalPays ref = referentielRepo.findByCode(dto.pays().toUpperCase()).orElse(null);

        Entreprise.TypeEntite typeEntite = dto.typeEntite() != null
                ? dto.typeEntite() : Entreprise.TypeEntite.ENTREPRISE;

        Entreprise.EntrepriseBuilder builder = Entreprise.builder()
                .nom(dto.nomEntreprise())
                .pays(dto.pays())
                .codePays(dto.pays().toUpperCase())
                .typeEntite(typeEntite);

        if (ref != null) {
            builder.devise(ref.getDevise())
                   .tauxTvaDefaut(ref.getTauxTva())
                   .referentielComptable(ref.getSystemeComptable());
        }
        // Surcharger le référentiel selon le type d'entité
        if (typeEntite == Entreprise.TypeEntite.ASSOCIATION) {
            builder.referentielComptable("SYCEBNL");
        } else if (typeEntite == Entreprise.TypeEntite.ASSURANCE) {
            builder.referentielComptable("CIMA");
        }

        Entreprise entreprise = entrepriseRepo.save(builder.build());

        Utilisateur user = utilisateurRepo.save(
                Utilisateur.builder()
                        .nom(dto.nomUtilisateur())
                        .email(dto.email())
                        .motDePasseHash(encoder.encode(dto.motDePasse()))
                        .role(Utilisateur.Role.ADMIN)
                        .entreprise(entreprise)
                        .build()
        );

        // Seed plan de comptes selon le type d'entité
        if (typeEntite == Entreprise.TypeEntite.ASSOCIATION) {
            compteService.seedSycebnlForEntreprise(entreprise);
        } else if (typeEntite == Entreprise.TypeEntite.ASSURANCE) {
            compteService.seedCimaForEntreprise(entreprise);
        } else {
            compteService.seedSyscohadaForEntreprise(entreprise);
        }

        String token = jwtService.generate(user.getEmail(), entreprise.getId(), user.getRole().name());
        return toResponse(token, user, entreprise);
    }

    public AuthResponseDto login(LoginDto dto) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(dto.email(), dto.motDePasse()));

        Utilisateur user = utilisateurRepo.findByEmail(dto.email())
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));

        if (user.isTotpEnabled()) {
            String tempToken = UUID.randomUUID().toString();
            redisTemplate.opsForValue().set(
                    TOTP_PENDING_PREFIX + tempToken, user.getEmail(), Duration.ofMinutes(5));
            return new AuthResponseDto(null, user.getEmail(), user.getNom(),
                    user.getRole().name(), user.getEntreprise().getId(),
                    user.getEntreprise().getNom(), true, tempToken);
        }

        String token = jwtService.generate(user.getEmail(), user.getEntreprise().getId(), user.getRole().name());
        return toResponse(token, user, user.getEntreprise());
    }

    @Transactional(readOnly = true)
    public ProfileDto getMe(String email) {
        Utilisateur user = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        Entreprise e = user.getEntreprise();
        return new ProfileDto(user.getId(), user.getNom(), user.getEmail(),
                user.getRole().name(), e.getId(), e.getNom(), e.getPays(), e.getPlan(),
                e.getTypeEntite(), user.getCreatedAt(), user.isTotpEnabled());
    }

    @Transactional
    public ProfileDto updateMe(String email, UpdateProfileDto dto) {
        Utilisateur user = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));

        if (dto.nom() != null && !dto.nom().isBlank()) {
            user.setNom(dto.nom());
        }
        if (dto.email() != null && !dto.email().isBlank() && !dto.email().equals(email)) {
            if (utilisateurRepo.existsByEmail(dto.email())) {
                throw new IllegalStateException("Email déjà utilisé");
            }
            user.setEmail(dto.email());
        }
        if (dto.nouveauMotDePasse() != null && !dto.nouveauMotDePasse().isBlank()) {
            if (dto.motDePasseActuel() == null || !encoder.matches(dto.motDePasseActuel(), user.getMotDePasseHash())) {
                throw new BadCredentialsException("Mot de passe actuel incorrect");
            }
            user.setMotDePasseHash(encoder.encode(dto.nouveauMotDePasse()));
        }

        utilisateurRepo.save(user);
        Entreprise e = user.getEntreprise();
        return new ProfileDto(user.getId(), user.getNom(), user.getEmail(),
                user.getRole().name(), e.getId(), e.getNom(), e.getPays(), e.getPlan(),
                e.getTypeEntite(), user.getCreatedAt(), user.isTotpEnabled());
    }

    private AuthResponseDto toResponse(String token, Utilisateur user, Entreprise entreprise) {
        return new AuthResponseDto(
                token,
                user.getEmail(),
                user.getNom(),
                user.getRole().name(),
                entreprise.getId(),
                entreprise.getNom(),
                null,
                null
        );
    }
}
