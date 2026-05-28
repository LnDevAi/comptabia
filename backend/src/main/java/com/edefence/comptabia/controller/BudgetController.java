package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.budget.BudgetDto;
import com.edefence.comptabia.service.BudgetService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@io.swagger.v3.oas.annotations.tags.Tag(name = "Budget", description = "Budgets prévisionnels par compte et exercice, suivi des écarts")
@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService service;

    @GetMapping("/exercices")
    public List<Integer> exercices() {
        return service.exercicesWithBudget(TenantContext.get());
    }

    @GetMapping
    public BudgetDto.Comparatif comparatif(
            @RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : LocalDate.now().getYear();
        return service.getComparatif(TenantContext.get(), annee);
    }

    @GetMapping("/export-csv")
    public ResponseEntity<String> exportCsv(
            @RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : LocalDate.now().getYear();
        String csv = service.exportCsv(TenantContext.get(), annee);
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv;charset=UTF-8")
                .header("Content-Disposition",
                        "attachment; filename=\"budget-" + annee + ".csv\"")
                .body(csv);
    }

    @PostMapping("/{exercice}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public BudgetDto.LigneComparatif upsert(@PathVariable int exercice,
                                             @Valid @RequestBody BudgetDto.UpsertRequest dto) {
        return service.upsert(TenantContext.get(), exercice, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasRole('ADMIN') or hasRole('COMPTABLE')")
    public void delete(@PathVariable UUID id) {
        service.delete(id, TenantContext.get());
    }
}
