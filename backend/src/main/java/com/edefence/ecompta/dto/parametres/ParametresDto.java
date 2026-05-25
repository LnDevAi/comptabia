package com.edefence.ecompta.dto.parametres;

import java.math.BigDecimal;
import java.util.UUID;

public class ParametresDto {

    public record EntrepriseResponse(
            UUID id,
            String nom,
            String pays,
            String nif,
            String adresse,
            String telephone,
            String email,
            String siteWeb,
            String logoUrl,
            String devise,
            BigDecimal tauxTvaDefaut,
            int debutExerciceMois,
            String systemeComptable,
            String plan
    ) {}

    public record UpdateRequest(
            String nom,
            String pays,
            String nif,
            String adresse,
            String telephone,
            String email,
            String siteWeb,
            String logoUrl,
            String devise,
            BigDecimal tauxTvaDefaut,
            int debutExerciceMois
    ) {}
}
