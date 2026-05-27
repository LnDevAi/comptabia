CREATE TABLE approbations (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ecriture_id    UUID NOT NULL REFERENCES ecritures_comptables(id) ON DELETE CASCADE,
    entreprise_id  UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    approbateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    decision       VARCHAR(20) NOT NULL,
    commentaire    TEXT,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_approbations_ecriture   ON approbations(ecriture_id);
CREATE INDEX idx_approbations_entreprise ON approbations(entreprise_id);
