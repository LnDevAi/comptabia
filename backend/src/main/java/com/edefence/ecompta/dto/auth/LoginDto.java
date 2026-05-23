package com.edefence.ecompta.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginDto(
        @Email @NotBlank String email,
        @NotBlank String motDePasse
) {}
