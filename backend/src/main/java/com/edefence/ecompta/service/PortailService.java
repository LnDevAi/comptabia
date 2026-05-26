package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.portail.PortailDto;
import com.edefence.ecompta.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortailService {

    private final CongeRepository      congeRepo;
    private final NoteFraisRepository  noteFraisRepo;
    private final PretRepository       pretRepo;
    private final PointageRepository   pointageRepo;

    @Transactional(readOnly = true)
    public PortailDto.Tableau getTableau(Utilisateur user) {
        UUID uid = user.getId();
        UUID eid = user.getEntreprise().getId();

        PortailDto.ProfilResponse profil = new PortailDto.ProfilResponse(
                uid, user.getNom(), user.getEmail(), user.getRole(),
                user.getEntreprise().getNom(),
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null
        );

        List<PortailDto.CongeResume> conges = congeRepo.findByCollaborateur(eid, uid).stream()
                .map(c -> new PortailDto.CongeResume(
                        c.getId(), c.getType(), c.getDateDebut(), c.getDateFin(),
                        c.getNombreJours(), c.getStatut(), c.getMotif()))
                .collect(Collectors.toList());

        List<PortailDto.NoteFraisResume> notes = noteFraisRepo.findByCollaborateur(eid, uid).stream()
                .map(n -> new PortailDto.NoteFraisResume(
                        n.getId(), n.getTitre(), n.getCategorie(), n.getMontant(),
                        n.getDateDebut(), n.getDateFin(), n.getStatut()))
                .collect(Collectors.toList());

        List<PortailDto.PretResume> prets = pretRepo.findByCollaborateur(uid, eid).stream()
                .map(p -> {
                    int nbPrel = (int) p.getEcheances().stream()
                            .filter(e -> e.getStatut() == EcheancePret.Statut.PRELEVE).count();
                    return new PortailDto.PretResume(
                            p.getId(), p.getTypePret(), p.getMontant(), p.getNbEcheances(),
                            p.getMontantEcheance(), p.getDateDebut(), p.getStatut(), nbPrel);
                })
                .collect(Collectors.toList());

        LocalDate fin   = LocalDate.now();
        LocalDate debut = fin.minusMonths(3).withDayOfMonth(1);
        List<PortailDto.PointageResume> pointages = pointageRepo
                .findByCollaborateurAndPeriode(eid, uid, debut, fin).stream()
                .map(p -> new PortailDto.PointageResume(
                        p.getId(), p.getDatePointage(),
                        p.getHeureArrivee() != null ? p.getHeureArrivee().toString() : null,
                        p.getHeureDepart()  != null ? p.getHeureDepart().toString()  : null,
                        p.getHeuresTravaillees() != null ? p.getHeuresTravaillees().doubleValue() : null,
                        p.getType()))
                .collect(Collectors.toList());

        return new PortailDto.Tableau(profil, conges, notes, prets, pointages);
    }
}
