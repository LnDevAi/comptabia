package com.edefence.ecompta.dto.auth;

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
