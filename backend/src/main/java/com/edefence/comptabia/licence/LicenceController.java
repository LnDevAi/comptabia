package com.edefence.comptabia.licence;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/licence")
@RequiredArgsConstructor
public class LicenceController {

    private final LicenceService licenceService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public LicenceStatusResponse getStatus() {
        return new LicenceStatusResponse(
                licenceService.isValid(),
                licenceService.getInfo(),
                licenceService.getLoadError()
        );
    }

    // Endpoint public — utile pour le health-check Docker
    @GetMapping("/status")
    public LicenceStatusResponse getPublicStatus() {
        return new LicenceStatusResponse(licenceService.isValid(), null, null);
    }

    // Endpoint pour récupérer l'empreinte machine (utile lors de la génération de la licence liée à une machine)
    @GetMapping("/fingerprint")
    @PreAuthorize("hasRole('ADMIN')")
    public FingerprintResponse getFingerprint() {
        return new FingerprintResponse(licenceService.getMachineFingerprint());
    }

    public record LicenceStatusResponse(boolean valid, LicenceInfo info, String error) {}
    public record FingerprintResponse(String fingerprint) {}
}
