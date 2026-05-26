-- Portefeuille de crédits SFD
CREATE TABLE IF NOT EXISTS credits_sfd (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    numero_credit   VARCHAR(50),
    nom_client      VARCHAR(255) NOT NULL,
    montant_accorde DECIMAL(19, 4) NOT NULL,
    montant_encours DECIMAL(19, 4) NOT NULL DEFAULT 0,
    date_deblocage  DATE          NOT NULL,
    date_echeance   DATE,
    jours_retard    INT           NOT NULL DEFAULT 0,
    statut          VARCHAR(20)   NOT NULL DEFAULT 'ACTIF',
    type_credit     VARCHAR(20)   NOT NULL DEFAULT 'MICRO_CREDIT',
    notes           TEXT,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credits_sfd_entreprise
    ON credits_sfd(entreprise_id, statut);
