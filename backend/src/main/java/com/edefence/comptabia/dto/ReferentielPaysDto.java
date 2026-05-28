package com.edefence.comptabia.dto;

import com.edefence.comptabia.domain.ReferentielFiscalPays;

import java.math.BigDecimal;
import java.util.List;

public class ReferentielPaysDto {

    public record PaysResume(String code, String nom, String devise, String systemeComptable) {}

    public record PaysDetail(
            String code,
            String nom,
            String devise,
            String locale,
            String systemeComptable,
            BigDecimal tauxTva,
            BigDecimal tauxIs,
            String nomTva,
            String nomIs,
            BigDecimal minimumForfaitaire,
            String periodeDeclarationTva
    ) {
        public static PaysDetail from(ReferentielFiscalPays r) {
            return new PaysDetail(r.getCode(), r.getNom(), r.getDevise(), r.getLocale(),
                    r.getSystemeComptable(), r.getTauxTva(), r.getTauxIs(),
                    r.getNomTva(), r.getNomIs(), r.getMinimumForfaitaire(),
                    r.getPeriodeDeclarationTva());
        }
    }
}
