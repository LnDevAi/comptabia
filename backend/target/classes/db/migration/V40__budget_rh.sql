CREATE TABLE budgets_rh (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    exercice      INT           NOT NULL,
    mois          INT           NOT NULL DEFAULT 0,
    categorie     VARCHAR(30)   NOT NULL,
    montant       NUMERIC(15,2) NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_budget_rh      UNIQUE  (entreprise_id, exercice, mois, categorie),
    CONSTRAINT chk_mois_rh       CHECK   (mois BETWEEN 0 AND 12),
    CONSTRAINT chk_categorie_rh  CHECK   (categorie IN (
        'MASSE_BRUTE','COTISATIONS_PATRONALES','COTISATIONS_SALARIALES','IMPOT_RETENU','NET_A_PAYER'
    ))
);

CREATE INDEX idx_budget_rh_tenant ON budgets_rh(entreprise_id, exercice);
