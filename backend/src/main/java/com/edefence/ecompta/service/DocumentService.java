package com.edefence.ecompta.service;

import com.edefence.ecompta.domain.Entreprise;
import com.edefence.ecompta.domain.PieceJointe;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.document.DocumentDto;
import com.edefence.ecompta.repository.EntrepriseRepository;
import com.edefence.ecompta.repository.PieceJointeRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
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
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentService {

    private final PieceJointeRepository pjRepo;
    private final EntrepriseRepository  entrepriseRepo;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            log.warn("Could not create upload directory {}: {}", uploadDir, e.getMessage());
        }
    }

    // ─── List ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<DocumentDto.Item> list(UUID eid, PieceJointe.TypeEntite type, UUID entiteId) {
        return pjRepo.findByEntite(eid, type, entiteId).stream()
                .map(this::toItem)
                .toList();
    }

    // ─── Upload ───────────────────────────────────────────────────────────────

    @Transactional
    public DocumentDto.Item upload(UUID eid, PieceJointe.TypeEntite type,
                                   UUID entiteId, MultipartFile file, Utilisateur auteur) {
        if (file.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Fichier vide");

        String originalName = sanitize(file.getOriginalFilename());
        Path dir = Paths.get(uploadDir, eid.toString(), type.name(), entiteId.toString());
        try {
            Files.createDirectories(dir);
            Path target = resolveUnique(dir, originalName);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            Entreprise entreprise = entrepriseRepo.getReferenceById(eid);
            PieceJointe pj = PieceJointe.builder()
                    .entreprise(entreprise)
                    .typeEntite(type)
                    .entiteId(entiteId)
                    .nomFichier(target.getFileName().toString())
                    .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                    .taille(file.getSize())
                    .chemin(target.toAbsolutePath().toString())
                    .uploadedBy(auteur)
                    .build();
            return toItem(pjRepo.save(pj));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Erreur de stockage: " + e.getMessage());
        }
    }

    // ─── Download ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PieceJointe findOrThrow(UUID id, UUID eid) {
        return pjRepo.findByIdAndEntreprise(id, eid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Document introuvable"));
    }

    public Resource loadAsResource(PieceJointe pj) {
        try {
            Resource resource = new UrlResource(Paths.get(pj.getChemin()).toUri());
            if (!resource.exists() || !resource.isReadable())
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Fichier introuvable sur disque");
            return resource;
        } catch (MalformedURLException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    // ─── Delete ───────────────────────────────────────────────────────────────

    @Transactional
    public void delete(UUID id, UUID eid) {
        PieceJointe pj = findOrThrow(id, eid);
        try {
            Files.deleteIfExists(Paths.get(pj.getChemin()));
        } catch (IOException e) {
            log.warn("Could not delete file {}: {}", pj.getChemin(), e.getMessage());
        }
        pjRepo.delete(pj);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private Path resolveUnique(Path dir, String name) {
        Path candidate = dir.resolve(name);
        if (!Files.exists(candidate)) return candidate;
        String base = name.contains(".") ? name.substring(0, name.lastIndexOf('.')) : name;
        String ext  = name.contains(".") ? name.substring(name.lastIndexOf('.')) : "";
        int i = 1;
        do {
            candidate = dir.resolve(base + "_" + i + ext);
            i++;
        } while (Files.exists(candidate));
        return candidate;
    }

    private String sanitize(String name) {
        if (name == null || name.isBlank()) return "file";
        return name.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }

    private DocumentDto.Item toItem(PieceJointe pj) {
        String uploader = pj.getUploadedBy() != null ? pj.getUploadedBy().getNom() : null;
        return new DocumentDto.Item(
                pj.getId(), pj.getTypeEntite().name(), pj.getEntiteId(),
                pj.getNomFichier(), pj.getContentType(), pj.getTaille(),
                uploader, pj.getCreatedAt());
    }
}
