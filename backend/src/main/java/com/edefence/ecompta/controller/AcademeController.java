package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.academie.AcademeDto;
import com.edefence.ecompta.service.AcademeService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/academie")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AcademeController {

    private final AcademeService service;

    @GetMapping("/stats")
    public AcademeDto.DashboardStats stats(@AuthenticationPrincipal UserDetails user) {
        return service.stats(TenantContext.get(), user.getUsername());
    }

    @GetMapping("/cours")
    public List<AcademeDto.CoursResume> catalogue(
            @RequestParam(required = false) String categorie,
            @RequestParam(required = false) String niveau,
            @AuthenticationPrincipal UserDetails user) {
        return service.catalogue(TenantContext.get(), user.getUsername(), categorie, niveau);
    }

    @GetMapping("/cours/{id}")
    public AcademeDto.CoursDetail detail(@PathVariable UUID id,
                                          @AuthenticationPrincipal UserDetails user) {
        return service.getDetail(id, TenantContext.get(), user.getUsername());
    }

    @PostMapping("/cours/{id}/inscrire")
    @ResponseStatus(HttpStatus.CREATED)
    public AcademeDto.InscriptionResume inscrire(@PathVariable UUID id,
                                                  @AuthenticationPrincipal UserDetails user) {
        return service.inscrire(id, TenantContext.get(), user.getUsername());
    }

    @GetMapping("/mes-formations")
    public List<AcademeDto.InscriptionResume> mesFormations(@AuthenticationPrincipal UserDetails user) {
        return service.mesFormations(TenantContext.get(), user.getUsername());
    }

    @PatchMapping("/inscriptions/{id}/chapitres/{chapitreId}")
    public AcademeDto.InscriptionResume marquerChapitre(@PathVariable UUID id,
                                                         @PathVariable UUID chapitreId,
                                                         @AuthenticationPrincipal UserDetails user) {
        return service.marquerChapitre(id, chapitreId, TenantContext.get(), user.getUsername());
    }

    @PostMapping("/inscriptions/{id}/quiz")
    public AcademeDto.QuizResult soumettreQuiz(@PathVariable UUID id,
                                                @RequestBody AcademeDto.QuizSubmission submission,
                                                @AuthenticationPrincipal UserDetails user) {
        return service.soumettreQuiz(id, submission, TenantContext.get(), user.getUsername());
    }

    @GetMapping("/certificats")
    public List<AcademeDto.CertificatResponse> mesCertificats(@AuthenticationPrincipal UserDetails user) {
        return service.mesCertificats(TenantContext.get(), user.getUsername());
    }

    @GetMapping("/certificats/verify/{numero}")
    public AcademeDto.CertificatResponse verifier(@PathVariable String numero) {
        return service.verifierCertificat(numero);
    }
}
