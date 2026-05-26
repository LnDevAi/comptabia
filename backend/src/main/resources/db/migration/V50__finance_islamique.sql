-- Produits financiers islamiques (Mourabaha, Ijara, Moudaraba, Moucharaka, etc.)
CREATE TABLE IF NOT EXISTS produits_islamiques (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id       UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    reference           VARCHAR(50),
    nom_client          VARCHAR(255) NOT NULL,
    type_produit        VARCHAR(30) NOT NULL DEFAULT 'MOURABAHA',
    montant_financement DECIMAL(19,4) NOT NULL,
    montant_encours     DECIMAL(19,4) NOT NULL DEFAULT 0,
    marge_beneficiaire  DECIMAL(19,4) NOT NULL DEFAULT 0,
    taux_marge          DECIMAL(7,4) NOT NULL DEFAULT 0,
    date_contrat        DATE NOT NULL,
    date_echeance       DATE,
    jours_retard        INT NOT NULL DEFAULT 0,
    statut              VARCHAR(20) NOT NULL DEFAULT 'ACTIF',
    objet_financement   TEXT,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Calculs de Zakat annuels
CREATE TABLE IF NOT EXISTS zakat_calculs (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id       UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    exercice            INT NOT NULL,
    date_calcul         DATE NOT NULL,
    base_zakatable      DECIMAL(19,4) NOT NULL DEFAULT 0,
    taux_zakat          DECIMAL(7,4) NOT NULL DEFAULT 2.5000,
    montant_zakat       DECIMAL(19,4) NOT NULL DEFAULT 0,
    montant_verse       DECIMAL(19,4) NOT NULL DEFAULT 0,
    statut              VARCHAR(20) NOT NULL DEFAULT 'CALCULE',
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entreprise_id, exercice)
);

CREATE INDEX idx_produits_islamiques_entreprise ON produits_islamiques(entreprise_id);
CREATE INDEX idx_zakat_calculs_entreprise        ON zakat_calculs(entreprise_id);
