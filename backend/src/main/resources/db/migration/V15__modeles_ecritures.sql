CREATE TABLE modeles_ecriture (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom           VARCHAR(255) NOT NULL,
    libelle_defaut VARCHAR(500),
    journal       VARCHAR(10)  NOT NULL DEFAULT 'OD',
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_modele_nom_tenant UNIQUE (entreprise_id, nom)
);

CREATE TABLE lignes_modele (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    modele_id  UUID           NOT NULL REFERENCES modeles_ecriture(id) ON DELETE CASCADE,
    compte_id  UUID           NOT NULL REFERENCES comptes_comptables(id) ON DELETE CASCADE,
    libelle    VARCHAR(500),
    debit      NUMERIC(15,2)  NOT NULL DEFAULT 0,
    credit     NUMERIC(15,2)  NOT NULL DEFAULT 0,
    ordre      INT            NOT NULL DEFAULT 0
);

CREATE INDEX idx_modeles_tenant ON modeles_ecriture(entreprise_id);
CREATE INDEX idx_lignes_modele  ON lignes_modele(modele_id, ordre);
