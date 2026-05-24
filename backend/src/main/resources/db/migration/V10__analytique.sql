CREATE TABLE axes_analytiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    intitule VARCHAR(255) NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_axe_code_tenant UNIQUE (entreprise_id, code)
);

ALTER TABLE lignes_ecriture
    ADD COLUMN axe_analytique_id UUID REFERENCES axes_analytiques(id) ON DELETE SET NULL;
