CREATE TABLE groupes_societes (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom          VARCHAR(255) NOT NULL,
    description  TEXT,
    createur_id  UUID NOT NULL REFERENCES utilisateurs(id),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE groupes_societes_membres (
    groupe_id     UUID NOT NULL REFERENCES groupes_societes(id) ON DELETE CASCADE,
    entreprise_id UUID NOT NULL REFERENCES entreprises(id)      ON DELETE CASCADE,
    PRIMARY KEY (groupe_id, entreprise_id)
);

CREATE INDEX idx_groupes_createur ON groupes_societes(createur_id);
