-- ─────────────────────────────────────────────────────────────────────────────
-- V33 — Formation professionnelle
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE formations (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID        NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    titre           VARCHAR(200) NOT NULL,
    domaine         VARCHAR(100) NOT NULL,   -- Fiscalité, Comptabilité, Informatique, Management, RH, Autre
    objectif        TEXT,
    annee           INT         NOT NULL,
    budget_prevu    DECIMAL(15,2),
    statut          VARCHAR(20) NOT NULL DEFAULT 'PLANIFIE',  -- PLANIFIE, EN_COURS, REALISE, ANNULE
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions_formation (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID        NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    formation_id    UUID        NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    date_debut      DATE        NOT NULL,
    date_fin        DATE        NOT NULL,
    lieu            VARCHAR(200),
    formateur       VARCHAR(200),
    nb_places       INT         NOT NULL DEFAULT 10,
    cout_reel       DECIMAL(15,2),
    statut          VARCHAR(20) NOT NULL DEFAULT 'PLANIFIEE',  -- PLANIFIEE, EN_COURS, TERMINEE, ANNULEE
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inscriptions_formation (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id          UUID        NOT NULL REFERENCES sessions_formation(id) ON DELETE CASCADE,
    collaborateur_id    UUID        NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    statut              VARCHAR(20) NOT NULL DEFAULT 'INSCRIT',  -- INSCRIT, PRESENT, ABSENT, CERTIFIE
    note                DECIMAL(4,1),
    commentaire         TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_inscription UNIQUE (session_id, collaborateur_id),
    CONSTRAINT chk_note CHECK (note IS NULL OR (note >= 0 AND note <= 20))
);

CREATE INDEX idx_formations_entreprise_annee ON formations(entreprise_id, annee);
CREATE INDEX idx_sessions_formation ON sessions_formation(formation_id);
CREATE INDEX idx_inscriptions_session ON inscriptions_formation(session_id);
CREATE INDEX idx_inscriptions_collab ON inscriptions_formation(collaborateur_id);
