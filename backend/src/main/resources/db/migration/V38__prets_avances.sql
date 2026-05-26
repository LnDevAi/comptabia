-- Module Prêts & Avances sur salaire
CREATE TABLE prets (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id    UUID NOT NULL REFERENCES entreprises(id),
    collaborateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    type_pret        VARCHAR(10)  NOT NULL DEFAULT 'PRET',
    montant          DECIMAL(15,2) NOT NULL,
    nb_echeances     INT          NOT NULL DEFAULT 1,
    montant_echeance DECIMAL(15,2) NOT NULL,
    date_debut       DATE         NOT NULL,
    statut           VARCHAR(20)  NOT NULL DEFAULT 'EN_ATTENTE',
    motif            TEXT,
    created_at       TIMESTAMPTZ  DEFAULT now()
);

CREATE TABLE echeances_pret (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pret_id    UUID NOT NULL REFERENCES prets(id) ON DELETE CASCADE,
    numero     INT  NOT NULL,
    mois       INT  NOT NULL,
    annee      INT  NOT NULL,
    montant    DECIMAL(15,2) NOT NULL,
    statut     VARCHAR(20)  NOT NULL DEFAULT 'EN_ATTENTE',
    created_at TIMESTAMPTZ  DEFAULT now()
);

CREATE INDEX idx_prets_entreprise    ON prets(entreprise_id);
CREATE INDEX idx_prets_collaborateur ON prets(collaborateur_id);
CREATE INDEX idx_echeances_pret      ON echeances_pret(pret_id);
