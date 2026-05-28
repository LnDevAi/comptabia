package com.edefence.comptabia.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public class EvcapDto {

    public record Ligne(
        String numero,
        String intitule,
        BigDecimal soldeDebut,
        BigDecimal augmentations,
        BigDecimal diminutions,
        BigDecimal soldeFin
    ) {}

    public record Response(
        int exercice,
        List<Ligne> lignes,
        BigDecimal totalDebut,
        BigDecimal totalAugmentations,
        BigDecimal totalDiminutions,
        BigDecimal totalFin
    ) {}
}
