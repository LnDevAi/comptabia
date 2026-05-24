-- Exercices comptables (suivi des années + clôture)
CREATE TABLE exercices_comptables (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    annee           INT          NOT NULL,
    statut          VARCHAR(20)  NOT NULL DEFAULT 'OUVERT',
    date_ouverture  DATE         NOT NULL,
    date_cloture    DATE,
    cloture_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_exercice_tenant_annee UNIQUE (entreprise_id, annee)
);

CREATE INDEX idx_exercices_tenant ON exercices_comptables(entreprise_id);
