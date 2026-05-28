package com.edefence.comptabia.dto.alerte;

import java.util.List;

public class AlerteDto {

    public enum Niveau { INFO, WARNING, DANGER }

    public record Alerte(
            String id,
            Niveau niveau,
            String titre,
            String message,
            String module,
            String lien
    ) {}

    public record AlerteResponse(
            List<Alerte> alertes,
            long countDanger,
            long countWarning,
            long countInfo,
            long total
    ) {}
}
