package com.edefence.ecompta.dto.etats;

public record EtatsDepuisBalanceDto(
        String  referentiel,
        int     nbLignes,
        BalanceDto         balance,
        BilanDto           bilan,
        CompteResultatDto  compteResultat
) {}
