package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.notesannexes.NotesAnnexesDto;
import com.edefence.ecompta.service.NotesAnnexesFiscalesService;
import com.edefence.ecompta.tenant.TenantContext;
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
