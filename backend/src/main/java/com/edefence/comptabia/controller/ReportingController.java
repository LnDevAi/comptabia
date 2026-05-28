package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.reporting.ReportingDto;
import com.edefence.comptabia.service.ReportingService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reporting")
@RequiredArgsConstructor
public class ReportingController {

    private final ReportingService svc;

    @GetMapping("/synthese")
    public ReportingDto.SyntheseRh synthese() {
        return svc.syntheseRh(TenantContext.get());
    }

    @GetMapping("/conges")
    public ReportingDto.RapportConges conges(
            @RequestParam(defaultValue = "0") int annee) {
        int a = annee > 0 ? annee : LocalDate.now().getYear();
        return svc.rapportConges(TenantContext.get(), a);
    }

    @GetMapping("/presences")
    public ReportingDto.RapportPresences presences(
            @RequestParam(defaultValue = "0") int mois,
            @RequestParam(defaultValue = "0") int annee) {
        LocalDate now = LocalDate.now();
        int m = mois  > 0 ? mois  : now.getMonthValue();
        int a = annee > 0 ? annee : now.getYear();
        return svc.rapportPresences(TenantContext.get(), m, a);
    }

    @GetMapping("/notes-frais")
    public ReportingDto.RapportNotesFrais notesFrais(
            @RequestParam(defaultValue = "0") int annee) {
        int a = annee > 0 ? annee : LocalDate.now().getYear();
        return svc.rapportNotesFrais(TenantContext.get(), a);
    }

    @GetMapping("/prets")
    public ReportingDto.RapportPrets prets() {
        return svc.rapportPrets(TenantContext.get());
    }
}
