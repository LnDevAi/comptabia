-- ═══════════════════════════════════════════════════════════════
-- V56 — Trésorerie Avancée : comptes, mouvements, alertes
-- ═══════════════════════════════════════════════════════════════

-- Comptes bancaires gérés par l'entreprise
CREATE TABLE comptes_bancaires (
    id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id           UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    libelle                 VARCHAR(255)  NOT NULL,
    banque                  VARCHAR(100),
    iban                    VARCHAR(34),
    bic                     VARCHAR(11),
    compte_comptable_numero VARCHAR(20),
    type_compte             VARCHAR(20)   NOT NULL DEFAULT 'COURANT',
    solde_reel              NUMERIC(18,2) NOT NULL DEFAULT 0,
    solde_date              DATE,
    seuil_alerte            NUMERIC(18,2) NOT NULL DEFAULT 0,
    actif                   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at              TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Mouvements de trésorerie (virements inter-comptes, dépôts, retraits…)
CREATE TABLE tresorerie_mouvements (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    compte_id       UUID          NOT NULL REFERENCES comptes_bancaires(id) ON DELETE CASCADE,
    compte_dest_id  UUID          REFERENCES comptes_bancaires(id) ON DELETE SET NULL,
    type_mouvement  VARCHAR(30)   NOT NULL,
    libelle         VARCHAR(500)  NOT NULL,
    montant         NUMERIC(18,2) NOT NULL,
    date_operation  DATE          NOT NULL,
    reference       VARCHAR(100),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Alertes de solde
CREATE TABLE tresorerie_alertes (
    id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID          NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    compte_id       UUID          NOT NULL REFERENCES comptes_bancaires(id) ON DELETE CASCADE,
    type_alerte     VARCHAR(30)   NOT NULL,
    message         TEXT          NOT NULL,
    solde_constate  NUMERIC(18,2),
    acquittee       BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─── Index ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_comptes_bancaires_ent   ON comptes_bancaires(entreprise_id, actif);
CREATE INDEX idx_treso_mvt_ent_date      ON tresorerie_mouvements(entreprise_id, date_operation DESC);
CREATE INDEX idx_treso_mvt_compte        ON tresorerie_mouvements(compte_id, date_operation DESC);
CREATE INDEX idx_treso_alertes_ent       ON tresorerie_alertes(entreprise_id, acquittee, created_at DESC);
CREATE INDEX idx_treso_alertes_compte    ON tresorerie_alertes(compte_id);
