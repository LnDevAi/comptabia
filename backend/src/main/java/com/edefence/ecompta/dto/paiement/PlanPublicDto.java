package com.edefence.ecompta.dto.paiement;

import java.math.BigDecimal;
import java.util.List;

public record PlanPublicDto(
    String code,
    String nom,
    String description,
    BigDecimal prixMensuel,
    BigDecimal prixAnnuel,
    List<String> modules,
    int maxUtilisateurs,
    boolean populaire
) {}
