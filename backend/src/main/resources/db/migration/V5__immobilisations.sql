CREATE TABLE immobilisations (
    id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id        UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    code                 VARCHAR(20)   NOT NULL,
    designation          VARCHAR(255)  NOT NULL,
    categorie            VARCHAR(20)   NOT NULL,
    compte_numero        VARCHAR(20),
    compte_amort_numero  VARCHAR(20),
    date_acquisition     DATE          NOT NULL,
    valeur_brute         NUMERIC(15,2) NOT NULL,
    duree_amortissement  INT           NOT NULL,
    methode              VARCHAR(20)   NOT NULL DEFAULT 'LINEAIRE',
    statut               VARCHAR(20)   NOT NULL DEFAULT 'ACTIF',
    date_cession         DATE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_immo_code_tenant UNIQUE (entreprise_id, code)
);

CREATE TABLE amortissements (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    immobilisation_id     UUID          NOT NULL REFERENCES immobilisations(id) ON DELETE CASCADE,
    exercice              INT           NOT NULL,
    dotation              NUMERIC(15,2) NOT NULL,
    cumul_amortissement   NUMERIC(15,2) NOT NULL,
    valeur_nette          NUMERIC(15,2) NOT NULL,
    ecriture_id           UUID          REFERENCES ecritures_comptables(id),
    CONSTRAINT uq_amort_immo_exercice UNIQUE (immobilisation_id, exercice)
);

CREATE INDEX idx_immo_tenant      ON immobilisations(entreprise_id);
CREATE INDEX idx_amort_immo       ON amortissements(immobilisation_id);
