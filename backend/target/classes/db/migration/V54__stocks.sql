-- ─────────────────────────────────────────────────────────────────────────────
-- V54 : Module Gestion des Stocks
-- Articles + Mouvements + Dépôts
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE depots_stock (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    code          VARCHAR(20) NOT NULL,
    nom           VARCHAR(100) NOT NULL,
    adresse       TEXT,
    actif         BOOLEAN     NOT NULL DEFAULT TRUE,
    entreprise_id UUID        NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (entreprise_id, code)
);

CREATE TABLE articles_stock (
    id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    code                  VARCHAR(20)  NOT NULL,
    designation           VARCHAR(255) NOT NULL,
    description           TEXT,
    categorie             VARCHAR(30)  NOT NULL,
    unite_mesure          VARCHAR(20)  NOT NULL DEFAULT 'UNITE',
    prix_unitaire         DECIMAL(15,4) NOT NULL DEFAULT 0,
    cout_moyen            DECIMAL(15,4) NOT NULL DEFAULT 0,
    stock_min             DECIMAL(15,4) NOT NULL DEFAULT 0,
    stock_max             DECIMAL(15,4),
    stock_actuel          DECIMAL(15,4) NOT NULL DEFAULT 0,
    compte_stock_numero   VARCHAR(20),
    compte_charge_numero  VARCHAR(20),
    methode_evaluation    VARCHAR(10)  NOT NULL DEFAULT 'CMUP',
    actif                 BOOLEAN      NOT NULL DEFAULT TRUE,
    notes                 TEXT,
    entreprise_id         UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (entreprise_id, code)
);

CREATE TABLE mouvements_stock (
    id               UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    article_id       UUID          NOT NULL REFERENCES articles_stock(id) ON DELETE CASCADE,
    depot_id         UUID          REFERENCES depots_stock(id),
    type_mouvement   VARCHAR(20)   NOT NULL,
    quantite         DECIMAL(15,4) NOT NULL,
    prix_unitaire    DECIMAL(15,4) NOT NULL,
    montant          DECIMAL(15,2) NOT NULL,
    cout_moyen_apres DECIMAL(15,4),
    reference        VARCHAR(100),
    libelle          VARCHAR(255),
    date_mouvement   DATE          NOT NULL,
    ecriture_id      UUID,
    entreprise_id    UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_articles_stock_entreprise ON articles_stock(entreprise_id);
CREATE INDEX idx_articles_stock_categorie  ON articles_stock(entreprise_id, categorie);
CREATE INDEX idx_mouvements_stock_article  ON mouvements_stock(article_id);
CREATE INDEX idx_mouvements_stock_ent_date ON mouvements_stock(entreprise_id, date_mouvement);
CREATE INDEX idx_depots_entreprise         ON depots_stock(entreprise_id);

-- Dépôt principal par défaut inséré automatiquement pour chaque future entreprise
-- (optionnel, géré applicativement)
