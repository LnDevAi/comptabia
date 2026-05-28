package com.edefence.comptabia.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record UpdateProfileDto(
        String nom,
        @Email String email,
        String motDePasseActuel,
        @Size(min = 8) String nouveauMotDePasse
) {}
