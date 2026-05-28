package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.ReferentielPaysDto;
import com.edefence.comptabia.repository.ReferentielFiscalPaysRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/referentiel/pays")
@RequiredArgsConstructor
public class ReferentielPaysController {

    private final ReferentielFiscalPaysRepository repo;

    @GetMapping
    public List<ReferentielPaysDto.PaysResume> listAll() {
        return repo.findAll().stream()
                .sorted(Comparator.comparing(p -> p.getNom()))
                .map(p -> new ReferentielPaysDto.PaysResume(
                        p.getCode(), p.getNom(), p.getDevise(), p.getSystemeComptable()))
                .toList();
    }

    @GetMapping("/{code}")
    public ReferentielPaysDto.PaysDetail getOne(@PathVariable String code) {
        return repo.findByCode(code.toUpperCase())
                .map(ReferentielPaysDto.PaysDetail::from)
                .orElseThrow(() -> new EntityNotFoundException("Pays introuvable : " + code));
    }
}
