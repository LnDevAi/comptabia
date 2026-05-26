package com.edefence.ecompta.licence;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.KeyFactory;
import java.security.MessageDigest;
import java.security.PublicKey;
import java.security.Signature;
import java.security.spec.X509EncodedKeySpec;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class LicenceService {

    @Value("${app.licence.file:./licence.lic}")
    private String licenceFilePath;

    @Value("${app.licence.dev-mode:false}")
    private boolean devMode;

    @Value("${app.licence.public-key:}")
    private String publicKeyBase64;

    private final ObjectMapper objectMapper;

    private LicenceInfo info;
    private boolean valid = false;
    private String loadError;

    @PostConstruct
    public void load() {
        if (devMode) {
            log.warn("⚠  LICENCE: Mode développement — tous les modules sont disponibles sans fichier de licence");
            valid = true;
            info = devLicence();
            return;
        }
        try {
            loadAndVerify();
        } catch (Exception e) {
            valid = false;
            loadError = e.getMessage();
            log.error("LICENCE: Échec de chargement — {}", e.getMessage());
        }
    }

    private void loadAndVerify() throws Exception {
        Path path = Path.of(licenceFilePath);
        if (!Files.exists(path)) {
            throw new Exception("Fichier de licence introuvable : " + licenceFilePath);
        }
        if (publicKeyBase64 == null || publicKeyBase64.isBlank()) {
            throw new Exception("Clé publique de licence non configurée (LICENCE_PUBLIC_KEY)");
        }

        String content = Files.readString(path, StandardCharsets.UTF_8).trim();
        int dotIdx = content.lastIndexOf('.');
        if (dotIdx <= 0) throw new Exception("Format de licence invalide (attendu: payload.signature)");

        String payloadB64 = content.substring(0, dotIdx);
        String sigB64     = content.substring(dotIdx + 1);

        byte[] payloadBytes = Base64.getUrlDecoder().decode(payloadB64);
        byte[] sigBytes     = Base64.getUrlDecoder().decode(sigB64);

        // Vérification signature RSA-SHA256
        byte[] keyBytes = Base64.getDecoder().decode(publicKeyBase64.replaceAll("\\s", ""));
        PublicKey pubKey = KeyFactory.getInstance("RSA")
                .generatePublic(new X509EncodedKeySpec(keyBytes));
        Signature sig = Signature.getInstance("SHA256withRSA");
        sig.initVerify(pubKey);
        sig.update(payloadBytes);
        if (!sig.verify(sigBytes)) throw new Exception("Signature de licence invalide");

        LicenceInfo parsed = objectMapper.readValue(payloadBytes, LicenceInfo.class);

        // Vérification expiration
        LocalDate expiry = LocalDate.parse(parsed.expiresAt());
        if (LocalDate.now().isAfter(expiry)) {
            throw new Exception("Licence expirée le " + expiry);
        }

        // Vérification empreinte machine (si présente)
        if (parsed.fingerprint() != null && !parsed.fingerprint().isBlank()) {
            String currentFingerprint = getMachineFingerprint();
            if (!parsed.fingerprint().equals(currentFingerprint)) {
                throw new Exception("Licence non valide pour cette machine (empreinte incorrecte)");
            }
        }

        this.info  = parsed;
        this.valid = true;
        log.info("✓ Licence valide — client: {} | modules: {} | expire: {}",
                parsed.clientName(), parsed.modules(), parsed.expiresAt());
    }

    public boolean hasModule(LicenceModule module) {
        return valid && info != null && info.modules().contains(module.name());
    }

    public LicenceInfo getInfo() { return info; }
    public boolean isValid()     { return valid; }
    public String getLoadError() { return loadError; }

    public String getMachineFingerprint() {
        try {
            InetAddress ip = InetAddress.getLocalHost();
            NetworkInterface ni = NetworkInterface.getByInetAddress(ip);
            byte[] mac = (ni != null && ni.getHardwareAddress() != null)
                    ? ni.getHardwareAddress() : new byte[0];
            String combined = ip.getHostName() + ":" + bytesToHex(mac);
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return Base64.getEncoder().encodeToString(
                    md.digest(combined.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            return "unknown";
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    private LicenceInfo devLicence() {
        return new LicenceInfo(
                "DEV-0000", "Mode Développement", "dev",
                List.of(
                        "COMPTABILITE", "TIERS", "IMMOBILISATIONS", "FISCAL",
                        "BUDGET", "TRESORERIE", "FACTURATION", "EXPORT", "DOCUMENTS",
                        "PAIE_RH", "CRM", "IA", "CONSOLIDATION", "AUDIT",
                        "PILOTAGE", "ASSURANCE", "MICROFINANCE", "FINANCE_ISLAMIQUE", "GOUVERNANCE"
                ),
                99, LocalDate.now().toString(),
                LocalDate.now().plusYears(100).toString(),
                null
        );
    }
}
