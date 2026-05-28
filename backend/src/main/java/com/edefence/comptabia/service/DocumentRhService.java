package com.edefence.comptabia.service;

import com.edefence.comptabia.domain.DocumentRh;
import com.edefence.comptabia.domain.Entreprise;
import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.document.DocumentRhDto;
import com.edefence.comptabia.repository.DocumentRhRepository;
import com.edefence.comptabia.repository.EntrepriseRepository;
import com.edefence.comptabia.repository.UtilisateurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentRhService {

    private final DocumentRhRepository docRepo;
    private final EntrepriseRepository entrepriseRepo;
    private final UtilisateurRepository utilisateurRepo;

    @Transactional(readOnly = true)
    public List<DocumentRhDto.Response> findAll(UUID eid) {
        return docRepo.findAllByEntreprise(eid).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentRhDto.Response> findByCollaborateur(UUID uid, UUID eid) {
        return docRepo.findByCollaborateur(eid, uid).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DocumentRhDto.Response> findExpirantBientot(UUID eid, int joursAvant) {
        LocalDate seuil = LocalDate.now().plusDays(joursAvant);
        return docRepo.findExpirantAvant(eid, seuil).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public DocumentRhDto.Response create(UUID eid, DocumentRhDto.SaveRequest req) {
        Entreprise e = entrepriseRepo.findById(eid)
                .orElseThrow(() -> new EntityNotFoundException("Entreprise introuvable"));
        Utilisateur collab = null;
        if (req.collaborateurId() != null) {
            collab = utilisateurRepo.findById(req.collaborateurId())
                    .orElseThrow(() -> new EntityNotFoundException("Collaborateur introuvable"));
            if (!collab.getEntreprise().getId().equals(eid)) {
                throw new EntityNotFoundException("Collaborateur introuvable");
            }
        }
        DocumentRh doc = DocumentRh.builder()
                .entreprise(e)
                .collaborateur(collab)
                .typeDocument(req.typeDocument())
                .titre(req.titre())
                .description(req.description())
                .reference(req.reference())
                .dateDocument(req.dateDocument())
                .dateExpiration(req.dateExpiration())
                .build();
        return toResponse(docRepo.save(doc));
    }

    @Transactional
    public DocumentRhDto.Response update(UUID id, UUID eid, DocumentRhDto.SaveRequest req) {
        DocumentRh doc = load(id, eid);
        Utilisateur collab = null;
        if (req.collaborateurId() != null) {
            collab = utilisateurRepo.findById(req.collaborateurId())
                    .orElseThrow(() -> new EntityNotFoundException("Collaborateur introuvable"));
        }
        doc.setCollaborateur(collab);
        doc.setTypeDocument(req.typeDocument());
        doc.setTitre(req.titre());
        doc.setDescription(req.description());
        doc.setReference(req.reference());
        doc.setDateDocument(req.dateDocument());
        doc.setDateExpiration(req.dateExpiration());
        return toResponse(docRepo.save(doc));
    }

    @Transactional
    public DocumentRhDto.Response archiver(UUID id, UUID eid) {
        DocumentRh doc = load(id, eid);
        doc.setStatut(DocumentRh.Statut.ARCHIVE);
        return toResponse(docRepo.save(doc));
    }

    @Transactional
    public void delete(UUID id, UUID eid) {
        DocumentRh doc = load(id, eid);
        docRepo.delete(doc);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private DocumentRh load(UUID id, UUID eid) {
        return docRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new EntityNotFoundException("Document introuvable"));
    }

    private DocumentRhDto.Response toResponse(DocumentRh d) {
        long jours = 0;
        if (d.getDateExpiration() != null) {
            jours = ChronoUnit.DAYS.between(LocalDate.now(), d.getDateExpiration());
        }
        // Auto-marquer expiré
        if (d.getDateExpiration() != null && d.getDateExpiration().isBefore(LocalDate.now())
                && d.getStatut() == DocumentRh.Statut.VALIDE) {
            d.setStatut(DocumentRh.Statut.EXPIRE);
        }
        return new DocumentRhDto.Response(
                d.getId(),
                d.getCollaborateur() != null ? d.getCollaborateur().getId() : null,
                d.getCollaborateur() != null ? d.getCollaborateur().getNom() : null,
                d.getTypeDocument(),
                d.getTitre(),
                d.getDescription(),
                d.getReference(),
                d.getDateDocument(),
                d.getDateExpiration(),
                d.getStatut(),
                jours,
                d.getCreatedAt() != null ? d.getCreatedAt().toString() : null
        );
    }
}
