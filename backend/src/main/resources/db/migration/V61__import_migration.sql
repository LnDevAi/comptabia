-- Historique des imports de données (migration client)
CREATE TABLE import_historique (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id),
    format          VARCHAR(20)  NOT NULL, -- FEC, EXCEL_CSV, SAGE, EBP, WAVESOFT, SOLDES
    type_donnees    VARCHAR(30)  NOT NULL, -- ECRITURES, TIERS, PLAN_COMPTABLE, IMMOBILISATIONS, SOLDES
    statut          VARCHAR(20)  NOT NULL DEFAULT 'TERMINE', -- TERMINE, ERREUR, ANNULE
    nb_importes     INTEGER      NOT NULL DEFAULT 0,
    nb_ignores      INTEGER      NOT NULL DEFAULT 0,
    nb_erreurs      INTEGER      NOT NULL DEFAULT 0,
    nom_fichier     VARCHAR(255),
    rapport_json    TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_import_historique_ent ON import_historique(entreprise_id, created_at DESC);
