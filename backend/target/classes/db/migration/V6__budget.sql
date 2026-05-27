CREATE TABLE budgets (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    exercice      INT           NOT NULL,
    compte_numero VARCHAR(20)   NOT NULL,
    montant       NUMERIC(15,2) NOT NULL DEFAULT 0,
    sens          VARCHAR(10)   NOT NULL DEFAULT 'DEBIT',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_budget_tenant_exercice_compte_sens
        UNIQUE (entreprise_id, exercice, compte_numero, sens)
);

CREATE INDEX idx_budget_tenant_exercice ON budgets(entreprise_id, exercice);
