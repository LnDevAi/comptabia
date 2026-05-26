ALTER TABLE groupes_societes_membres
  ADD COLUMN IF NOT EXISTS taux_detention      DECIMAL(5,2)  NOT NULL DEFAULT 100.00,
  ADD COLUMN IF NOT EXISTS methode_consolidation VARCHAR(30)  NOT NULL DEFAULT 'INTEGRATION_GLOBALE';

CREATE TABLE IF NOT EXISTS eliminations_interco (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    groupe_id      UUID        NOT NULL REFERENCES groupes_societes(id) ON DELETE CASCADE,
    compte_debit   VARCHAR(20) NOT NULL,
    compte_credit  VARCHAR(20) NOT NULL,
    libelle        VARCHAR(200),
    exercice       INT         NOT NULL,
    montant        DECIMAL(19,4) NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eliminations_groupe ON eliminations_interco(groupe_id, exercice);
