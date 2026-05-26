package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.etats.*;
import com.edefence.ecompta.service.EtatFinancierService;
import com.edefence.ecompta.tenant.TenantContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/etats")
@RequiredArgsConstructor
public class EtatFinancierController {

    private final EtatFinancierService service;

    private int currentYear() { return LocalDate.now().getYear(); }

    // ─── Système Normal ──────────────────────────────────────────────────────

    @GetMapping("/balance")
    public BalanceDto balance(@RequestParam(defaultValue = "0") int exercice) {
        return service.getBalance(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @GetMapping("/bilan")
    public BilanDto bilan(@RequestParam(defaultValue = "0") int exercice) {
        return service.getBilan(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @GetMapping("/compte-resultat")
    public CompteResultatDto compteResultat(@RequestParam(defaultValue = "0") int exercice) {
        return service.getCompteResultat(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @GetMapping("/grand-livre")
    public GrandLivreDto grandLivre(@RequestParam(defaultValue = "0") int exercice,
                                    @RequestParam String compte) {
        return service.getGrandLivre(TenantContext.get(), exercice > 0 ? exercice : currentYear(), compte);
    }

    @GetMapping("/journal")
    public JournalLivreDto journal(@RequestParam(defaultValue = "0") int exercice) {
        return service.getJournal(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @GetMapping("/flux-tresorerie")
    public FluxTresorerieDto.Response fluxTresorerie(@RequestParam(defaultValue = "0") int exercice) {
        return service.getFluxTresorerie(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @GetMapping("/evcap")
    public EvcapDto.Response evcap(@RequestParam(defaultValue = "0") int exercice) {
        return service.getEvcap(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    // ─── Système Minimal de Trésorerie ───────────────────────────────────────

    @GetMapping("/smt/esp")
    public SmtDto.EtatSituationPatrimoine esp(@RequestParam(defaultValue = "0") int exercice) {
        return service.getEsp(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @GetMapping("/smt/recettes-depenses")
    public SmtDto.EtatRecettesDepenses recettesDepenses(@RequestParam(defaultValue = "0") int exercice) {
        return service.getEtatRecettesDepenses(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @GetMapping("/smt/tresorerie")
    public SmtDto.EtatTresorerie tresorerie(@RequestParam(defaultValue = "0") int exercice) {
        return service.getEtatTresorerie(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    // ─── Notes annexes ───────────────────────────────────────────────────────

    @GetMapping("/notes")
    public List<NoteAnnexeDto.Response> getNotes(@RequestParam(defaultValue = "0") int exercice) {
        return service.getNotes(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @PostMapping("/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public NoteAnnexeDto.Response createNote(@Valid @RequestBody NoteAnnexeDto.CreateRequest req) {
        return service.createNote(TenantContext.get(), req);
    }

    @PutMapping("/notes/{id}")
    public NoteAnnexeDto.Response updateNote(@PathVariable UUID id,
                                              @RequestBody NoteAnnexeDto.UpdateRequest req) {
        return service.updateNote(TenantContext.get(), id, req);
    }

    @DeleteMapping("/notes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(@PathVariable UUID id) {
        service.deleteNote(TenantContext.get(), id);
    }

    // ─── Import balance externe ───────────────────────────────────────────────

    @PostMapping(value = "/import-balance", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public EtatsDepuisBalanceDto importBalance(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "0") int exercice) throws IOException {
        int annee = exercice > 0 ? exercice : currentYear();
        return service.genererDepuisBalance(TenantContext.get(), file, annee);
    }

    @PostMapping(value = "/import-balance-6col", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public com.edefence.ecompta.dto.etats.BalanceSixColonnesDto importBalance6Col(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "0") int exercice) throws IOException {
        int annee = exercice > 0 ? exercice : currentYear();
        return service.genererDepuisBalance6Col(TenantContext.get(), file, annee);
    }
}
