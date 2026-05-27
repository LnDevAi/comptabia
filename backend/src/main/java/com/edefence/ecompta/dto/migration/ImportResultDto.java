package com.edefence.ecompta.dto.migration;

import java.util.List;

public record ImportResultDto(
    int nbImportes,
    int nbIgnores,
    int nbErreurs,
    List<LigneErreur> erreurs,
    String historiquId
) {
    public record LigneErreur(int ligne, String reference, String message) {}
}
