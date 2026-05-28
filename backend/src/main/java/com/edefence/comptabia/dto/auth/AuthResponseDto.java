package com.edefence.comptabia.dto.auth;

import java.util.UUID;

public record AuthResponseDto(
        String token,
        String email,
        String nom,
        String role,
        UUID entrepriseId,
        String nomEntreprise,
        Boolean requiresTwoFactor,
        String tempToken
) {}
