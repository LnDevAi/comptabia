package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.audit.AuditDto;
import com.edefence.comptabia.service.AuditService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService svc;

    @GetMapping
    public Page<AuditDto.Response> lister(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String userEmail,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return svc.lister(TenantContext.get(), action, entityType, userEmail, from, to,
                PageRequest.of(page, Math.min(size, 200)));
    }

    @GetMapping("/stats")
    public AuditDto.Stats stats() {
        return svc.stats(TenantContext.get());
    }
}
