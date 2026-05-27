-- V1__init.sql : Schéma initial e-compta-ia-inter

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Plans d'abonnement
CREATE TYPE plan_type AS ENUM ('FREE', 'PRO', 'ENTERPRISE');

-- Rôles utilisateur
CREATE TYPE role_utilisateur AS ENUM ('ADMIN', 'COMPTABLE', 'LECTEUR');

-- Journal comptable
CREATE TYPE type_journal AS ENUM ('AC', 'BQ', 'OD', 'VT');

-- Statut écriture
CREATE TYPE statut_ecriture AS ENUM ('BROUILLON', 'VALIDEE', 'CLOTUREE');

-- Entreprises (tenants)
CREATE TABLE entreprises (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom           VARCHAR(255) NOT NULL,
  pays          VARCHAR(100) NOT NULL DEFAULT 'BF',
  nif           VARCHAR(50),
  plan          plan_type NOT NULL DEFAULT 'FREE',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Utilisateurs
CREATE TABLE utilisateurs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom               VARCHAR(255) NOT NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe_hash VARCHAR(255) NOT NULL,
  role              role_utilisateur NOT NULL DEFAULT 'COMPTABLE',
  entreprise_id     UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  actif             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_utilisateurs_entreprise ON utilisateurs(entreprise_id);

-- Plan de comptes (SYSCOHADA)
CREATE TABLE comptes_comptables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero        VARCHAR(20) NOT NULL,
  intitule      VARCHAR(255) NOT NULL,
  classe        SMALLINT NOT NULL CHECK (classe BETWEEN 1 AND 9),
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  actif         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (numero, entreprise_id)
);

CREATE INDEX idx_comptes_entreprise ON comptes_comptables(entreprise_id);
CREATE INDEX idx_comptes_classe ON comptes_comptables(classe, entreprise_id);

-- Écritures comptables
CREATE TABLE ecritures_comptables (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_piece  VARCHAR(50) NOT NULL,
  date_ecriture DATE NOT NULL,
  libelle       VARCHAR(500) NOT NULL,
  journal       type_journal NOT NULL,
  statut        statut_ecriture NOT NULL DEFAULT 'BROUILLON',
  entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
  created_by    UUID NOT NULL REFERENCES utilisateurs(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (numero_piece, entreprise_id)
);

CREATE INDEX idx_ecritures_entreprise ON ecritures_comptables(entreprise_id);
CREATE INDEX idx_ecritures_date ON ecritures_comptables(date_ecriture, entreprise_id);

-- Lignes d'écriture (partie double)
CREATE TABLE lignes_ecriture (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ecriture_id UUID NOT NULL REFERENCES ecritures_comptables(id) ON DELETE CASCADE,
  compte_id   UUID NOT NULL REFERENCES comptes_comptables(id),
  libelle     VARCHAR(500),
  debit       NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  credit      NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  CONSTRAINT chk_debit_credit CHECK (
    (debit >= 0 AND credit = 0) OR (credit >= 0 AND debit = 0)
  )
);

CREATE INDEX idx_lignes_ecriture ON lignes_ecriture(ecriture_id);
CREATE INDEX idx_lignes_compte ON lignes_ecriture(compte_id);
