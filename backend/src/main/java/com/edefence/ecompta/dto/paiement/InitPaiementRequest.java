package com.edefence.ecompta.dto.paiement;

import com.edefence.ecompta.domain.SouscriptionSaas.ModePaiement;
import com.edefence.ecompta.domain.SouscriptionSaas.Periodicite;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InitPaiementRequest(
    @NotBlank String planCode,
    @NotNull Periodicite periodicite,
    @NotNull ModePaiement modePaiement,
    @NotBlank String customerName,
    @NotBlank @Email String customerEmail
) {}
