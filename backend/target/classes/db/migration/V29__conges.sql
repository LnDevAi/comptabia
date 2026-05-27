-- V29 : Gestion des congés et absences

CREATE TABLE conges (
    id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id       UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    collaborateur_id    UUID          NOT NULL REFERENCES utilisateurs(id),
    type                VARCHAR(20)   NOT NULL,
    date_debut          DATE          NOT NULL,
    date_fin            DATE          NOT NULL,
    nombre_jours        INT           NOT NULL DEFAULT 1,
    motif               TEXT,
    statut              VARCHAR(20)   NOT NULL DEFAULT 'BROUILLON',
    commentaire_rejet   TEXT,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_conge_type   CHECK (type   IN ('ANNUEL','MALADIE','SANS_SOLDE','EXCEPTIONNEL','MATERNITE','PATERNITE')),
    CONSTRAINT chk_conge_statut CHECK (statut IN ('BROUILLON','SOUMISE','APPROUVEE','REJETEE')),
    CONSTRAINT chk_conge_dates  CHECK (date_fin >= date_debut)
);

CREATE INDEX idx_conges_entreprise    ON conges(entreprise_id);
CREATE INDEX idx_conges_collaborateur ON conges(entreprise_id, collaborateur_id);
CREATE INDEX idx_conges_statut        ON conges(entreprise_id, statut);
