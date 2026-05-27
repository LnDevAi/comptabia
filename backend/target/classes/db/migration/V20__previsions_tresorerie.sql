CREATE TABLE flux_tresorerie_previsions (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID        NOT NULL REFERENCES entreprises(id),
    date_flux     DATE        NOT NULL,
    type_flux     VARCHAR(20) NOT NULL,   -- ENCAISSEMENT | DECAISSEMENT
    libelle       VARCHAR(500) NOT NULL,
    montant       NUMERIC(18,2) NOT NULL,
    recurrent     BOOLEAN     NOT NULL DEFAULT FALSE,
    periodicite   VARCHAR(20),            -- MENSUEL | TRIMESTRIEL | ANNUEL
    categorie     VARCHAR(100),
    actif         BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_flux_previsions_entreprise ON flux_tresorerie_previsions(entreprise_id, actif, date_flux);
