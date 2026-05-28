package com.edefence.ecompta.dto.paiement;

import java.math.BigDecimal;
import java.util.UUID;

public record InitPaiementResponse(
    UUID souscriptionId,
    String statut,
    String modePaiement,
    String paymentUrl,
    VirementDetails virementDetails,
    BigDecimal montant,
    String planCode,
    String periodicite
) {
    public record VirementDetails(
        String banque,
        String titulaire,
        String iban,
        String swift,
        String reference,
        BigDecimal montant,
        String instructions
    ) {}
}
