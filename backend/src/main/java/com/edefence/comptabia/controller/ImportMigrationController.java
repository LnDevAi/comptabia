package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.migration.ImportHistoriqueDto;
import com.edefence.comptabia.dto.migration.ImportResultDto;
import com.edefence.comptabia.dto.migration.PreviewDto;
import com.edefence.comptabia.service.migration.MigrationService;
import com.edefence.comptabia.tenant.TenantContext;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/migration")
@RequiredArgsConstructor
public class ImportMigrationController {

    private final MigrationService svc;
    private final ObjectMapper     objectMapper;

    /** Aperçu du fichier avant import (colonnes + 20 premières lignes + mapping suggéré) */
    @PostMapping(value = "/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PreviewDto preview(
            @RequestPart("file")   MultipartFile file,
            @RequestParam("format") String format) throws IOException {
        return svc.preview(file.getBytes(), file.getOriginalFilename(), format);
    }

    /** Import effectif */
    @PostMapping(value = "/importer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImportResultDto importer(
            @RequestPart("file")          MultipartFile file,
            @RequestParam("format")       String format,
            @RequestParam("typeDonnees")  String typeDonnees,
            @RequestParam(value = "mapping", required = false) String mappingJson,
            @AuthenticationPrincipal UserDetails user) throws IOException {

        Map<String, String> mapping = null;
        if (mappingJson != null && !mappingJson.isBlank()) {
            mapping = objectMapper.readValue(mappingJson, new TypeReference<>() {});
        }
        return svc.importer(TenantContext.get(), user.getUsername(),
                file.getBytes(), file.getOriginalFilename(), format, typeDonnees, mapping);
    }

    /** Historique des imports de l'entreprise */
    @GetMapping("/historique")
    public List<ImportHistoriqueDto> historique() {
        return svc.getHistorique(TenantContext.get());
    }
}
