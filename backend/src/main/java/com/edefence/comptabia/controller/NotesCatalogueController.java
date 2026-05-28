package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.etats.NoteCatalogueDto;
import com.edefence.comptabia.service.NotesCatalogueService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/etats/notes-catalogue")
@RequiredArgsConstructor
public class NotesCatalogueController {

    private final NotesCatalogueService svc;

    private int currentYear() { return LocalDate.now().getYear(); }

    @GetMapping
    public List<NoteCatalogueDto.Definition> getCatalogue() {
        return svc.getCatalogue();
    }

    @GetMapping("/{numero}/data")
    public NoteCatalogueDto.NoteCalculee getNoteData(
            @PathVariable int numero,
            @RequestParam(defaultValue = "0") int exercice) {
        int year = exercice > 0 ? exercice : currentYear();
        return svc.computeNote(TenantContext.get(), year, numero);
    }
}
