package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.PieceJointe;
import com.edefence.ecompta.domain.Utilisateur;
import com.edefence.ecompta.dto.document.DocumentDto;
import com.edefence.ecompta.service.DocumentService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService service;

    @GetMapping("/{typeEntite}/{entiteId}")
    public List<DocumentDto.Item> list(
            @PathVariable String typeEntite,
            @PathVariable UUID entiteId) {
        return service.list(TenantContext.get(), parseType(typeEntite), entiteId);
    }

    @PostMapping("/{typeEntite}/{entiteId}")
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentDto.Item upload(
            @PathVariable String typeEntite,
            @PathVariable UUID entiteId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal Utilisateur auteur) {
        return service.upload(TenantContext.get(), parseType(typeEntite), entiteId, file, auteur);
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        UUID eid = TenantContext.get();
        PieceJointe pj = service.findOrThrow(id, eid);
        Resource resource = service.loadAsResource(pj);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(pj.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(pj.getNomFichier())
                                .build().toString())
                .body(resource);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id, TenantContext.get());
    }

    private PieceJointe.TypeEntite parseType(String raw) {
        try {
            return PieceJointe.TypeEntite.valueOf(raw.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Type d'entité invalide: " + raw);
        }
    }
}
