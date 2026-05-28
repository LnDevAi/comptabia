package com.edefence.comptabia.dto.auth;

public final class TwoFactorDto {

    private TwoFactorDto() {}

    public record SetupResponse(
            String qrCodeImage,
            String secret,
            String uri
    ) {}

    public record EnableRequest(String code) {}

    public record DisableRequest(String code) {}

    public record VerifyRequest(String tempToken, String code) {}

    public record StatusResponse(boolean totpEnabled) {}
}
