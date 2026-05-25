-- Table des taux de change
CREATE TABLE taux_change (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    devise        VARCHAR(3)  NOT NULL,
    date_taux     DATE        NOT NULL,
    taux          NUMERIC(15,6) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (entreprise_id, devise, date_taux)
);

CREATE INDEX idx_taux_change_devise ON taux_change(entreprise_id, devise, date_taux DESC);

-- Colonnes devise sur les lignes d'écriture
ALTER TABLE lignes_ecriture
    ADD COLUMN devise         VARCHAR(3),
    ADD COLUMN montant_devise NUMERIC(15,2),
    ADD COLUMN taux_saisi     NUMERIC(15,6);
