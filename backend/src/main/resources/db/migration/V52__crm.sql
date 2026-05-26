CREATE TABLE IF NOT EXISTS crm_contacts (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom             VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    telephone       VARCHAR(50),
    societe         VARCHAR(255),
    poste           VARCHAR(100),
    source          VARCHAR(30)  DEFAULT 'MANUEL',
    tags            TEXT,
    statut          VARCHAR(20)  NOT NULL DEFAULT 'ACTIF',
    score           INT          NOT NULL DEFAULT 0,
    notes           TEXT,
    tiers_id        UUID         REFERENCES tiers(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_leads (
    id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id         UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    contact_id            UUID          REFERENCES crm_contacts(id) ON DELETE SET NULL,
    titre                 VARCHAR(255)  NOT NULL,
    valeur                DECIMAL(19,4) NOT NULL DEFAULT 0,
    probabilite           INT           NOT NULL DEFAULT 0 CHECK (probabilite >= 0 AND probabilite <= 100),
    etape                 VARCHAR(30)   NOT NULL DEFAULT 'NOUVEAU',
    date_cloture_prevue   DATE,
    produit               VARCHAR(100),
    notes                 TEXT,
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_activites (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID        NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    lead_id         UUID        REFERENCES crm_leads(id) ON DELETE CASCADE,
    contact_id      UUID        REFERENCES crm_contacts(id) ON DELETE SET NULL,
    type            VARCHAR(20) NOT NULL,
    contenu         TEXT,
    date_activite   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    auteur_id       UUID        REFERENCES utilisateurs(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_templates (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom             VARCHAR(255) NOT NULL,
    type            VARCHAR(10)  NOT NULL,
    sujet           VARCHAR(255),
    contenu         TEXT         NOT NULL,
    variables       TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_campagnes (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id         UUID        NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    template_id           UUID        REFERENCES crm_templates(id) ON DELETE SET NULL,
    nom                   VARCHAR(255) NOT NULL,
    type                  VARCHAR(10)  NOT NULL,
    sujet                 VARCHAR(255),
    contenu               TEXT         NOT NULL,
    statut                VARCHAR(20)  NOT NULL DEFAULT 'BROUILLON',
    date_envoi_planifie   TIMESTAMPTZ,
    date_envoi_reel       TIMESTAMPTZ,
    nb_destinataires      INT          NOT NULL DEFAULT 0,
    nb_envoyes            INT          NOT NULL DEFAULT 0,
    nb_ouverts            INT          NOT NULL DEFAULT 0,
    nb_cliques            INT          NOT NULL DEFAULT 0,
    nb_echecs             INT          NOT NULL DEFAULT 0,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_destinataires (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    campagne_id     UUID         NOT NULL REFERENCES crm_campagnes(id) ON DELETE CASCADE,
    contact_id      UUID         REFERENCES crm_contacts(id) ON DELETE SET NULL,
    nom             VARCHAR(255),
    email           VARCHAR(255),
    telephone       VARCHAR(50),
    statut          VARCHAR(20)  NOT NULL DEFAULT 'EN_ATTENTE',
    erreur          TEXT,
    sent_at         TIMESTAMPTZ,
    opened_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_contacts_entreprise ON crm_contacts(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_entreprise    ON crm_leads(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_crm_activites_lead      ON crm_activites(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_campagnes_entreprise ON crm_campagnes(entreprise_id);
CREATE INDEX IF NOT EXISTS idx_crm_destinataires_camp  ON crm_destinataires(campagne_id);
