CREATE TABLE factures (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id         UUID NOT NULL REFERENCES entreprises(id),
    numero                VARCHAR(50)  NOT NULL,
    date_facture          DATE         NOT NULL,
    date_echeance         DATE,
    tiers_id              UUID         REFERENCES tiers(id) ON DELETE SET NULL,
    nom_tiers             VARCHAR(255),
    adresse_tiers         TEXT,
    statut                VARCHAR(20)  NOT NULL DEFAULT 'BROUILLON',
    montant_ht            NUMERIC(18,2) NOT NULL DEFAULT 0,
    montant_tva           NUMERIC(18,2) NOT NULL DEFAULT 0,
    montant_ttc           NUMERIC(18,2) NOT NULL DEFAULT 0,
    ecriture_vente_id     UUID REFERENCES ecritures_comptables(id),
    ecriture_reglement_id UUID REFERENCES ecritures_comptables(id),
    notes                 TEXT,
    created_at            TIMESTAMPTZ DEFAULT NOW(),
    updated_at            TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (entreprise_id, numero)
);

CREATE TABLE lignes_factures (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facture_id     UUID         NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
    description    VARCHAR(500) NOT NULL,
    quantite       NUMERIC(10,3) NOT NULL DEFAULT 1,
    prix_unitaire  NUMERIC(18,2) NOT NULL DEFAULT 0,
    taux_tva       NUMERIC(5,2)  NOT NULL DEFAULT 18,
    montant_ht     NUMERIC(18,2) NOT NULL DEFAULT 0,
    montant_tva    NUMERIC(18,2) NOT NULL DEFAULT 0,
    montant_ttc    NUMERIC(18,2) NOT NULL DEFAULT 0,
    compte_produit VARCHAR(20)   DEFAULT '706',
    ordre          INTEGER       DEFAULT 0
);

CREATE INDEX idx_factures_entreprise_statut ON factures(entreprise_id, statut);
CREATE INDEX idx_factures_tiers             ON factures(tiers_id);
CREATE INDEX idx_lignes_factures_facture    ON lignes_factures(facture_id);
