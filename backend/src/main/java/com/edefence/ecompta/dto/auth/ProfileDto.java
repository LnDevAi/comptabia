package com.edefence.ecompta.dto.auth;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.Utilisateur;

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
        OffsetDateTime createdAt
) {}
