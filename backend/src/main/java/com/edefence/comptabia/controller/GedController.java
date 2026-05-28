package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.GedDocumentVersion;
import com.edefence.comptabia.dto.ged.GedDto;
import com.edefence.comptabia.service.GedService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ged")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class GedController {

    private final GedService service;

    // ─── Stats ────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public GedDto.Stats stats() {
        return service.stats(TenantContext.get());
    }

    @GetMapping("/stats-mensuel")
    public GedDto.StatsGedMensuel statsMensuel(@RequestParam(defaultValue = "0") int exercice) {
        return service.getStatsMensuel(TenantContext.get(), exercice);
    }

    // ─── Documents ────────────────────────────────────────────────────────────

    @GetMapping
    public Page<GedDto.DocumentSummary> list(
            @RequestParam(required = false) String statut,
            @RequestParam(required = false) UUID typeId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 100));
        return service.findAll(TenantContext.get(), statut, typeId, search, pageable);
    }

    @GetMapping("/{id}")
    public GedDto.DocumentDetail getById(@PathVariable UUID id) {
        return service.findById(id, TenantContext.get());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public GedDto.DocumentDetail create(
            @RequestPart("metadata") @Valid GedDto.DocumentRequest dto,
            @RequestPart(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal UserDetails user) {
        return service.create(TenantContext.get(), dto, file, user.getUsername());
    }

    @PutMapping("/{id}/meta")
    public GedDto.DocumentDetail updateMeta(
            @PathVariable UUID id,
            @RequestBody @Valid GedDto.DocumentRequest dto,
            @AuthenticationPrincipal UserDetails user) {
        return service.updateMeta(id, TenantContext.get(), dto, user.getUsername());
    }

    @PostMapping(value = "/{id}/versions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public GedDto.DocumentDetail addVersion(
            @PathVariable UUID id,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails user) {
        return service.addVersion(id, TenantContext.get(), file, user.getUsername());
    }

    @PatchMapping("/{id}/statut")
    public GedDto.DocumentDetail changeStatut(
            @PathVariable UUID id,
            @RequestBody @Valid GedDto.WorkflowRequest dto,
            @AuthenticationPrincipal UserDetails user) {
        return service.changeStatut(id, TenantContext.get(), dto, user.getUsername());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable UUID id,
                       @AuthenticationPrincipal UserDetails user) {
        service.delete(id, TenantContext.get(), user.getUsername());
    }

    // ─── Download ────────────────────────────────────────────────────────────

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable UUID id) {
        return buildDownloadResponse(id, null);
    }

    @GetMapping("/{id}/versions/{versionId}/download")
    public ResponseEntity<Resource> downloadVersion(@PathVariable UUID id,
                                                     @PathVariable UUID versionId) {
        return buildDownloadResponse(id, versionId);
    }

    private ResponseEntity<Resource> buildDownloadResponse(UUID docId, UUID versionId) {
        UUID eid = TenantContext.get();
        GedDocumentVersion version = service.getVersionForDownload(docId, eid, versionId);
        Resource resource = service.loadAsResource(version);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(version.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(version.getNomFichier()).build().toString())
                .body(resource);
    }

    // ─── Types ────────────────────────────────────────────────────────────────

    @GetMapping("/types")
    public List<GedDto.TypeDocumentResponse> listTypes() {
        return service.findTypes(TenantContext.get());
    }

    @PostMapping("/types")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public GedDto.TypeDocumentResponse createType(@RequestBody @Valid GedDto.TypeDocumentRequest dto) {
        return service.createType(TenantContext.get(), dto);
    }

    @PatchMapping("/types/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public GedDto.TypeDocumentResponse toggleType(@PathVariable UUID id) {
        return service.toggleType(id, TenantContext.get());
    }

    // ─── Tags ────────────────────────────────────────────────────────────────

    @GetMapping("/tags")
    public List<GedDto.TagResponse> listTags() {
        return service.findTags(TenantContext.get());
    }

    @PostMapping("/tags")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public GedDto.TagResponse createTag(@RequestBody @Valid GedDto.TagRequest dto) {
        return service.createTag(TenantContext.get(), dto);
    }

    @DeleteMapping("/tags/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteTag(@PathVariable UUID id) {
        service.deleteTag(id, TenantContext.get());
    }

    // ─── Audit ────────────────────────────────────────────────────────────────

    @GetMapping("/audit")
    @PreAuthorize("hasRole('ADMIN')")
    public Page<GedDto.AuditEntry> audit(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, Math.min(size, 200));
        return service.findAudit(TenantContext.get(), pageable);
    }
}
