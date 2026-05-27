-- Souscriptions SaaS (paiements CinetPay, Stripe, Virement)
CREATE TABLE souscriptions_saas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id       UUID NOT NULL REFERENCES entreprises(id),
    plan_code           VARCHAR(50) NOT NULL,
    periodicite         VARCHAR(20) NOT NULL DEFAULT 'MENSUEL',
    montant             NUMERIC(12,2) NOT NULL,
    mode_paiement       VARCHAR(30) NOT NULL,
    statut              VARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    transaction_id      VARCHAR(200),
    payment_url         TEXT,
    reference_virement  VARCHAR(200),
    stripe_session_id   VARCHAR(300),
    customer_name       VARCHAR(200),
    customer_email      VARCHAR(200),
    date_debut          DATE,
    date_fin            DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at        TIMESTAMPTZ
);

CREATE INDEX idx_souscriptions_saas_entreprise ON souscriptions_saas(entreprise_id);
CREATE INDEX idx_souscriptions_saas_statut ON souscriptions_saas(statut);
CREATE INDEX idx_souscriptions_saas_transaction ON souscriptions_saas(transaction_id);
CREATE INDEX idx_souscriptions_saas_stripe ON souscriptions_saas(stripe_session_id);

-- Colonnes abonnement SaaS sur entreprises
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS plan_expiration DATE;
ALTER TABLE entreprises ADD COLUMN IF NOT EXISTS statut_abonnement VARCHAR(20) NOT NULL DEFAULT 'TRIAL';

-- Seed plans tarifaires
INSERT INTO plans_tarifaires (id, nom, code, description, prix_mensuel, prix_annuel, modules, max_utilisateurs, actif, created_at)
SELECT gen_random_uuid(), 'Starter', 'STARTER',
       'Idéal pour les petites entreprises — jusqu''à 5 utilisateurs',
       15000, 150000,
       'comptabilite,tiers,ecritures,etats,tva',
       5, true, now()
WHERE NOT EXISTS (SELECT 1 FROM plans_tarifaires WHERE code = 'STARTER');

INSERT INTO plans_tarifaires (id, nom, code, description, prix_mensuel, prix_annuel, modules, max_utilisateurs, actif, created_at)
SELECT gen_random_uuid(), 'Pro', 'PRO',
       'Pour les entreprises en croissance — jusqu''à 20 utilisateurs',
       35000, 350000,
       'comptabilite,tiers,ecritures,etats,tva,paie,rh,facturation,immobilisations,analytique,budget,stocks',
       20, true, now()
WHERE NOT EXISTS (SELECT 1 FROM plans_tarifaires WHERE code = 'PRO');

INSERT INTO plans_tarifaires (id, nom, code, description, prix_mensuel, prix_annuel, modules, max_utilisateurs, actif, created_at)
SELECT gen_random_uuid(), 'Enterprise', 'ENTERPRISE',
       'Solution complète multi-utilisateurs sans limite',
       75000, 750000,
       'all',
       1000, true, now()
WHERE NOT EXISTS (SELECT 1 FROM plans_tarifaires WHERE code = 'ENTERPRISE');
