CREATE TABLE pieces_jointes (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id  UUID        NOT NULL REFERENCES entreprises(id),
    type_entite    VARCHAR(20) NOT NULL,   -- ECRITURE | FACTURE | DEVIS
    entite_id      UUID        NOT NULL,
    nom_fichier    VARCHAR(255) NOT NULL,
    content_type   VARCHAR(100) NOT NULL,
    taille         BIGINT      NOT NULL,
    chemin         TEXT        NOT NULL,
    uploaded_by    UUID        REFERENCES utilisateurs(id),
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pj_entite ON pieces_jointes(entreprise_id, type_entite, entite_id);
