package com.edefence.ecompta.licence;

import java.util.List;

public record LicenceInfo(
    String licenceId,
    String clientName,
    String clientId,
    List<String> modules,
    int maxUsers,
    String issuedAt,
    String expiresAt,
    String fingerprint
) {}
