package com.edefence.ecompta.dto.liasse;

import com.edefence.ecompta.dto.etats.*;

import java.time.LocalDate;
import java.util.List;

public final class LiasseFiscaleDto {

    private LiasseFiscaleDto() {}

    public record Entete(
            String nomEntreprise,
            String rccm,
            String nif,
            String ifu,
            String adresse,
            String pays,
            String referentiel,
            int exercice,
            LocalDate dateGeneration
    ) {}

    public record Response(
            Entete entete,
            BilanDto bilan,
            CompteResultatDto compteResultat,
            FluxTresorerieDto.Response tft,
            EvcapDto.Response evcap,
            List<NoteAnnexeDto.Response> notes
    ) {}
}
