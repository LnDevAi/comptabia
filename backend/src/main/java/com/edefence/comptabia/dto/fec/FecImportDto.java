package com.edefence.comptabia.dto.fec;

import java.util.List;

public class FecImportDto {

    public record LineError(int ligne, String ecritureNum, String message) {}

    public record Result(
            int ecrituresCreees,
            int ecrituresIgnorees,
            int comptesCrees,
            List<LineError> erreurs
    ) {}
}
