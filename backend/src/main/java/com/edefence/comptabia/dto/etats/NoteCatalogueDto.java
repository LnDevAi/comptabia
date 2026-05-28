package com.edefence.comptabia.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public class NoteCatalogueDto {

    public record Definition(
        int numero,
        String groupe,
        String titre,
        String type
    ) {}

    public record Ligne(
        String numero,
        String intitule,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal solde
    ) {}

    public record NoteCalculee(
        int numero,
        String titre,
        List<Ligne> lignes,
        BigDecimal totalDebit,
        BigDecimal totalCredit,
        BigDecimal totalSolde,
        String remarque
    ) {}
}
