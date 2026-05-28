package com.edefence.comptabia.dto.etats;

public record EtatsDepuisBalanceDto(
        String  referentiel,
        int     nbLignes,
        BalanceDto         balance,
        BilanDto           bilan,
        CompteResultatDto  compteResultat
) {}
