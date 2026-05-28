package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.notesannexes.NotesAnnexesDto;
import com.edefence.comptabia.service.NotesAnnexesFiscalesService;
import com.edefence.comptabia.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notes-annexes-fiscales")
@RequiredArgsConstructor
public class NotesAnnexesFiscalesController {

    private final NotesAnnexesFiscalesService svc;

    @GetMapping("/{exercice}")
    public NotesAnnexesDto.Document generer(@PathVariable int exercice) {
        return svc.generer(TenantContext.get(), exercice);
    }
}
