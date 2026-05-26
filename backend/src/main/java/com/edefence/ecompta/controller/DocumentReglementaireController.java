package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.DocumentReglementaire;
import com.edefence.ecompta.dto.document.DocumentReglementaireDto;
import com.edefence.ecompta.service.DocumentReglementaireService;
import com.edefence.ecompta.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.PathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@Tag(name = "Documents réglementaires", description = "Gestion des documents légaux et réglementaires (associations, ONG)")
@RestController
@RequestMapping("/api/documents-reglementaires")
@RequiredArgsConstructor
public class DocumentReglementaireController {

    private final DocumentReglementaireService service;

    @Operation(summary = "Lister les documents réglementaires")
    @GetMapping
    public List<DocumentReglementaireDto.Response> lister() {
        return service.lister(TenantContext.get());
    }

    @Operation(summary = "Échéances dans les 30 prochains jours")
    @GetMapping("/echeances")
    public List<DocumentReglementaireDto.Response> echeancesProches() {
        return service.echeancesProches(TenantContext.get());
    }

    @Operation(summary = "Créer un document réglementaire")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentReglementaireDto.Response creer(@RequestBody DocumentReglementaireDto.CreateRequest req) {
        return service.creer(TenantContext.get(), req);
    }

    @Operation(summary = "Mettre à jour un document")
    @PatchMapping("/{id}")
    public DocumentReglementaireDto.Response mettrAJour(@PathVariable UUID id,
                                                         @RequestBody DocumentReglementaireDto.UpdateRequest req) {
        return service.mettrAJour(TenantContext.get(), id, req);
    }

    @Operation(summary = "Uploader le fichier d'un document")
    @PostMapping(value = "/{id}/fichier", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public DocumentReglementaireDto.Response uploadFichier(@PathVariable UUID id,
                                                            @RequestParam("fichier") MultipartFile fichier)
            throws IOException {
        return service.uploadFichier(TenantContext.get(), id, fichier);
    }

    @Operation(summary = "Télécharger le fichier d'un document")
    @GetMapping("/{id}/fichier")
    public ResponseEntity<Resource> downloadFichier(@PathVariable UUID id) {
        UUID eid = TenantContext.get();
        DocumentReglementaire doc = service.getDocEntity(eid, id);
        Path path = service.getFichierPath(eid, id);
        Resource resource = new PathResource(path);

        String contentType = doc.getTypeMime() != null ? doc.getTypeMime() : "application/octet-stream";
        String filename    = doc.getNomFichierOriginal() != null ? doc.getNomFichierOriginal() : "document";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .body(resource);
    }

    @Operation(summary = "Supprimer un document (et son fichier)")
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable UUID id) {
        service.supprimer(TenantContext.get(), id);
    }
}
