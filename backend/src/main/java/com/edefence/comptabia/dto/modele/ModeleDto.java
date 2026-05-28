package com.edefence.comptabia.dto.modele;

import com.edefence.comptabia.domain.EcritureComptable;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class ModeleDto {

    public record LigneRequest(
            UUID compteId,
            String libelle,
            BigDecimal debit,
            BigDecimal credit,
            int ordre
    ) {}

    public record LigneResponse(
            UUID id,
            UUID compteId,
            String compteNumero,
            String compteIntitule,
            String libelle,
            BigDecimal debit,
            BigDecimal credit,
            int ordre
    ) {}

    public record Request(
            String nom,
            String libelleDefaut,
            EcritureComptable.Journal journal,
            List<LigneRequest> lignes
    ) {}

    public record Response(
            UUID id,
            String nom,
            String libelleDefaut,
            String journal,
            List<LigneResponse> lignes,
            OffsetDateTime createdAt
    ) {}

    public record InstancierRequest(
            java.time.LocalDate date,
            String numeroPiece
    ) {}
}
