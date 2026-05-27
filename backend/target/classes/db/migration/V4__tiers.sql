CREATE TABLE tiers (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id  UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    type           VARCHAR(20)  NOT NULL,
    code           VARCHAR(20)  NOT NULL,
    nom            VARCHAR(255) NOT NULL,
    email          VARCHAR(255),
    telephone      VARCHAR(50),
    adresse        TEXT,
    compte_numero  VARCHAR(20),
    actif          BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tiers_code_tenant UNIQUE (entreprise_id, code)
);

CREATE INDEX idx_tiers_tenant ON tiers(entreprise_id);
CREATE INDEX idx_tiers_type   ON tiers(entreprise_id, type);
