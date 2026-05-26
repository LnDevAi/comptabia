package com.edefence.ecompta.dto.temps;

import com.edefence.ecompta.domain.Absence;
import com.edefence.ecompta.domain.Pointage;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public class TempsPresenceDto {

    public record PointageRequest(
            @NotNull UUID collaborateurId,
            @NotNull LocalDate datePointage,
            @NotNull LocalTime heureArrivee,
            LocalTime heureDepart,
            String notes
    ) {}

    public record PointagePatchRequest(
            LocalTime heureDepart,
            String notes
    ) {}

    public record PointageResponse(
            UUID id,
            UUID collaborateurId,
            String collaborateurNom,
            LocalDate datePointage,
            LocalTime heureArrivee,
            LocalTime heureDepart,
            BigDecimal heuresTravaillees,
            Pointage.Type type,
            String notes
    ) {}

    public record AbsenceRequest(
            @NotNull UUID collaborateurId,
            @NotNull LocalDate dateDebut,
            @NotNull LocalDate dateFin,
            @NotNull Absence.TypeAbsence typeAbsence,
            boolean justificatif,
            String notes
    ) {}

    public record AbsenceResponse(
            UUID id,
            UUID collaborateurId,
            String collaborateurNom,
            LocalDate dateDebut,
            LocalDate dateFin,
            Absence.TypeAbsence typeAbsence,
            boolean justificatif,
            String notes,
            Absence.Statut statut,
            String createdAt
    ) {}

    public record EtatCollaborateur(
            UUID collaborateurId,
            String collaborateurNom,
            int nbJoursTravailles,
            int nbRetards,
            long nbAbsences,
            BigDecimal totalHeures,
            List<PointageResponse> pointages,
            List<AbsenceResponse> absences
    ) {}

    public record EtatMensuel(
            int mois,
            int annee,
            List<EtatCollaborateur> collaborateurs
    ) {}
}
