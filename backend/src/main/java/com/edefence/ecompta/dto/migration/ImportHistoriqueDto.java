package com.edefence.ecompta.dto.migration;

import com.edefence.ecompta.domain.ImportHistorique;

import java.time.Instant;
import java.util.UUID;

public record ImportHistoriqueDto(
    UUID id,
    String format,
    String typeDonnees,
    String statut,
    int nbImportes,
    int nbIgnores,
    int nbErreurs,
    String nomFichier,
    Instant createdAt,
    String utilisateurNom
) {
    public static ImportHistoriqueDto from(ImportHistorique h) {
        return new ImportHistoriqueDto(
            h.getId(),
            h.getFormat().name(),
            h.getTypeDonnees().name(),
            h.getStatut().name(),
            h.getNbImportes(),
            h.getNbIgnores(),
            h.getNbErreurs(),
            h.getNomFichier(),
            h.getCreatedAt(),
            h.getUtilisateur() != null ? h.getUtilisateur().getNom() : null
        );
    }
}
