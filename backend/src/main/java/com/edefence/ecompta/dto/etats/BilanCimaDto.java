package com.edefence.ecompta.dto.etats;

import java.math.BigDecimal;
import java.util.List;

public record BilanCimaDto(
        int exercice,
        // ACTIF
        List<Poste> actifIncorporelEtCorporel,
        List<Poste> placements,
        List<Poste> operationsAssuranceActif,
        List<Poste> autresActifs,
        List<Poste> tresorerie,
        BigDecimal totalActif,
        // PASSIF
        List<Poste> fondsPropres,
        List<Poste> provisionsTechniques,
        List<Poste> autresPassifs,
        BigDecimal totalPassif
) {
    public record Poste(
            String rubrique,
            String numero,
            String intitule,
            BigDecimal montant
    ) {}
}
