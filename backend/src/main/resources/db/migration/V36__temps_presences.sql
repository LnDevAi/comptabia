-- V36 : Gestion des temps & présences

CREATE TABLE pointages (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id    UUID NOT NULL REFERENCES entreprises(id),
    collaborateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    date_pointage    DATE NOT NULL,
    heure_arrivee    TIME NOT NULL,
    heure_depart     TIME,
    heures_travaillees DECIMAL(4,2),
    type             VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (entreprise_id, collaborateur_id, date_pointage)
);

CREATE TABLE absences (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id    UUID NOT NULL REFERENCES entreprises(id),
    collaborateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    date_debut       DATE NOT NULL,
    date_fin         DATE NOT NULL,
    type_absence     VARCHAR(30) NOT NULL DEFAULT 'AUTRE',
    justificatif     BOOLEAN NOT NULL DEFAULT false,
    notes            TEXT,
    statut           VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_pointages_entreprise_mois ON pointages(entreprise_id, date_pointage);
CREATE INDEX idx_pointages_collaborateur   ON pointages(collaborateur_id, date_pointage);
CREATE INDEX idx_absences_entreprise       ON absences(entreprise_id, date_debut);
