package com.edefence.ecompta.dto.paiement;

import com.edefence.ecompta.domain.SouscriptionSaas;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.util.UUID;

public record SouscriptionSaasDto(
    UUID id,
    UUID entrepriseId,
    String entrepriseNom,
    String planCode,
    String periodicite,
    BigDecimal montant,
    String modePaiement,
    String statut,
    String customerName,
    String customerEmail,
    String referenceVirement,
    LocalDate dateDebut,
    LocalDate dateFin,
    ZonedDateTime createdAt,
    ZonedDateTime confirmedAt
) {
    public static SouscriptionSaasDto from(SouscriptionSaas s) {
        return new SouscriptionSaasDto(
            s.getId(),
            s.getEntreprise().getId(),
            s.getEntreprise().getNom(),
            s.getPlanCode(),
            s.getPeriodicite().name(),
            s.getMontant(),
            s.getModePaiement().name(),
            s.getStatut().name(),
            s.getCustomerName(),
            s.getCustomerEmail(),
            s.getReferenceVirement(),
            s.getDateDebut(),
            s.getDateFin(),
            s.getCreatedAt(),
            s.getConfirmedAt()
        );
    }
}
