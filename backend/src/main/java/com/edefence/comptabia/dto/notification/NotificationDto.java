package com.edefence.comptabia.dto.notification;

import java.time.Instant;

public record NotificationDto(
        String  type,      // HEARTBEAT | ALERTE | BROUILLON | FACTURE_EN_RETARD | BUDGET_DEPASSE
        String  message,
        int     count,
        String  severity,  // INFO | WARNING | DANGER
        String  link,
        Instant timestamp
) {}
