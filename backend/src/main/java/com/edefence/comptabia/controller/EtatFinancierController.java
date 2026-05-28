package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.etats.*;
import com.edefence.comptabia.dto.etats.BilanCimaDto;
import com.edefence.comptabia.dto.etats.CompteResultatCimaDto;
import com.edefence.comptabia.service.EtatFinancierService;
import com.edefence.comptabia.tenant.TenantContext;
import io.swagger.v3.oas.annotations.tags.Tag;
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

@Tag(name = "États financiers", description = "Balance, Bilan, Compte de résultat, Grand livre, Journal, TFT, EVCAP, Notes annexes, SMT, Import balance")
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

    // ─── États financiers CIMA ───────────────────────────────────────────────

    @GetMapping("/cima/bilan")
    public BilanCimaDto bilanCima(@RequestParam(defaultValue = "0") int exercice) {
        return service.getBilanCima(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @GetMapping("/cima/resultat-technique")
    public CompteResultatCimaDto compteResultatCima(@RequestParam(defaultValue = "0") int exercice) {
        return service.getCompteResultatCima(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    // ─── États financiers SFD (BCEAO/UMOA) ──────────────────────────────────

    @GetMapping("/sfd/resultat")
    public com.edefence.comptabia.dto.etats.EtatResultatSfdDto etatResultatSfd(
            @RequestParam(defaultValue = "0") int exercice) {
        return service.getEtatResultatSfd(TenantContext.get(), exercice > 0 ? exercice : currentYear());
    }

    @PostMapping(value = "/import-balance-6col", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public com.edefence.comptabia.dto.etats.BalanceSixColonnesDto importBalance6Col(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "0") int exercice) throws IOException {
        int annee = exercice > 0 ? exercice : currentYear();
        return service.genererDepuisBalance6Col(TenantContext.get(), file, annee);
    }
}
