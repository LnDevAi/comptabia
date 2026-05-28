package com.edefence.comptabia.dto.tva;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class TvaDto {

    private TvaDto() {}

    public record SimulationRequest(
            @NotNull LocalDate periodeDebut,
            @NotNull LocalDate periodeFin
    ) {}

    public record LigneDetail(
            String     compteNumero,
            String     intitule,
            BigDecimal debit,
            BigDecimal credit,
            String     type
    ) {}

    public record Simulation(
            LocalDate       periodeDebut,
            LocalDate       periodeFin,
            BigDecimal      tvaCollectee,
            BigDecimal      tvaDeductible,
            BigDecimal      tvaADecaisser,
            List<LigneDetail> detail,
            boolean         dejaDeclare
    ) {}

    public record Declaration(
            UUID            id,
            LocalDate       periodeDebut,
            LocalDate       periodeFin,
            BigDecimal      tvaCollectee,
            BigDecimal      tvaDeductible,
            BigDecimal      tvaADecaisser,
            String          statut,
            UUID            ecritureId,
            OffsetDateTime  createdAt
    ) {}

    public record ValiderRequest(
            @NotNull LocalDate periodeDebut,
            @NotNull LocalDate periodeFin
    ) {}

    public record MoisTva(
            int        mois,
            String     label,
            BigDecimal tvaCollectee,
            BigDecimal tvaDeductible,
            BigDecimal tvaADecaisser
    ) {}

    public record StatAnnuelle(
            int              exercice,
            BigDecimal       totalCollectee,
            BigDecimal       totalDeductible,
            BigDecimal       totalADecaisser,
            int              nbDeclarations,
            List<Integer>    moisDeclares,
            List<MoisTva>    mensuel
    ) {}
}
