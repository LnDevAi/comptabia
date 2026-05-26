package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.islamique.ProduitIslamiqueDto;
import com.edefence.ecompta.service.ProduitIslamiqueService;
import com.edefence.ecompta.tenant.TenantContext;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Tag(name = "Finance Islamique", description = "Produits halal (Mourabaha, Ijara, Moudaraba, Moucharaka, Sukuk), Zakat, Dashboard conformité Charia")
@RestController
@RequestMapping("/api/finance-islamique")
@RequiredArgsConstructor
public class ProduitIslamiqueController {

    private final ProduitIslamiqueService svc;

    private int currentYear() { return LocalDate.now().getYear(); }

    // ─── Produits islamiques ──────────────────────────────────────────────────

    @Operation(summary = "Lister les produits financiers islamiques")
    @GetMapping("/produits")
    public List<ProduitIslamiqueDto.Response> lister() {
        return svc.lister(TenantContext.get());
    }

    @Operation(summary = "Dashboard islamique — PAR, conformité Charia, Zakat")
    @GetMapping("/dashboard")
    public ProduitIslamiqueDto.DashboardResponse dashboard(@RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : currentYear();
        return svc.getDashboard(TenantContext.get(), annee);
    }

    @Operation(summary = "État de résultat islamique (PNI)")
    @GetMapping("/etat-resultat")
    public ProduitIslamiqueDto.EtatResultatIslamiqueResponse etatResultat(@RequestParam(defaultValue = "0") int exercice) {
        int annee = exercice > 0 ? exercice : currentYear();
        return svc.getEtatResultat(TenantContext.get(), annee);
    }

    @Operation(summary = "Créer un produit islamique")
    @PostMapping("/produits")
    @ResponseStatus(HttpStatus.CREATED)
    public ProduitIslamiqueDto.Response creer(@RequestBody ProduitIslamiqueDto.CreateRequest req) {
        return svc.creer(TenantContext.get(), req);
    }

    @Operation(summary = "Mettre à jour un produit islamique")
    @PatchMapping("/produits/{id}")
    public ProduitIslamiqueDto.Response mettrAJour(@PathVariable UUID id,
                                                    @RequestBody ProduitIslamiqueDto.UpdateRequest req) {
        return svc.mettrAJour(TenantContext.get(), id, req);
    }

    @Operation(summary = "Supprimer un produit islamique")
    @DeleteMapping("/produits/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void supprimer(@PathVariable UUID id) {
        svc.supprimer(TenantContext.get(), id);
    }

    // ─── Zakat ───────────────────────────────────────────────────────────────

    @Operation(summary = "Lister les calculs de Zakat")
    @GetMapping("/zakat")
    public List<ProduitIslamiqueDto.ZakatResponse> listerZakat() {
        return svc.listerZakat(TenantContext.get());
    }

    @Operation(summary = "Calculer la Zakat d'un exercice")
    @PostMapping("/zakat")
    @ResponseStatus(HttpStatus.CREATED)
    public ProduitIslamiqueDto.ZakatResponse calculerZakat(@RequestBody ProduitIslamiqueDto.ZakatCreateRequest req) {
        return svc.calculerZakat(TenantContext.get(), req);
    }

    @Operation(summary = "Enregistrer un versement de Zakat")
    @PatchMapping("/zakat/{id}")
    public ProduitIslamiqueDto.ZakatResponse mettreAJourZakat(@PathVariable UUID id,
                                                               @RequestBody ProduitIslamiqueDto.ZakatUpdateRequest req) {
        return svc.mettreAJourZakat(TenantContext.get(), id, req);
    }
}
