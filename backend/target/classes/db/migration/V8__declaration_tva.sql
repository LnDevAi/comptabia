CREATE TABLE declarations_tva (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id    UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    periode_debut    DATE          NOT NULL,
    periode_fin      DATE          NOT NULL,
    tva_collectee    NUMERIC(15,2) NOT NULL DEFAULT 0,
    tva_deductible   NUMERIC(15,2) NOT NULL DEFAULT 0,
    tva_a_decaisser  NUMERIC(15,2) NOT NULL DEFAULT 0,
    statut           VARCHAR(20)   NOT NULL DEFAULT 'BROUILLON',
    ecriture_id      UUID          REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_declaration_tva_periode
        UNIQUE (entreprise_id, periode_debut, periode_fin)
);

CREATE INDEX idx_decl_tva_tenant ON declarations_tva(entreprise_id);
