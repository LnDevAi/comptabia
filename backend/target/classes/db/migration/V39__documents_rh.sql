-- Module Gestion documentaire RH
CREATE TABLE documents_rh (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id    UUID NOT NULL REFERENCES entreprises(id),
    collaborateur_id UUID REFERENCES utilisateurs(id),
    type_document    VARCHAR(30)  NOT NULL DEFAULT 'AUTRE',
    titre            VARCHAR(255) NOT NULL,
    description      TEXT,
    reference        VARCHAR(100),
    date_document    DATE,
    date_expiration  DATE,
    statut           VARCHAR(20)  NOT NULL DEFAULT 'VALIDE',
    created_at       TIMESTAMPTZ  DEFAULT now(),
    updated_at       TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX idx_documents_rh_entreprise    ON documents_rh(entreprise_id);
CREATE INDEX idx_documents_rh_collaborateur ON documents_rh(collaborateur_id);
CREATE INDEX idx_documents_rh_expiration    ON documents_rh(date_expiration) WHERE date_expiration IS NOT NULL;
