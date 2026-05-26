package com.edefence.ecompta.controller;

import com.edefence.ecompta.domain.ArticleStock;
import com.edefence.ecompta.domain.MouvementStock;
import com.edefence.ecompta.dto.stock.StockDto;
import com.edefence.ecompta.service.StockService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stocks")
@RequiredArgsConstructor
public class StockController {

    private final StockService svc;

    // ─── Dashboard ────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public StockDto.DashboardStock getDashboard() {
        return svc.getDashboard(TenantContext.get());
    }

    // ─── Dépôts ───────────────────────────────────────────────────────────────

    @GetMapping("/depots")
    public List<StockDto.DepotResponse> listerDepots() {
        return svc.listerDepots(TenantContext.get());
    }

    @PostMapping("/depots")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public StockDto.DepotResponse creerDepot(@RequestBody StockDto.DepotRequest req) {
        return svc.creerDepot(TenantContext.get(), req);
    }

    @PutMapping("/depots/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public StockDto.DepotResponse mettreAJourDepot(@PathVariable UUID id,
                                                    @RequestBody StockDto.DepotRequest req) {
        return svc.mettreAJourDepot(id, TenantContext.get(), req);
    }

    // ─── Articles ─────────────────────────────────────────────────────────────

    @GetMapping("/articles")
    public Page<StockDto.ArticleResponse> listerArticles(
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) Boolean actif,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        ArticleStock.Categorie cat = categorie != null && !categorie.isBlank()
                ? ArticleStock.Categorie.valueOf(categorie) : null;
        return svc.findAll(TenantContext.get(), cat, actif, search, pageable);
    }

    @GetMapping("/articles/{id}/stats")
    public StockDto.StatsArticle statsArticle(@PathVariable UUID id) {
        return svc.statsArticle(id, TenantContext.get());
    }

    @PostMapping("/articles")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public StockDto.ArticleResponse creerArticle(@RequestBody StockDto.ArticleRequest req) {
        return svc.creerArticle(TenantContext.get(), req);
    }

    @PutMapping("/articles/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public StockDto.ArticleResponse mettreAJourArticle(@PathVariable UUID id,
                                                        @RequestBody StockDto.ArticleRequest req) {
        return svc.mettreAJourArticle(id, TenantContext.get(), req);
    }

    @DeleteMapping("/articles/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public void supprimerArticle(@PathVariable UUID id) {
        svc.supprimerArticle(id, TenantContext.get());
    }

    // ─── Mouvements ───────────────────────────────────────────────────────────

    @GetMapping("/mouvements")
    public Page<StockDto.MouvementResponse> listerMouvements(
            @RequestParam(required = false) UUID articleId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String debut,
            @RequestParam(required = false) String fin,
            Pageable pageable) {
        MouvementStock.TypeMouvement t = type != null && !type.isBlank()
                ? MouvementStock.TypeMouvement.valueOf(type) : null;
        LocalDate d = debut != null && !debut.isBlank() ? LocalDate.parse(debut) : null;
        LocalDate f = fin != null && !fin.isBlank() ? LocalDate.parse(fin) : null;
        return svc.findMouvements(TenantContext.get(), articleId, t, d, f, pageable);
    }

    @PostMapping("/mouvements")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public StockDto.MouvementResponse enregistrerMouvement(
            @RequestBody StockDto.MouvementRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return svc.enregistrerMouvement(TenantContext.get(), req, user.getUsername());
    }

    // ─── Inventaire ───────────────────────────────────────────────────────────

    @GetMapping("/inventaire")
    public List<StockDto.LigneInventaire> preparerInventaire() {
        return svc.preparerInventaire(TenantContext.get());
    }

    @PostMapping("/inventaire/ajuster")
    @PreAuthorize("hasAnyRole('ADMIN','COMPTABLE')")
    public List<StockDto.MouvementResponse> ajusterInventaire(
            @RequestBody StockDto.AjustementInventaireRequest req,
            @AuthenticationPrincipal UserDetails user) {
        return svc.ajusterInventaire(TenantContext.get(), req, user.getUsername());
    }
}
