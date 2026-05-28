package com.edefence.comptabia.dto.portail;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public final class ClientPortailDto {

    private ClientPortailDto() {}

    public record AuthRequest(String email) {}

    public record VerifyRequest(String email, String code) {}

    public record PortailTokenResponse(String token, String nomTiers, String nomEntreprise) {}

    public record FactureClientResponse(
            UUID id,
            String numero,
            LocalDate dateFacture,
            LocalDate dateEcheance,
            String statut,
            BigDecimal montantHt,
            BigDecimal montantTva,
            BigDecimal montantTtc,
            String nomEntreprise,
            OffsetDateTime createdAt
    ) {}
}
