package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.DossierDisciplinaire;
import com.edefence.comptabia.domain.EtapeProcedure;
import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.discipline.DisciplineDto;
import com.edefence.comptabia.dto.notification.NotificationDto;
import com.edefence.comptabia.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisciplineService {

    private final DossierDisciplinaireRepository dossierRepo;
    private final EtapeProcedureRepository        etapeRepo;
    private final EntrepriseRepository            entrepriseRepo;
    private final UtilisateurRepository           utilisateurRepo;
    private final NotificationService             notificationService;

    // ── Dossiers ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DisciplineDto.DossierResponse> findAll(UUID eid) {
        return dossierRepo.findAllByEntreprise(eid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DisciplineDto.DossierResponse> findEnCours(UUID eid) {
        return dossierRepo.findEnCours(eid).stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<DisciplineDto.DossierResponse> findByCollaborateur(UUID eid, UUID collabId) {
        return dossierRepo.findByCollaborateur(eid, collabId).stream().map(this::toResponse).toList();
    }

    @Transactional
    public DisciplineDto.DossierResponse create(UUID eid, UUID createdById, DisciplineDto.DossierSaveRequest req) {
        Utilisateur collab = utilisateurRepo.findById(req.collaborateurId())
                .orElseThrow(() -> new EntityNotFoundException("Collaborateur introuvable"));

        DossierDisciplinaire d = DossierDisciplinaire.builder()
                .entreprise(entrepriseRepo.getReferenceById(eid))
                .collaborateur(collab)
                .typeSanction(req.typeSanction())
                .motif(req.motif())
                .description(req.description())
                .dateFaits(req.dateFaits())
                .dateConvocation(req.dateConvocation())
                .dureeJours(req.dureeJours())
                .notes(req.notes())
                .createdBy(utilisateurRepo.getReferenceById(createdById))
                .build();
        d = dossierRepo.save(d);

        // Étape initiale automatique
        if (req.dateConvocation() != null) {
            etapeRepo.save(EtapeProcedure.builder()
                    .dossier(d)
                    .typeEtape(EtapeProcedure.TypeEtape.CONVOCATION)
                    .dateEtape(req.dateConvocation())
                    .description("Convocation à entretien préalable")
                    .build());
        }

        notificationService.broadcast(eid, new NotificationDto(
                "DISCIPLINE",
                "Nouveau dossier disciplinaire ouvert pour " + collab.getNom()
                        + " — " + labelSanction(req.typeSanction()),
                1, "WARNING", "/dashboard/discipline", Instant.now()));

        return toResponse(d);
    }

    @Transactional
    public DisciplineDto.DossierResponse update(UUID id, UUID eid, DisciplineDto.DossierUpdateRequest req) {
        DossierDisciplinaire d = findOrThrow(id, eid);
        if (req.typeSanction()    != null) d.setTypeSanction(req.typeSanction());
        if (req.motif()           != null) d.setMotif(req.motif());
        if (req.description()     != null) d.setDescription(req.description());
        if (req.dateFaits()       != null) d.setDateFaits(req.dateFaits());
        if (req.dateConvocation() != null) d.setDateConvocation(req.dateConvocation());
        if (req.dateEntretien()   != null) d.setDateEntretien(req.dateEntretien());
        if (req.dateNotification()!= null) d.setDateNotification(req.dateNotification());
        if (req.dureeJours()      != null) d.setDureeJours(req.dureeJours());
        if (req.statut()          != null) d.setStatut(req.statut());
        if (req.notes()           != null) d.setNotes(req.notes());
        return toResponse(dossierRepo.save(d));
    }

    @Transactional
    public DisciplineDto.DossierResponse cloture(UUID id, UUID eid) {
        DossierDisciplinaire d = findOrThrow(id, eid);
        d.setStatut(DossierDisciplinaire.Statut.CLOTURE);
        etapeRepo.save(EtapeProcedure.builder()
                .dossier(d)
                .typeEtape(EtapeProcedure.TypeEtape.CLOTURE)
                .dateEtape(java.time.LocalDate.now())
                .description("Dossier clôturé")
                .build());
        return toResponse(dossierRepo.save(d));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        dossierRepo.delete(findOrThrow(id, eid));
    }

    // ── Étapes ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DisciplineDto.EtapeResponse> findEtapes(UUID dossierId, UUID eid) {
        findOrThrow(dossierId, eid);
        return etapeRepo.findByDossier(dossierId).stream().map(this::toEtapeResponse).toList();
    }

    @Transactional
    public DisciplineDto.EtapeResponse addEtape(UUID dossierId, UUID eid, DisciplineDto.EtapeSaveRequest req) {
        DossierDisciplinaire d = findOrThrow(dossierId, eid);
        EtapeProcedure e = EtapeProcedure.builder()
                .dossier(d)
                .typeEtape(req.typeEtape())
                .dateEtape(req.dateEtape())
                .description(req.description())
                .build();

        // Met à jour les dates clés du dossier selon le type d'étape
        switch (req.typeEtape()) {
            case CONVOCATION -> d.setDateConvocation(req.dateEtape());
            case ENTRETIEN   -> d.setDateEntretien(req.dateEtape());
            case DECISION    -> d.setDateNotification(req.dateEtape());
            default          -> {}
        }
        dossierRepo.save(d);
        return toEtapeResponse(etapeRepo.save(e));
    }

    @Transactional
    public void deleteEtape(UUID etapeId) {
        etapeRepo.deleteById(etapeId);
    }

    // ── Historique par collaborateur ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DisciplineDto.HistoriqueCollaborateur> historique(UUID eid) {
        List<DossierDisciplinaire> all = dossierRepo.findAllByEntreprise(eid);
        Map<UUID, List<DossierDisciplinaire>> byCollab = all.stream()
                .collect(Collectors.groupingBy(d -> d.getCollaborateur().getId(), LinkedHashMap::new, Collectors.toList()));

        List<DisciplineDto.HistoriqueCollaborateur> result = new ArrayList<>();
        for (var entry : byCollab.entrySet()) {
            List<DossierDisciplinaire> dossiers = entry.getValue();
            String nom = dossiers.get(0).getCollaborateur().getNom();
            int enCours = (int) dossiers.stream().filter(d -> d.getStatut() == DossierDisciplinaire.Statut.EN_COURS).count();
            List<DisciplineDto.DossierResume> resumes = dossiers.stream()
                    .map(d -> new DisciplineDto.DossierResume(d.getId(), d.getTypeSanction(), d.getDateFaits(), d.getStatut()))
                    .toList();
            result.add(new DisciplineDto.HistoriqueCollaborateur(entry.getKey(), nom, dossiers.size(), enCours, resumes));
        }
        result.sort(Comparator.comparing(DisciplineDto.HistoriqueCollaborateur::collaborateurNom));
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private DossierDisciplinaire findOrThrow(UUID id, UUID eid) {
        return dossierRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Dossier disciplinaire introuvable"));
    }

    private DisciplineDto.DossierResponse toResponse(DossierDisciplinaire d) {
        List<DisciplineDto.EtapeResponse> etapes = etapeRepo.findByDossier(d.getId())
                .stream().map(this::toEtapeResponse).toList();
        return new DisciplineDto.DossierResponse(
                d.getId(), d.getCollaborateur().getId(), d.getCollaborateur().getNom(),
                d.getTypeSanction(), d.getMotif(), d.getDescription(),
                d.getDateFaits(), d.getDateConvocation(), d.getDateEntretien(),
                d.getDateNotification(), d.getDureeJours(), d.getStatut(),
                d.getNotes(), etapes, d.getCreatedAt());
    }

    private DisciplineDto.EtapeResponse toEtapeResponse(EtapeProcedure e) {
        return new DisciplineDto.EtapeResponse(e.getId(), e.getTypeEtape(),
                e.getDateEtape(), e.getDescription(), e.getCreatedAt());
    }

    private String labelSanction(DossierDisciplinaire.TypeSanction t) {
        return switch (t) {
            case AVERTISSEMENT -> "Avertissement";
            case BLAME         -> "Blâme";
            case MISE_A_PIED   -> "Mise à pied";
            case LICENCIEMENT  -> "Licenciement";
        };
    }
}
