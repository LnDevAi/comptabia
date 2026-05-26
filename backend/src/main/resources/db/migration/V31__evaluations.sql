CREATE TABLE objectifs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    collaborateur_id  UUID NOT NULL REFERENCES utilisateurs(id),
    annee             INT  NOT NULL,
    titre             VARCHAR(200) NOT NULL,
    description       TEXT,
    poids             INT  NOT NULL DEFAULT 10,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_objectif_poids CHECK (poids BETWEEN 1 AND 100)
);

CREATE TABLE evaluations (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    collaborateur_id  UUID NOT NULL REFERENCES utilisateurs(id),
    annee             INT  NOT NULL,
    periode           VARCHAR(10) NOT NULL DEFAULT 'ANNUEL',
    statut            VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    commentaire_global TEXT,
    score_global      DECIMAL(4,2),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_eval_periode CHECK (periode IN ('ANNUEL','S1','S2','T1','T2','T3','T4')),
    CONSTRAINT chk_eval_statut  CHECK (statut  IN ('BROUILLON','SOUMISE','VALIDEE')),
    CONSTRAINT uq_evaluation UNIQUE (entreprise_id, collaborateur_id, annee, periode)
);

CREATE TABLE lignes_evaluation (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id  UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
    objectif_id    UUID NOT NULL REFERENCES objectifs(id) ON DELETE CASCADE,
    note           DECIMAL(3,1) NOT NULL DEFAULT 0,
    commentaire    TEXT,
    CONSTRAINT chk_ligne_note CHECK (note BETWEEN 0 AND 5),
    CONSTRAINT uq_ligne_eval UNIQUE (evaluation_id, objectif_id)
);
