ALTER TABLE axes_analytiques
    ADD COLUMN type           VARCHAR(20)   NOT NULL DEFAULT 'AUTRE',
    ADD COLUMN montant_budget NUMERIC(15,2);

ALTER TABLE axes_analytiques
    ADD CONSTRAINT chk_axe_type CHECK (type IN ('PROJET','BAILLEUR','ACTIVITE','CENTRE_COUT','AUTRE'));
