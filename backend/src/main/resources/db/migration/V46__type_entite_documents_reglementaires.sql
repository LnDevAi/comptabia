-- Type d'entité sur les entreprises
ALTER TABLE entreprises
    ADD COLUMN IF NOT EXISTS type_entite VARCHAR(30) NOT NULL DEFAULT 'ENTREPRISE';

CREATE INDEX IF NOT EXISTS idx_entreprises_type_entite
    ON entreprises(type_entite);

-- Table documents réglementaires (associations et autres entités réglementées)
CREATE TABLE IF NOT EXISTS documents_reglementaires (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id        UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    categorie            VARCHAR(50) NOT NULL,
    nom                  VARCHAR(255) NOT NULL,
    description          TEXT,
    date_depot           DATE,
    date_echeance        DATE,
    chemin_fichier       VARCHAR(500),
    nom_fichier_original VARCHAR(255),
    taille_fichier       BIGINT,
    type_mime            VARCHAR(100),
    statut               VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    notes                TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_regl_entreprise
    ON documents_reglementaires(entreprise_id, categorie);
CREATE INDEX IF NOT EXISTS idx_docs_regl_echeance
    ON documents_reglementaires(date_echeance) WHERE date_echeance IS NOT NULL;
