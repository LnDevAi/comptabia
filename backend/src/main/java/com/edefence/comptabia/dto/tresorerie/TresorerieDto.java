package com.edefence.comptabia.dto.tresorerie;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public final class TresorerieDto {

    private TresorerieDto() {}

    // ─── Comptes ──────────────────────────────────────────────────────────────

    public record CompteRequest(
            @NotBlank @Size(max = 255) String libelle,
            @Size(max = 100) String banque,
            @Size(max = 34) String iban,
            @Size(max = 11) String bic,
            @Size(max = 20) String compteComptableNumero,
            String typeCompte,
            BigDecimal seuilAlerte
    ) {}

    public record CompteResponse(
            UUID id,
            String libelle,
            String banque,
            String iban,
            String bic,
            String compteComptableNumero,
            String typeCompte,
            BigDecimal soldeReel,
            LocalDate soldeDate,
            BigDecimal seuilAlerte,
            boolean actif,
            boolean enAlerte,
            OffsetDateTime createdAt
    ) {}

    public record SoldeRequest(
            @NotNull BigDecimal solde,
            @NotNull LocalDate date
    ) {}

    // ─── Mouvements ───────────────────────────────────────────────────────────

    public record MouvementRequest(
            @NotNull UUID compteId,
            UUID compteDestId,
            @NotBlank String typeMouvement,
            @NotBlank @Size(max = 500) String libelle,
            @NotNull @DecimalMin("0.01") BigDecimal montant,
            @NotNull LocalDate dateOperation,
            @Size(max = 100) String reference
    ) {}

    public record MouvementResponse(
            UUID id,
            String compteLibelle,
            String compteDestLibelle,
            String typeMouvement,
            String libelle,
            BigDecimal montant,
            LocalDate dateOperation,
            String reference,
            OffsetDateTime createdAt
    ) {}

    // ─── Alertes ──────────────────────────────────────────────────────────────

    public record AlerteResponse(
            UUID id,
            String compteLibelle,
            String typeAlerte,
            String message,
            BigDecimal soldeConstate,
            boolean acquittee,
            OffsetDateTime createdAt
    ) {}

    // ─── Dashboard ────────────────────────────────────────────────────────────

    public record Dashboard(
            BigDecimal soldeConsolide,
            int nombreComptes,
            long alertesActives,
            List<CompteResponse> comptes,
            List<MouvementResponse> derniersMovements,
            List<AlerteResponse> alertesRecentes
    ) {}

    // ─── Flux mensuels ────────────────────────────────────────────────────────

    public record FluxMensuel(
            int        mois,
            String     label,
            BigDecimal encaissements,
            BigDecimal decaissements,
            BigDecimal fluxNet
    ) {}

    public record StatFlux(
            int              exercice,
            BigDecimal       totalEncaissements,
            BigDecimal       totalDecaissements,
            BigDecimal       fluxNetAnnuel,
            List<FluxMensuel> mensuel
    ) {}

    // ─── Import OFX ───────────────────────────────────────────────────────────

    public record ImportResult(int imported, int skipped, String message) {}
}
