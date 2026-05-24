package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.admin.EntrepriseSettingsDto;
import com.edefence.ecompta.dto.admin.UtilisateurAdminDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UtilisateurRepository utilisateurRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final PasswordEncoder encoder;
    private final StringRedisTemplate redis;

    private static final Duration SESSION_TTL = Duration.ofHours(25);

    // ─── Utilisateurs ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<UtilisateurAdminDto.Response> listerUtilisateurs(UUID entrepriseId) {
        return utilisateurRepo.findByEntrepriseId(entrepriseId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public UtilisateurAdminDto.Response inviterUtilisateur(UUID entrepriseId, UtilisateurAdminDto.InviterRequest req) {
        if (utilisateurRepo.existsByEmail(req.email())) {
            throw new IllegalStateException("Cet email est déjà utilisé");
        }
        Entreprise entreprise = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        Utilisateur.Role role = parseRole(req.role());
        if (role == Utilisateur.Role.ADMIN) {
            throw new IllegalArgumentException("Impossible d'inviter un utilisateur avec le rôle ADMIN");
        }
        Utilisateur user = Utilisateur.builder()
                .nom(req.nom())
                .email(req.email())
                .motDePasseHash(encoder.encode(req.motDePasse()))
                .role(role)
                .entreprise(entreprise)
                .actif(true)
                .build();
        return toResponse(utilisateurRepo.save(user));
    }

    @Transactional
    public UtilisateurAdminDto.Response changerRole(UUID entrepriseId, UUID userId, String roleStr, String callerEmail) {
        Utilisateur user = findInTenant(userId, entrepriseId);
        if (user.getEmail().equals(callerEmail)) {
            throw new IllegalArgumentException("Vous ne pouvez pas modifier votre propre rôle");
        }
        if (user.getRole() == Utilisateur.Role.ADMIN) {
            throw new IllegalArgumentException("Impossible de modifier le rôle d'un administrateur");
        }
        Utilisateur.Role role = parseRole(roleStr);
        if (role == Utilisateur.Role.ADMIN) {
            throw new IllegalArgumentException("Impossible d'attribuer le rôle ADMIN via cette interface");
        }
        user.setRole(role);
        return toResponse(utilisateurRepo.save(user));
    }

    @Transactional
    public UtilisateurAdminDto.Response changerActif(UUID entrepriseId, UUID userId, boolean actif, String callerEmail) {
        Utilisateur user = findInTenant(userId, entrepriseId);
        if (user.getEmail().equals(callerEmail)) {
            throw new IllegalArgumentException("Vous ne pouvez pas désactiver votre propre compte");
        }
        user.setActif(actif);
        utilisateurRepo.save(user);
        // Immediately invalidate sessions for this user if deactivating
        if (!actif) {
            redis.opsForValue().set("deactivated:" + user.getEmail(), "1", SESSION_TTL);
        } else {
            redis.delete("deactivated:" + user.getEmail());
        }
        return toResponse(user);
    }

    // ─── Paramètres entreprise ────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public EntrepriseSettingsDto.Response getSettings(UUID entrepriseId) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        return toSettings(e);
    }

    @Transactional
    public EntrepriseSettingsDto.Response updateSettings(UUID entrepriseId, EntrepriseSettingsDto.UpdateRequest req) {
        Entreprise e = entrepriseRepo.findById(entrepriseId)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        if (req.nom() != null && !req.nom().isBlank())           e.setNom(req.nom());
        if (req.pays() != null && !req.pays().isBlank())         e.setPays(req.pays());
        if (req.nif()  != null)                                   e.setNif(req.nif());
        if (req.systemeComptable() != null) {
            e.setSystemeComptable(Entreprise.SystemeComptable.valueOf(req.systemeComptable()));
        }
        return toSettings(entrepriseRepo.save(e));
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Utilisateur findInTenant(UUID userId, UUID entrepriseId) {
        return utilisateurRepo.findByEntrepriseId(entrepriseId).stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur introuvable"));
    }

    private static Utilisateur.Role parseRole(String s) {
        try { return Utilisateur.Role.valueOf(s.toUpperCase()); }
        catch (Exception e) { throw new IllegalArgumentException("Rôle invalide : " + s); }
    }

    private UtilisateurAdminDto.Response toResponse(Utilisateur u) {
        return new UtilisateurAdminDto.Response(
                u.getId(), u.getNom(), u.getEmail(),
                u.getRole().name(), u.isActif(), u.getCreatedAt());
    }

    private EntrepriseSettingsDto.Response toSettings(Entreprise e) {
        return new EntrepriseSettingsDto.Response(
                e.getId(), e.getNom(), e.getPays(), e.getNif(),
                e.getPlan().name(), e.getSystemeComptable().name());
    }
}
