ALTER TABLE lignes_ecriture ADD COLUMN lettre VARCHAR(5);
ALTER TABLE lignes_ecriture ADD COLUMN lettre_date DATE;

CREATE INDEX idx_lignes_lettre ON lignes_ecriture(lettre) WHERE lettre IS NOT NULL;
