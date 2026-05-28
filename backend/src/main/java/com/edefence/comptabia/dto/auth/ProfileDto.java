package com.edefence.comptabia.dto.auth;

import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.Utilisateur;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ProfileDto(
        UUID id,
        String nom,
        String email,
        String role,
        UUID entrepriseId,
        String nomEntreprise,
        String pays,
        Entreprise.PlanType plan,
        Entreprise.TypeEntite typeEntite,
        OffsetDateTime createdAt,
        boolean totpEnabled
) {}
