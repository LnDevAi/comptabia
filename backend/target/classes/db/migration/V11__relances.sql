CREATE TABLE relances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    tiers_id UUID NOT NULL REFERENCES tiers(id) ON DELETE CASCADE,
    montant_relance NUMERIC(15,2) NOT NULL DEFAULT 0,
    niveau INT NOT NULL DEFAULT 1,
    note TEXT,
    date_relance DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_relances_tiers ON relances(tiers_id);
CREATE INDEX idx_relances_entreprise ON relances(entreprise_id, date_relance DESC);
