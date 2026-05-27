-- ─────────────────────────────────────────────────────────────────────────────
-- V34 — Discipline & Sanctions RH
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE dossiers_disciplinaires (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id       UUID        NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    collaborateur_id    UUID        NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
    type_sanction       VARCHAR(30) NOT NULL,   -- AVERTISSEMENT, BLAME, MISE_A_PIED, LICENCIEMENT
    motif               TEXT        NOT NULL,
    description         TEXT,
    date_faits          DATE        NOT NULL,   -- date des faits reprochés
    date_convocation    DATE,                   -- date convocation entretien préalable
    date_entretien      DATE,                   -- date effective de l'entretien
    date_notification   DATE,                   -- date de notification de la sanction
    duree_jours         INT,                    -- durée pour MISE_A_PIED (nombre de jours)
    statut              VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',  -- EN_COURS, CLOTURE, ANNULE
    notes               TEXT,
    created_by          UUID        REFERENCES utilisateurs(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE etapes_procedure (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    dossier_id      UUID        NOT NULL REFERENCES dossiers_disciplinaires(id) ON DELETE CASCADE,
    type_etape      VARCHAR(30) NOT NULL,  -- CONVOCATION, ENTRETIEN, DECISION, CLOTURE
    date_etape      DATE        NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_dossiers_entreprise ON dossiers_disciplinaires(entreprise_id);
CREATE INDEX idx_dossiers_collaborateur ON dossiers_disciplinaires(collaborateur_id);
CREATE INDEX idx_etapes_dossier ON etapes_procedure(dossier_id);
