package com.edefence.comptabia.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.OffsetDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "utilisateurs")
@Filter(name = "tenantFilter", condition = "entreprise_id = :entrepriseId")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Utilisateur implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "mot_de_passe_hash", nullable = false)
    private String motDePasseHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Role role = Role.COMPTABLE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "entreprise_id", nullable = false)
    private Entreprise entreprise;

    @Column(nullable = false)
    @Builder.Default
    private boolean actif = true;

    @Column(name = "invite_token", length = 64)
    private String inviteToken;

    @Column(name = "invite_expires_at")
    private OffsetDateTime inviteExpiresAt;

    @Column(name = "totp_secret", length = 64)
    private String totpSecret;

    @Column(name = "totp_enabled", nullable = false)
    @Builder.Default
    private boolean totpEnabled = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public boolean isInvitePending() {
        return !actif && inviteToken != null;
    }

    // UserDetails
    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return motDePasseHash; }
    @Override public boolean isEnabled() { return actif; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    public enum Role { ADMIN, COMPTABLE, LECTEUR }
}
