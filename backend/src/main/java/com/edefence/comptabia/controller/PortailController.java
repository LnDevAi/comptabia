package com.edefence.comptabia.controller;

import com.edefence.comptabia.domain.Utilisateur;
import com.edefence.comptabia.dto.portail.PortailDto;
import com.edefence.comptabia.service.PortailService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portail")
@RequiredArgsConstructor
public class PortailController {

    private final PortailService svc;

    @GetMapping
    public PortailDto.Tableau getTableau(@AuthenticationPrincipal Utilisateur user) {
        return svc.getTableau(user);
    }
}
