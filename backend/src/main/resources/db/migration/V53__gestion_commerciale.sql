-- Plans tarifaires eDefence
CREATE TABLE plans_tarifaires (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nom              VARCHAR(100) NOT NULL,
    code             VARCHAR(50)  NOT NULL UNIQUE,
    description      TEXT,
    prix_mensuel     DECIMAL(10,2) NOT NULL DEFAULT 0,
    prix_annuel      DECIMAL(10,2) NOT NULL DEFAULT 0,
    modules          TEXT         NOT NULL DEFAULT '',  -- virgule-séparé LicenceModule
    max_utilisateurs INT          NOT NULL DEFAULT 5,
    actif            BOOLEAN      NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Abonnements clients eDefence
CREATE TABLE abonnements_clients (
    id                          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_entreprise              VARCHAR(200) NOT NULL,
    email_contact               VARCHAR(200),
    telephone                   VARCHAR(50),
    pays                        VARCHAR(100),
    plan_id                     UUID         REFERENCES plans_tarifaires(id) ON DELETE SET NULL,
    statut                      VARCHAR(30)  NOT NULL DEFAULT 'ESSAI',
    periodicite                 VARCHAR(20)  NOT NULL DEFAULT 'MENSUEL',
    date_debut                  DATE         NOT NULL DEFAULT CURRENT_DATE,
    date_fin                    DATE,
    date_prochain_renouvellement DATE,
    montant_actuel              DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Factures d'abonnements
CREATE TABLE factures_abonnements (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    numero         VARCHAR(50)  NOT NULL UNIQUE,
    abonnement_id  UUID         NOT NULL REFERENCES abonnements_clients(id) ON DELETE CASCADE,
    periode_debut  DATE         NOT NULL,
    periode_fin    DATE         NOT NULL,
    montant_ht     DECIMAL(10,2) NOT NULL,
    taux_tva       DECIMAL(5,2) NOT NULL DEFAULT 0,
    montant_ttc    DECIMAL(10,2) NOT NULL,
    statut         VARCHAR(30)  NOT NULL DEFAULT 'EN_ATTENTE',
    date_echeance  DATE         NOT NULL,
    date_paiement  DATE,
    notes          TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Paiements des factures
CREATE TABLE paiements_abonnements (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    facture_id      UUID         NOT NULL REFERENCES factures_abonnements(id) ON DELETE CASCADE,
    mode_paiement   VARCHAR(30)  NOT NULL DEFAULT 'VIREMENT',
    montant         DECIMAL(10,2) NOT NULL,
    date_paiement   DATE         NOT NULL,
    reference       VARCHAR(200),
    notes           TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Plans par défaut
INSERT INTO plans_tarifaires (nom, code, description, prix_mensuel, prix_annuel, modules, max_utilisateurs) VALUES
('Starter',    'STARTER',    'Comptabilité de base pour TPE',            15000,  150000,  'COMPTABILITE,TIERS,IMMOBILISATIONS,EXPORT,DOCUMENTS', 3),
('Pro',        'PRO',        'Comptabilité + Fiscal + Facturation',      35000,  350000,  'COMPTABILITE,TIERS,IMMOBILISATIONS,FISCAL,BUDGET,TRESORERIE,FACTURATION,EXPORT,DOCUMENTS,GOUVERNANCE', 10),
('Business',   'BUSINESS',   'Pro + RH + Pilotage + CRM',               65000,  650000,  'COMPTABILITE,TIERS,IMMOBILISATIONS,FISCAL,BUDGET,TRESORERIE,FACTURATION,EXPORT,DOCUMENTS,PAIE_RH,CRM,PILOTAGE,AUDIT,GOUVERNANCE', 25),
('Enterprise', 'ENTERPRISE', 'Suite complète tous modules + IA',         99000,  990000,  'COMPTABILITE,TIERS,IMMOBILISATIONS,FISCAL,BUDGET,TRESORERIE,FACTURATION,EXPORT,DOCUMENTS,PAIE_RH,CRM,IA,CONSOLIDATION,AUDIT,PILOTAGE,ASSURANCE,MICROFINANCE,FINANCE_ISLAMIQUE,GOUVERNANCE', 99);
