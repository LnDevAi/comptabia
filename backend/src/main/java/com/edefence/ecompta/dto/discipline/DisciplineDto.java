package com.edefence.ecompta.dto.discipline;

import com.edefence.ecompta.domain.DossierDisciplinaire;
import com.edefence.ecompta.domain.EtapeProcedure;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class DisciplineDto {

    public record DossierResponse(
            UUID id,
            UUID collaborateurId,
            String collaborateurNom,
            DossierDisciplinaire.TypeSanction typeSanction,
            String motif,
            String description,
            LocalDate dateFaits,
            LocalDate dateConvocation,
            LocalDate dateEntretien,
            LocalDate dateNotification,
            Integer dureeJours,
            DossierDisciplinaire.Statut statut,
            String notes,
            List<EtapeResponse> etapes,
            OffsetDateTime createdAt
    ) {}

    public record EtapeResponse(
            UUID id,
            EtapeProcedure.TypeEtape typeEtape,
            LocalDate dateEtape,
            String description,
            OffsetDateTime createdAt
    ) {}

    public record DossierSaveRequest(
            @NotNull UUID collaborateurId,
            @NotNull DossierDisciplinaire.TypeSanction typeSanction,
            @NotBlank String motif,
            String description,
            @NotNull LocalDate dateFaits,
            LocalDate dateConvocation,
            Integer dureeJours,
            String notes
    ) {}

    public record DossierUpdateRequest(
            DossierDisciplinaire.TypeSanction typeSanction,
            String motif,
            String description,
            LocalDate dateFaits,
            LocalDate dateConvocation,
            LocalDate dateEntretien,
            LocalDate dateNotification,
            Integer dureeJours,
            DossierDisciplinaire.Statut statut,
            String notes
    ) {}

    public record EtapeSaveRequest(
            @NotNull EtapeProcedure.TypeEtape typeEtape,
            @NotNull LocalDate dateEtape,
            String description
    ) {}

    public record HistoriqueCollaborateur(
            UUID collaborateurId,
            String collaborateurNom,
            int nbDossiers,
            int nbEnCours,
            List<DossierResume> dossiers
    ) {}

    public record DossierResume(
            UUID id,
            DossierDisciplinaire.TypeSanction typeSanction,
            LocalDate dateFaits,
            DossierDisciplinaire.Statut statut
    ) {}
}
