package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.auth.AuthResponseDto;
import com.edefence.ecompta.dto.auth.LoginDto;
import com.edefence.ecompta.dto.auth.ProfileDto;
import com.edefence.ecompta.dto.auth.RegisterDto;
import com.edefence.ecompta.dto.auth.UpdateProfileDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.UtilisateurRepository;
import com.edefence.ecompta.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final EntrepriseRepository entrepriseRepo;
    private final UtilisateurRepository utilisateurRepo;
    private final CompteComptableService compteService;
    private final PasswordEncoder encoder;
    private final JwtService jwtService;
    private final AuthenticationManager authManager;

    @Transactional
    public AuthResponseDto register(RegisterDto dto) {
        if (utilisateurRepo.existsByEmail(dto.email())) {
            throw new IllegalStateException("Email déjà utilisé");
        }

        Entreprise entreprise = entrepriseRepo.save(
                Entreprise.builder()
                        .nom(dto.nomEntreprise())
                        .pays(dto.pays())
                        .build()
        );

        Utilisateur user = utilisateurRepo.save(
                Utilisateur.builder()
                        .nom(dto.nomUtilisateur())
                        .email(dto.email())
                        .motDePasseHash(encoder.encode(dto.motDePasse()))
                        .role(Utilisateur.Role.ADMIN)
                        .entreprise(entreprise)
                        .build()
        );

        // Auto-seed SYSCOHADA plan de comptes
        compteService.seedSyscohadaForEntreprise(entreprise);

        String token = jwtService.generate(user.getEmail(), entreprise.getId(), user.getRole().name());
        return toResponse(token, user, entreprise);
    }

    public AuthResponseDto login(LoginDto dto) {
        authManager.authenticate(new UsernamePasswordAuthenticationToken(dto.email(), dto.motDePasse()));

        Utilisateur user = utilisateurRepo.findByEmail(dto.email())
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));

        String token = jwtService.generate(user.getEmail(), user.getEntreprise().getId(), user.getRole().name());
        return toResponse(token, user, user.getEntreprise());
    }

    @Transactional(readOnly = true)
    public ProfileDto getMe(String email) {
        Utilisateur user = utilisateurRepo.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
        Entreprise e = user.getEntreprise();
        return new ProfileDto(user.getId(), user.getNom(), user.getEmail(),
                user.getRole().name(), e.getId(), e.getNom(), e.getPays(), e.getPlan(), user.getCreatedAt());
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
                user.getRole().name(), e.getId(), e.getNom(), e.getPays(), e.getPlan(), user.getCreatedAt());
    }

    private AuthResponseDto toResponse(String token, Utilisateur user, Entreprise entreprise) {
        return new AuthResponseDto(
                token,
                user.getEmail(),
                user.getNom(),
                user.getRole().name(),
                entreprise.getId(),
                entreprise.getNom()
        );
    }
}
