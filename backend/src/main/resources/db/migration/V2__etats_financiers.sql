-- Système comptable par entreprise
ALTER TABLE entreprises ADD COLUMN systeme_comptable VARCHAR(10) NOT NULL DEFAULT 'NORMAL';

-- Notes annexes par exercice
CREATE TABLE notes_annexes (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    exercice      INT          NOT NULL,
    titre         VARCHAR(255) NOT NULL,
    contenu       TEXT,
    ordre         INT          NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notes_annexes_tenant ON notes_annexes(entreprise_id, exercice);
