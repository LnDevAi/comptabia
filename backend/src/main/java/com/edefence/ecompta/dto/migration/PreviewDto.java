package com.edefence.ecompta.dto.migration;

import java.util.List;

public record PreviewDto(
    List<String> colonnes,
    List<List<String>> lignes,   // premières 20 lignes brutes
    int totalLignes,
    String separateurDetecte,
    List<ColonneMapping> mappingSuggere
) {
    public record ColonneMapping(String colonneSource, String champCible) {}
}
