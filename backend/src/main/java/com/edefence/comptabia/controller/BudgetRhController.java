package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.budget.BudgetRhDto;
import com.edefence.comptabia.service.BudgetRhService;
import com.edefence.comptabia.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/budget-rh")
@RequiredArgsConstructor
public class BudgetRhController {

    private final BudgetRhService service;

    private int currentYear() { return LocalDate.now().getYear(); }

    @GetMapping("/exercices")
    public List<Integer> exercices() {
        return service.exercices(TenantContext.get());
    }

    @GetMapping("/comparatif")
    public BudgetRhDto.ComparatifRh comparatif(@RequestParam(defaultValue = "0") int exercice) {
        return service.getComparatif(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @PostMapping("/upsert")
    public BudgetRhDto.LigneBudget upsert(
            @RequestParam(defaultValue = "0") int exercice,
            @Valid @RequestBody BudgetRhDto.UpsertRequest req) {
        return service.upsert(TenantContext.get(), exercice > 0 ? exercice : currentYear(), req);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        service.delete(id, TenantContext.get());
    }
}
