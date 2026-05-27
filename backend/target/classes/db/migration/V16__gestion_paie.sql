CREATE TABLE feuilles_paie (
    id                      UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id           UUID           NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    exercice                INT            NOT NULL,
    mois                    INT            NOT NULL CHECK (mois BETWEEN 1 AND 12),
    nb_salaries             INT            NOT NULL DEFAULT 0,
    masse_salariale_brute   NUMERIC(15,2)  NOT NULL DEFAULT 0,
    cotisations_salariales  NUMERIC(15,2)  NOT NULL DEFAULT 0,
    cotisations_patronales  NUMERIC(15,2)  NOT NULL DEFAULT 0,
    impot_retenu            NUMERIC(15,2)  NOT NULL DEFAULT 0,
    net_a_payer             NUMERIC(15,2)  NOT NULL DEFAULT 0,
    statut                  VARCHAR(20)    NOT NULL DEFAULT 'BROUILLON',
    ecriture_id             UUID           REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
    created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_paie_mois UNIQUE (entreprise_id, exercice, mois),
    CONSTRAINT chk_paie_statut CHECK (statut IN ('BROUILLON', 'COMPTABILISEE'))
);

CREATE INDEX idx_paie_tenant_exercice ON feuilles_paie(entreprise_id, exercice);
