package com.edefence.comptabia.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.binary.Base32;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.io.ByteArrayOutputStream;
import java.net.URLEncoder;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Service
public class TotpService {

    private static final String ISSUER   = "e-Compta";
    private static final int    DIGITS   = 6;
    private static final int    PERIOD   = 30;
    private static final int    WINDOW   = 1;

    // ─── Secret ───────────────────────────────────────────────────────────────

    public String generateSecret() {
        byte[] bytes = new byte[20]; // 160-bit entropy
        new SecureRandom().nextBytes(bytes);
        return new Base32().encodeToString(bytes).replace("=", "");
    }

    // ─── Verification ─────────────────────────────────────────────────────────

    public boolean isValid(String secret, String code) {
        if (code == null || code.length() != DIGITS) return false;
        long counter = System.currentTimeMillis() / 1000L / PERIOD;
        for (int i = -WINDOW; i <= WINDOW; i++) {
            if (totp(secret, counter + i).equals(code)) return true;
        }
        return false;
    }

    // ─── QR code ──────────────────────────────────────────────────────────────

    public String getOtpUri(String email, String secret) {
        return "otpauth://totp/" + URLEncoder.encode(ISSUER + ":" + email, StandardCharsets.UTF_8)
                + "?secret=" + secret
                + "&issuer=" + URLEncoder.encode(ISSUER, StandardCharsets.UTF_8)
                + "&algorithm=SHA1&digits=" + DIGITS + "&period=" + PERIOD;
    }

    public String getQrCodeBase64(String email, String secret) {
        try {
            String uri = getOtpUri(email, secret);
            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix matrix = writer.encode(uri, BarcodeFormat.QR_CODE, 200, 200);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(matrix, "PNG", out);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (Exception e) {
            log.error("QR code generation failed", e);
            return null;
        }
    }

    // ─── TOTP (RFC 6238) ──────────────────────────────────────────────────────

    private String totp(String secret, long counter) {
        try {
            byte[] key  = new Base32().decode(secret.toUpperCase());
            byte[] data = ByteBuffer.allocate(8).putLong(counter).array();
            byte[] hash = hmacSha1(key, data);
            int offset  = hash[hash.length - 1] & 0x0f;
            int otp     = ((hash[offset]     & 0x7f) << 24)
                        | ((hash[offset + 1] & 0xff) << 16)
                        | ((hash[offset + 2] & 0xff) << 8)
                        | ((hash[offset + 3] & 0xff));
            return String.format("%0" + DIGITS + "d", otp % (int) Math.pow(10, DIGITS));
        } catch (Exception e) {
            throw new RuntimeException("TOTP computation failed", e);
        }
    }

    private byte[] hmacSha1(byte[] key, byte[] data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA1");
        mac.init(new SecretKeySpec(key, "HmacSHA1"));
        return mac.doFinal(data);
    }
}
