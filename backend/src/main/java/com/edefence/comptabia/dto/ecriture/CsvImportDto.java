package com.edefence.comptabia.dto.ecriture;

import java.util.List;

public final class CsvImportDto {

    private CsvImportDto() {}

    public record Result(
            int created,
            int skipped,
            List<LineError> errors
    ) {}

    public record LineError(
            int ligne,
            String numeroPiece,
            String message
    ) {}
}
