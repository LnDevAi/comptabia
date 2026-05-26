-- V37 : Recrutement & Onboarding

CREATE TABLE offres_emploi (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id),
    titre           VARCHAR(200) NOT NULL,
    departement     VARCHAR(100),
    description     TEXT,
    type_contrat    VARCHAR(20) NOT NULL DEFAULT 'CDI',
    nb_postes       INT NOT NULL DEFAULT 1,
    statut          VARCHAR(20) NOT NULL DEFAULT 'OUVERTE',
    date_ouverture  DATE,
    date_cloture    DATE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE candidatures (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id    UUID NOT NULL REFERENCES entreprises(id),
    offre_id         UUID REFERENCES offres_emploi(id),
    nom_candidat     VARCHAR(200) NOT NULL,
    email_candidat   VARCHAR(255),
    telephone        VARCHAR(50),
    statut           VARCHAR(20) NOT NULL DEFAULT 'RECUE',
    notes            TEXT,
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE onboarding_plans (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id    UUID NOT NULL REFERENCES entreprises(id),
    collaborateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    titre            VARCHAR(200) NOT NULL DEFAULT 'Plan d''onboarding',
    date_embauche    DATE,
    statut           VARCHAR(20) NOT NULL DEFAULT 'EN_COURS',
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE onboarding_taches (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id     UUID NOT NULL REFERENCES onboarding_plans(id) ON DELETE CASCADE,
    titre       VARCHAR(255) NOT NULL,
    description TEXT,
    categorie   VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    ordre       INT NOT NULL DEFAULT 0,
    terminee    BOOLEAN NOT NULL DEFAULT false,
    date_limite DATE,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_candidatures_offre     ON candidatures(offre_id);
CREATE INDEX idx_candidatures_statut    ON candidatures(entreprise_id, statut);
CREATE INDEX idx_onboarding_collab      ON onboarding_plans(collaborateur_id);
