CREATE TABLE abonnements (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    tiers_id          UUID REFERENCES tiers(id) ON DELETE SET NULL,
    nom               VARCHAR(255) NOT NULL,
    description       TEXT,
    periodicite       VARCHAR(20) NOT NULL,
    montant_ht        NUMERIC(15,2) NOT NULL,
    taux_tva          NUMERIC(5,2) NOT NULL DEFAULT 18,
    compte_produit    VARCHAR(20),
    date_debut        DATE NOT NULL,
    date_fin          DATE,
    actif             BOOLEAN NOT NULL DEFAULT TRUE,
    prochaine_echeance DATE NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_abonnements_entreprise ON abonnements(entreprise_id);
CREATE INDEX idx_abonnements_echeance   ON abonnements(prochaine_echeance) WHERE actif = TRUE;
