package com.edefence.comptabia.controller;

import com.edefence.comptabia.dto.portail.ClientPortailDto;
import com.edefence.comptabia.service.ClientPortailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Portail client", description = "Accès client en lecture seule aux factures")
@RestController
@RequestMapping("/api/portail")
@RequiredArgsConstructor
public class ClientPortailController {

    private final ClientPortailService service;

    // ─── Authentification (sans JWT interne) ─────────────────────────────────

    @Operation(summary = "Demander un code OTP", description = "Envoie un code OTP à 6 chiffres (TTL 15min) sur l'email du client.")
    @PostMapping("/{entrepriseId}/auth")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void requestOtp(@PathVariable UUID entrepriseId,
                           @RequestBody ClientPortailDto.AuthRequest req) {
        service.sendOtp(entrepriseId, req.email());
    }

    @Operation(summary = "Vérifier le code OTP", description = "Retourne un token portail JWT (TTL 1h) si le code est valide.")
    @PostMapping("/{entrepriseId}/verify")
    public ClientPortailDto.PortailTokenResponse verify(@PathVariable UUID entrepriseId,
                                                        @RequestBody ClientPortailDto.VerifyRequest req) {
        return service.verify(entrepriseId, req.email(), req.code());
    }

    // ─── Factures (portail JWT requis dans Authorization: Bearer) ─────────────

    @Operation(summary = "Lister mes factures", description = "Retourne les factures EMISES/PAYEES du client. Nécessite un token portail.")
    @GetMapping("/factures")
    public List<ClientPortailDto.FactureClientResponse> getFactures(
            @RequestHeader("Authorization") String authorization) {
        return service.getFactures(authorization);
    }

    @Operation(summary = "Détail d'une facture", description = "Retourne le détail d'une facture du client.")
    @GetMapping("/factures/{id}")
    public ClientPortailDto.FactureClientResponse getFacture(
            @RequestHeader("Authorization") String authorization,
            @PathVariable UUID id) {
        return service.getFacture(authorization, id);
    }
}
