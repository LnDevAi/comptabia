package com.edefence.ecompta.controller;

import com.edefence.ecompta.dto.exercice.ExerciceDto;
import com.edefence.ecompta.service.ClotureService;
import com.edefence.ecompta.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercices")
@RequiredArgsConstructor
public class ClotureController {

    private final ClotureService service;

    @GetMapping
    public List<ExerciceDto.Response> lister() {
        return service.lister(TenantContext.get());
    }

    @PostMapping("/{annee}/cloturer")
    public ExerciceDto.ClotureResponse cloturer(@PathVariable int annee,
                                                 @AuthenticationPrincipal UserDetails user) {
        return service.cloturer(TenantContext.get(), annee, user.getUsername());
    }
}
