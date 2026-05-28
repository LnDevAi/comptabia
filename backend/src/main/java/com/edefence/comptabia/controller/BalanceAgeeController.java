package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.balance.BalanceAgeeDto;
import com.edefence.comptabia.service.BalanceAgeeService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/balance-agee")
@RequiredArgsConstructor
public class BalanceAgeeController {

    private final BalanceAgeeService svc;

    @GetMapping
    public BalanceAgeeDto.Response calculer(
            @RequestParam(defaultValue = "CLIENT") String type) {
        return svc.calculer(TenantContext.get(), type);
    }

    @GetMapping("/export-csv")
    public ResponseEntity<byte[]> exportCsv(
            @RequestParam(defaultValue = "CLIENT") String type) {
        BalanceAgeeDto.Response data = svc.calculer(TenantContext.get(), type);
        StringBuilder sb = new StringBuilder();
        sb.append("Tiers;Code;Compte;0-30j;31-60j;61-90j;>90j;Total;Score risque;Niveau\n");
        for (BalanceAgeeDto.LigneTiers l : data.lignes()) {
            sb.append(csv(l.nom())).append(';')
              .append(csv(l.code())).append(';')
              .append(csv(l.compteNumero())).append(';')
              .append(l.buckets().j0()).append(';')
              .append(l.buckets().j30()).append(';')
              .append(l.buckets().j60()).append(';')
              .append(l.buckets().j90()).append(';')
              .append(l.buckets().total()).append(';')
              .append(l.scoreRisque()).append(';')
              .append(l.risqueNiveau()).append('\n');
        }
        byte[] bytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        String filename = "balance-agee-" + type.toLowerCase() + "-" + data.dateArrete() + ".csv";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
            .body(bytes);
    }

    private String csv(String s) {
        if (s == null) return "";
        return s.contains(";") || s.contains("\"") ? "\"" + s.replace("\"", "\"\"") + "\"" : s;
    }
}
