CREATE TABLE regularisations (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id         UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    type                  VARCHAR(10) NOT NULL,
    libelle               VARCHAR(255) NOT NULL,
    compte_contrepartie   VARCHAR(20) NOT NULL,
    montant               NUMERIC(15,2) NOT NULL,
    exercice              INT NOT NULL,
    date_regularisation   DATE NOT NULL,
    date_extourne         DATE NOT NULL,
    statut                VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    ecriture_id           UUID REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
    ecriture_extourne_id  UUID REFERENCES ecritures_comptables(id) ON DELETE SET NULL,
    created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_regularisations_entreprise ON regularisations(entreprise_id, exercice);
