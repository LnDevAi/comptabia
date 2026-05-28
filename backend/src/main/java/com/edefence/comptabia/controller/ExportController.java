package com.edefence.comptabia.controller;

import com.edefence.comptabia.service.ExportService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService service;

    @GetMapping("/balance")
    public ResponseEntity<byte[]> balance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        String csv = service.exportBalanceCsv(TenantContext.get(), debut, fin);
        return csvResponse(csv, "balance_" + debut + "_" + fin + ".csv");
    }

    @GetMapping("/grand-livre")
    public ResponseEntity<byte[]> grandLivre(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin,
            @RequestParam String compte) {
        String csv = service.exportGrandLivreCsv(TenantContext.get(), debut, fin, compte);
        return csvResponse(csv, "grand_livre_" + compte + "_" + debut + "_" + fin + ".csv");
    }

    @GetMapping("/ecritures")
    public ResponseEntity<byte[]> ecritures(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        String csv = service.exportEcrituresCsv(TenantContext.get(), debut, fin);
        return csvResponse(csv, "ecritures_" + debut + "_" + fin + ".csv");
    }

    @GetMapping("/fec")
    public ResponseEntity<byte[]> fec(@RequestParam int exercice) {
        String fec = service.exportFec(TenantContext.get(), exercice);
        return tsvResponse(fec, "FEC_" + exercice + ".txt");
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private ResponseEntity<byte[]> csvResponse(String content, String filename) {
        // BOM UTF-8 pour compatibilité Excel
        byte[] bom  = new byte[]{(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};
        byte[] body = content.getBytes(StandardCharsets.UTF_8);
        byte[] full = new byte[bom.length + body.length];
        System.arraycopy(bom, 0, full, 0, bom.length);
        System.arraycopy(body, 0, full, bom.length, body.length);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(full);
    }

    private ResponseEntity<byte[]> tsvResponse(String content, String filename) {
        byte[] body = content.getBytes(StandardCharsets.UTF_8);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("text/plain; charset=UTF-8"))
                .body(body);
    }
}
