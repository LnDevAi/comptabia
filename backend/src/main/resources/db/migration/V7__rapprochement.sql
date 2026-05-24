CREATE TABLE releves_bancaires (
    id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id  UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    compte_numero  VARCHAR(20)   NOT NULL,
    reference      VARCHAR(100),
    date_releve    DATE          NOT NULL,
    libelle        VARCHAR(500)  NOT NULL,
    montant        NUMERIC(15,2) NOT NULL,
    sens           VARCHAR(10)   NOT NULL,
    statut         VARCHAR(20)   NOT NULL DEFAULT 'NON_RAPPROCHE',
    ligne_ecriture_id UUID       REFERENCES lignes_ecriture(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_releve_tenant_compte   ON releves_bancaires(entreprise_id, compte_numero);
CREATE INDEX idx_releve_statut          ON releves_bancaires(entreprise_id, statut);
