package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.*;
import com.edefence.ecompta.dto.ged.GedDto;
import com.edefence.ecompta.repository.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class GedService {

    private final GedDocumentRepository        docRepo;
    private final GedDocumentVersionRepository versionRepo;
    private final GedTypeDocumentRepository    typeRepo;
    private final GedTagRepository             tagRepo;
    private final GedAuditLogRepository        auditRepo;
    private final EntrepriseRepository         entrepriseRepo;
    private final UtilisateurRepository        utilisateurRepo;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir, "ged"));
        } catch (IOException e) {
            log.warn("Could not create GED upload directory: {}", e.getMessage());
        }
    }

    // ─── Queries ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<GedDto.DocumentSummary> findAll(UUID eid, String statut, UUID typeId,
                                                 String search, Pageable pageable) {
        GedDocument.Statut s = parseStatut(statut);
        String q = (search != null && !search.isBlank()) ? search.trim() : null;
        return docRepo.search(eid, s, typeId, q, pageable)
                      .map(this::toSummary);
    }

    @Transactional(readOnly = true)
    public GedDto.DocumentDetail findById(UUID id, UUID eid) {
        GedDocument doc = findOrThrow(id, eid);
        audit(eid, id, "VIEW", null, null);
        return toDetail(doc);
    }

    @Transactional(readOnly = true)
    public GedDto.Stats stats(UUID eid) {
        long total    = docRepo.countByEntrepriseId(eid);
        long brou     = docRepo.countByEntrepriseIdAndStatut(eid, GedDocument.Statut.BROUILLON);
        long attente  = docRepo.countByEntrepriseIdAndStatut(eid, GedDocument.Statut.EN_ATTENTE);
        long approuve = docRepo.countByEntrepriseIdAndStatut(eid, GedDocument.Statut.APPROUVE);
        long archive  = docRepo.countByEntrepriseIdAndStatut(eid, GedDocument.Statut.ARCHIVE);
        long versions = versionRepo.countByEntrepriseId(eid);
        long tailleMo = versionRepo.sumTailleByEntrepriseId(eid) / (1024 * 1024);
        return new GedDto.Stats(total, brou, attente, approuve, archive, versions, tailleMo);
    }

    @Transactional(readOnly = true)
    public GedDto.StatsGedMensuel getStatsMensuel(UUID eid, int exercice) {
        if (exercice <= 0) exercice = OffsetDateTime.now().getYear();
        String[] moisFr = {"Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"};
        List<Object[]> raw = docRepo.creesParMois(eid, exercice);
        Map<Integer, Long> byMois = new HashMap<>();
        for (Object[] r : raw) byMois.put(((Number) r[0]).intValue(), ((Number) r[1]).longValue());
        List<GedDto.MoisGed> mensuel = new ArrayList<>();
        long total = 0;
        for (int m = 1; m <= 12; m++) {
            long nb = byMois.getOrDefault(m, 0L);
            mensuel.add(new GedDto.MoisGed(m, moisFr[m - 1], nb));
            total += nb;
        }
        return new GedDto.StatsGedMensuel(exercice, total, mensuel);
    }

    @Transactional(readOnly = true)
    public Page<GedDto.AuditEntry> findAudit(UUID eid, Pageable pageable) {
        return auditRepo.findByEntrepriseIdOrderByCreatedAtDesc(eid, pageable)
                        .map(a -> new GedDto.AuditEntry(a.getId(), a.getDocumentId(),
                                a.getAction(), a.getDetails(), a.getFaitParEmail(), a.getCreatedAt()));
    }

    @Transactional(readOnly = true)
    public List<GedDto.TypeDocumentResponse> findTypes(UUID eid) {
        return typeRepo.findByEntrepriseIdOrderByLibelleAsc(eid).stream()
                       .map(t -> new GedDto.TypeDocumentResponse(t.getId(), t.getCode(),
                               t.getLibelle(), t.getDescription(), t.isActif()))
                       .toList();
    }

    @Transactional(readOnly = true)
    public List<GedDto.TagResponse> findTags(UUID eid) {
        return tagRepo.findByEntrepriseIdOrderByLibelleAsc(eid).stream()
                      .map(t -> new GedDto.TagResponse(t.getId(), t.getLibelle(), t.getCouleur()))
                      .toList();
    }

    // ─── Mutations ────────────────────────────────────────────────────────────

    @Transactional
    public GedDto.DocumentDetail create(UUID eid, GedDto.DocumentRequest dto,
                                         MultipartFile file, String userEmail) {
        Entreprise entreprise = entrepriseRepo.getReferenceById(eid);
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail).orElse(null);

        GedTypeDocument type = null;
        if (dto.typeDocumentId() != null) {
            type = typeRepo.findByIdAndEntrepriseId(dto.typeDocumentId(), eid)
                           .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                   "Type de document introuvable"));
        }

        List<GedTag> tags = resolveTags(dto.tagIds(), eid);

        GedDocument doc = GedDocument.builder()
                .entreprise(entreprise)
                .typeDocument(type)
                .titre(dto.titre().trim())
                .description(dto.description())
                .typeEntite(dto.typeEntite())
                .entiteId(dto.entiteId())
                .referenceExterne(dto.referenceExterne())
                .dateDocument(dto.dateDocument())
                .statut(GedDocument.Statut.BROUILLON)
                .createdBy(auteur)
                .build();
        doc.getTags().addAll(tags);
        docRepo.save(doc);

        // Attach file version
        if (file != null && !file.isEmpty()) {
            addFileVersion(doc, file, auteur, eid, 1);
        }

        // Workflow history
        addWorkflowEntry(doc, null, GedDocument.Statut.BROUILLON, "Création du document", auteur);

        audit(eid, doc.getId(), "CREATE", "Nouveau document : " + doc.getTitre(), userEmail);
        log.info("GED create doc={} titre={}", doc.getId(), doc.getTitre());
        return toDetail(doc);
    }

    @Transactional
    public GedDto.DocumentDetail addVersion(UUID docId, UUID eid, MultipartFile file, String userEmail) {
        GedDocument doc = findOrThrow(docId, eid);
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail).orElse(null);

        int nextVer = versionRepo.findMaxVersionNumero(docId).orElse(0) + 1;
        addFileVersion(doc, file, auteur, eid, nextVer);

        audit(eid, docId, "NEW_VERSION", "Version " + nextVer, userEmail);
        return toDetail(doc);
    }

    @Transactional
    public GedDto.DocumentDetail updateMeta(UUID docId, UUID eid, GedDto.DocumentRequest dto, String userEmail) {
        GedDocument doc = findOrThrow(docId, eid);
        if (doc.getStatut() == GedDocument.Statut.ARCHIVE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Un document archivé ne peut plus être modifié.");
        }

        GedTypeDocument type = null;
        if (dto.typeDocumentId() != null) {
            type = typeRepo.findByIdAndEntrepriseId(dto.typeDocumentId(), eid)
                           .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                                   "Type de document introuvable"));
        }

        doc.setTitre(dto.titre().trim());
        doc.setDescription(dto.description());
        doc.setTypeDocument(type);
        doc.setTypeEntite(dto.typeEntite());
        doc.setEntiteId(dto.entiteId());
        doc.setReferenceExterne(dto.referenceExterne());
        doc.setDateDocument(dto.dateDocument());
        doc.getTags().clear();
        doc.getTags().addAll(resolveTags(dto.tagIds(), eid));

        audit(eid, docId, "UPDATE", "Métadonnées mises à jour", userEmail);
        return toDetail(docRepo.save(doc));
    }

    @Transactional
    public GedDto.DocumentDetail changeStatut(UUID docId, UUID eid, GedDto.WorkflowRequest dto, String userEmail) {
        GedDocument doc = findOrThrow(docId, eid);
        GedDocument.Statut newStatut;
        try {
            newStatut = GedDocument.Statut.valueOf(dto.statut().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Statut invalide : " + dto.statut());
        }

        validateTransition(doc.getStatut(), newStatut);
        Utilisateur auteur = utilisateurRepo.findByEmail(userEmail).orElse(null);
        addWorkflowEntry(doc, doc.getStatut(), newStatut, dto.commentaire(), auteur);
        doc.setStatut(newStatut);

        audit(eid, docId, "WORKFLOW",
                doc.getStatut().name() + " → " + newStatut.name(), userEmail);
        return toDetail(docRepo.save(doc));
    }

    @Transactional
    public void delete(UUID docId, UUID eid, String userEmail) {
        GedDocument doc = findOrThrow(docId, eid);
        doc.getVersions().forEach(v -> {
            try { Files.deleteIfExists(Paths.get(v.getChemin())); }
            catch (IOException ex) { log.warn("Could not delete file {}: {}", v.getChemin(), ex.getMessage()); }
        });
        audit(eid, docId, "DELETE", "Suppression de : " + doc.getTitre(), userEmail);
        docRepo.delete(doc);
    }

    @Transactional(readOnly = true)
    public GedDocumentVersion getVersionForDownload(UUID docId, UUID eid, UUID versionId) {
        GedDocument doc = findOrThrow(docId, eid);
        if (versionId != null) {
            return doc.getVersions().stream()
                      .filter(v -> v.getId().equals(versionId))
                      .findFirst()
                      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version introuvable"));
        }
        return doc.getVersions().stream().findFirst()
                  .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aucun fichier attaché"));
    }

    public Resource loadAsResource(GedDocumentVersion version) {
        try {
            Resource r = new UrlResource(Paths.get(version.getChemin()).toUri());
            if (!r.exists() || !r.isReadable())
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable sur disque");
            return r;
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ─── Types & Tags ─────────────────────────────────────────────────────────

    @Transactional
    public GedDto.TypeDocumentResponse createType(UUID eid, GedDto.TypeDocumentRequest dto) {
        if (typeRepo.existsByCodeAndEntrepriseId(dto.code().toUpperCase(), eid)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un type avec le code « " + dto.code() + " » existe déjà.");
        }
        Entreprise entreprise = entrepriseRepo.getReferenceById(eid);
        GedTypeDocument t = GedTypeDocument.builder()
                .entreprise(entreprise)
                .code(dto.code().toUpperCase().trim())
                .libelle(dto.libelle().trim())
                .description(dto.description())
                .build();
        GedTypeDocument saved = typeRepo.save(t);
        return new GedDto.TypeDocumentResponse(saved.getId(), saved.getCode(),
                saved.getLibelle(), saved.getDescription(), saved.isActif());
    }

    @Transactional
    public GedDto.TypeDocumentResponse toggleType(UUID id, UUID eid) {
        GedTypeDocument t = typeRepo.findByIdAndEntrepriseId(id, eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Type introuvable"));
        t.setActif(!t.isActif());
        typeRepo.save(t);
        return new GedDto.TypeDocumentResponse(t.getId(), t.getCode(),
                t.getLibelle(), t.getDescription(), t.isActif());
    }

    @Transactional
    public GedDto.TagResponse createTag(UUID eid, GedDto.TagRequest dto) {
        if (tagRepo.existsByLibelleIgnoreCaseAndEntrepriseId(dto.libelle(), eid)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Un tag « " + dto.libelle() + " » existe déjà.");
        }
        Entreprise entreprise = entrepriseRepo.getReferenceById(eid);
        GedTag tag = GedTag.builder()
                .entreprise(entreprise)
                .libelle(dto.libelle().trim())
                .couleur(dto.couleur() != null && !dto.couleur().isBlank() ? dto.couleur() : "#6B7280")
                .build();
        GedTag saved = tagRepo.save(tag);
        return new GedDto.TagResponse(saved.getId(), saved.getLibelle(), saved.getCouleur());
    }

    @Transactional
    public void deleteTag(UUID id, UUID eid) {
        GedTag tag = tagRepo.findByIdAndEntrepriseId(id, eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tag introuvable"));
        tagRepo.delete(tag);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private void addFileVersion(GedDocument doc, MultipartFile file,
                                 Utilisateur auteur, UUID eid, int versionNumero) {
        String originalName = sanitize(file.getOriginalFilename());
        Path dir = Paths.get(uploadDir, "ged", eid.toString(), doc.getId().toString());
        try {
            Files.createDirectories(dir);
            Path target = resolveUnique(dir, versionNumero + "_" + originalName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            GedDocumentVersion version = GedDocumentVersion.builder()
                    .document(doc)
                    .versionNumero(versionNumero)
                    .nomFichier(originalName)
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .taille(file.getSize())
                    .chemin(target.toAbsolutePath().toString())
                    .uploadedBy(auteur)
                    .build();
            doc.getVersions().add(0, version);
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Erreur de stockage : " + e.getMessage());
        }
    }

    private void addWorkflowEntry(GedDocument doc, GedDocument.Statut avant,
                                   GedDocument.Statut apres, String commentaire, Utilisateur auteur) {
        GedWorkflowHistory h = GedWorkflowHistory.builder()
                .document(doc)
                .statutAvant(avant != null ? avant.name() : null)
                .statutApres(apres.name())
                .commentaire(commentaire)
                .faitPar(auteur)
                .faitLe(OffsetDateTime.now())
                .build();
        doc.getWorkflowHistory().add(0, h);
    }

    private void validateTransition(GedDocument.Statut current, GedDocument.Statut next) {
        boolean ok = switch (next) {
            case BROUILLON   -> current == GedDocument.Statut.EN_ATTENTE;
            case EN_ATTENTE  -> current == GedDocument.Statut.BROUILLON;
            case APPROUVE    -> current == GedDocument.Statut.EN_ATTENTE;
            case ARCHIVE     -> current == GedDocument.Statut.APPROUVE;
        };
        if (!ok) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Transition de statut invalide : " + current + " → " + next);
    }

    private List<GedTag> resolveTags(List<UUID> tagIds, UUID eid) {
        if (tagIds == null || tagIds.isEmpty()) return new ArrayList<>();
        return tagIds.stream()
                     .map(tid -> tagRepo.findByIdAndEntrepriseId(tid, eid)
                                        .orElseThrow(() -> new ResponseStatusException(
                                                HttpStatus.BAD_REQUEST, "Tag introuvable : " + tid)))
                     .collect(Collectors.toList());
    }

    private void audit(UUID eid, UUID docId, String action, String details, String email) {
        try {
            auditRepo.save(GedAuditLog.builder()
                    .entrepriseId(eid)
                    .documentId(docId)
                    .action(action)
                    .details(details)
                    .faitParEmail(email)
                    .build());
        } catch (Exception e) {
            log.warn("Could not write GED audit log: {}", e.getMessage());
        }
    }

    private GedDocument findOrThrow(UUID id, UUID eid) {
        return docRepo.findByIdAndEntrepriseId(id, eid)
                      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                              "Document introuvable"));
    }

    private GedDocument.Statut parseStatut(String s) {
        if (s == null || s.isBlank()) return null;
        try { return GedDocument.Statut.valueOf(s.toUpperCase()); }
        catch (IllegalArgumentException e) { return null; }
    }

    private GedDto.DocumentSummary toSummary(GedDocument d) {
        long nbVersions = versionRepo.countByDocumentId(d.getId());
        long taille = d.getVersions().stream().findFirst().map(GedDocumentVersion::getTaille).orElse(0L);
        List<String> tags = d.getTags().stream().map(GedTag::getLibelle).toList();
        String createdBy = d.getCreatedBy() != null ? d.getCreatedBy().getNom() : null;
        String typeLib = d.getTypeDocument() != null ? d.getTypeDocument().getLibelle() : null;
        return new GedDto.DocumentSummary(d.getId(), d.getTitre(), d.getStatut().name(),
                typeLib, d.getReferenceExterne(), d.getDateDocument(), d.getTypeEntite(),
                d.getCreatedAt(), createdBy, nbVersions, taille, tags);
    }

    private GedDto.DocumentDetail toDetail(GedDocument d) {
        List<GedDto.VersionInfo> versions = d.getVersions().stream()
                .map(v -> new GedDto.VersionInfo(v.getId(), v.getVersionNumero(), v.getNomFichier(),
                        v.getContentType(), v.getTaille(), v.getCreatedAt(),
                        v.getUploadedBy() != null ? v.getUploadedBy().getNom() : null))
                .toList();
        List<String> tags = d.getTags().stream().map(GedTag::getLibelle).toList();
        List<GedDto.WorkflowEntry> wf = d.getWorkflowHistory().stream()
                .map(h -> new GedDto.WorkflowEntry(h.getStatutAvant(), h.getStatutApres(),
                        h.getCommentaire(), h.getFaitLe(),
                        h.getFaitPar() != null ? h.getFaitPar().getNom() : null))
                .toList();
        String createdBy = d.getCreatedBy() != null ? d.getCreatedBy().getNom() : null;
        String typeLib = d.getTypeDocument() != null ? d.getTypeDocument().getLibelle() : null;
        UUID typeId = d.getTypeDocument() != null ? d.getTypeDocument().getId() : null;
        return new GedDto.DocumentDetail(d.getId(), d.getTitre(), d.getDescription(),
                d.getStatut().name(), typeLib, typeId, d.getReferenceExterne(), d.getDateDocument(),
                d.getTypeEntite(), d.getEntiteId(), d.getCreatedAt(), d.getUpdatedAt(),
                createdBy, versions, tags, wf);
    }

    private Path resolveUnique(Path dir, String name) {
        Path candidate = dir.resolve(name);
        if (!Files.exists(candidate)) return candidate;
        String base = name.contains(".") ? name.substring(0, name.lastIndexOf('.')) : name;
        String ext  = name.contains(".") ? name.substring(name.lastIndexOf('.')) : "";
        int i = 1;
        do { candidate = dir.resolve(base + "_" + i++ + ext); }
        while (Files.exists(candidate));
        return candidate;
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) return "file";
        return name.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }
}
