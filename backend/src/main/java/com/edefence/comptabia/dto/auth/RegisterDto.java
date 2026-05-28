package com.edefence.comptabia.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterDto(
        @NotBlank String nomEntreprise,
        @NotBlank String pays,
        @NotBlank String nomUtilisateur,
        @Email @NotBlank String email,
        @Size(min = 8) @NotBlank String motDePasse,
        com.edefence.comptabia.domain.Entreprise.TypeEntite typeEntite
) {}
