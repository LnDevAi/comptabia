-- Registre des associés / actionnaires
CREATE TABLE IF NOT EXISTS associes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    nom             VARCHAR(255) NOT NULL,
    prenom          VARCHAR(255),
    email           VARCHAR(255),
    telephone       VARCHAR(50),
    type_associe    VARCHAR(30) NOT NULL DEFAULT 'ASSOCIE',
    apport          DECIMAL(19,4) NOT NULL DEFAULT 0,
    pourcentage     DECIMAL(7,4) NOT NULL DEFAULT 0,
    date_entree     DATE,
    date_sortie     DATE,
    actif           BOOLEAN NOT NULL DEFAULT TRUE,
    token_portail   UUID UNIQUE DEFAULT gen_random_uuid(),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Assemblées générales et conseils d'administration
CREATE TABLE IF NOT EXISTS assemblees_generales (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    type_assemblee  VARCHAR(30) NOT NULL DEFAULT 'AG_ORDINAIRE',
    titre           VARCHAR(255) NOT NULL,
    date_assemblee  DATE NOT NULL,
    lieu            VARCHAR(255),
    exercice_concerne INT,
    quorum_requis   DECIMAL(5,2),
    quorum_atteint  DECIMAL(5,2),
    statut          VARCHAR(20) NOT NULL DEFAULT 'PLANIFIEE',
    ordre_du_jour   TEXT,
    proces_verbal   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Résolutions adoptées lors des assemblées
CREATE TABLE IF NOT EXISTS resolutions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assemblee_id    UUID NOT NULL REFERENCES assemblees_generales(id) ON DELETE CASCADE,
    numero_ordre    INT NOT NULL DEFAULT 1,
    titre           VARCHAR(500) NOT NULL,
    texte           TEXT,
    type_resolution VARCHAR(40) NOT NULL DEFAULT 'AUTRE',
    statut          VARCHAR(20) NOT NULL DEFAULT 'EN_ATTENTE',
    votes_pour      INT NOT NULL DEFAULT 0,
    votes_contre    INT NOT NULL DEFAULT 0,
    votes_abstention INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_associes_entreprise     ON associes(entreprise_id);
CREATE INDEX idx_associes_token          ON associes(token_portail);
CREATE INDEX idx_assemblees_entreprise   ON assemblees_generales(entreprise_id);
CREATE INDEX idx_resolutions_assemblee   ON resolutions(assemblee_id);
