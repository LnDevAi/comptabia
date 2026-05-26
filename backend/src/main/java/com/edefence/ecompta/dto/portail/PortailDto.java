package com.edefence.ecompta.dto.portail;

import com.edefence.ecompta.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class PortailDto {

    public record ProfilResponse(
            UUID id,
            String nom,
            String email,
            Utilisateur.Role role,
            String nomEntreprise,
            String createdAt
    ) {}

    public record CongeResume(
            UUID id,
            Conge.Type type,
            LocalDate dateDebut,
            LocalDate dateFin,
            int nombreJours,
            Conge.Statut statut,
            String motif
    ) {}

    public record NoteFraisResume(
            UUID id,
            String titre,
            NoteFrais.Categorie categorie,
            BigDecimal montant,
            LocalDate dateDebut,
            LocalDate dateFin,
            NoteFrais.Statut statut
    ) {}

    public record PretResume(
            UUID id,
            Pret.TypePret typePret,
            BigDecimal montant,
            int nbEcheances,
            BigDecimal montantEcheance,
            LocalDate dateDebut,
            Pret.Statut statut,
            int nbPrelevees
    ) {}

    public record PointageResume(
            UUID id,
            LocalDate datePointage,
            String heureArrivee,
            String heureDepart,
            Double heuresTravaillees,
            Pointage.Type type
    ) {}

    public record Tableau(
            ProfilResponse profil,
            List<CongeResume>      conges,
            List<NoteFraisResume>  notesFrais,
            List<PretResume>       prets,
            List<PointageResume>   pointages
    ) {}
}
