CREATE TABLE declarations_is (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id       UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    exercice            INT NOT NULL,
    resultat_comptable  NUMERIC(15,2) NOT NULL DEFAULT 0,
    reintagrations      NUMERIC(15,2) NOT NULL DEFAULT 0,
    deductions          NUMERIC(15,2) NOT NULL DEFAULT 0,
    resultat_fiscal     NUMERIC(15,2) NOT NULL DEFAULT 0,
    taux_is             NUMERIC(5,2)  NOT NULL DEFAULT 25.00,
    is_theorique        NUMERIC(15,2) NOT NULL DEFAULT 0,
    minimum_forfaitaire NUMERIC(15,2) NOT NULL DEFAULT 0,
    is_du               NUMERIC(15,2) NOT NULL DEFAULT 0,
    statut              VARCHAR(20)   NOT NULL DEFAULT 'BROUILLON',
    ecriture_id         UUID REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_declaration_is_exercice UNIQUE (entreprise_id, exercice),
    CONSTRAINT chk_is_statut CHECK (statut IN ('BROUILLON', 'VALIDEE'))
);
CREATE INDEX idx_declarations_is_tenant ON declarations_is(entreprise_id, exercice DESC);
