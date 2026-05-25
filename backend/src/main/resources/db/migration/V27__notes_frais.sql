CREATE TABLE notes_frais (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id               UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    collaborateur_id            UUID NOT NULL REFERENCES utilisateurs(id),
    titre                       VARCHAR(255) NOT NULL,
    categorie                   VARCHAR(20) NOT NULL,
    description                 TEXT,
    montant                     NUMERIC(15,2) NOT NULL,
    compte_charge               VARCHAR(20) NOT NULL,
    date_debut                  DATE NOT NULL,
    date_fin                    DATE NOT NULL,
    statut                      VARCHAR(20) NOT NULL DEFAULT 'BROUILLON',
    commentaire_rejet           TEXT,
    ecriture_approbation_id     UUID REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
    ecriture_remboursement_id   UUID REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
    created_at                  TIMESTAMPTZ DEFAULT NOW(),
    updated_at                  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_frais_entreprise     ON notes_frais(entreprise_id, statut);
CREATE INDEX idx_notes_frais_collaborateur  ON notes_frais(collaborateur_id);
