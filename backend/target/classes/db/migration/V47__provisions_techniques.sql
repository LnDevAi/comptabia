-- Provisions techniques CIMA
CREATE TABLE IF NOT EXISTS provisions_techniques (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    type_provision  VARCHAR(30)      NOT NULL,
    branche         VARCHAR(20)      NOT NULL DEFAULT 'NON_VIE',
    exercice        INT              NOT NULL,
    date_calcul     DATE             NOT NULL,
    montant         DECIMAL(19, 4)   NOT NULL DEFAULT 0,
    notes           TEXT,
    created_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provisions_techniques_entreprise
    ON provisions_techniques(entreprise_id, exercice);
