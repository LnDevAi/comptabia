-- V35 : Conformité Facture Normalisée Burkina Faso (DGI/eSINTAX)
-- IFU + RCCM émetteur, régime fiscal, IFU client, NFN, code contrôle

ALTER TABLE entreprises
    ADD COLUMN IF NOT EXISTS ifu           VARCHAR(20),
    ADD COLUMN IF NOT EXISTS rccm          VARCHAR(50),
    ADD COLUMN IF NOT EXISTS regime_fiscal VARCHAR(10) DEFAULT 'RNI';

COMMENT ON COLUMN entreprises.ifu           IS 'Identifiant Financier Unique (DGI BF)';
COMMENT ON COLUMN entreprises.rccm          IS 'Registre du Commerce et du Crédit Mobilier';
COMMENT ON COLUMN entreprises.regime_fiscal IS 'RNI | RSI | CME';

ALTER TABLE tiers
    ADD COLUMN IF NOT EXISTS ifu VARCHAR(20);

COMMENT ON COLUMN tiers.ifu IS 'IFU du tiers (client B2B, DGI BF)';

ALTER TABLE factures
    ADD COLUMN IF NOT EXISTS nfn                   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS code_controle         VARCHAR(100),
    ADD COLUMN IF NOT EXISTS statut_normalisation  VARCHAR(30) NOT NULL DEFAULT 'NON_NORMALISEE',
    ADD COLUMN IF NOT EXISTS est_normalisee        BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS ifu_client            VARCHAR(20);

COMMENT ON COLUMN factures.nfn                  IS 'Numéro Unique Facture Normalisée (eSINTAX/DGI)';
COMMENT ON COLUMN factures.code_controle        IS 'Signature électronique (eSINTAX/DGI)';
COMMENT ON COLUMN factures.statut_normalisation IS 'NON_NORMALISEE | EN_ATTENTE | NORMALISEE';
COMMENT ON COLUMN factures.est_normalisee       IS 'true si NFN + code_controle reçus de eSINTAX';
COMMENT ON COLUMN factures.ifu_client           IS 'IFU du client (B2B — optionnel)';
