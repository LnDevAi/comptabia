-- Règles d'alerte configurables par entreprise
CREATE TABLE notification_rules (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id     UUID         NOT NULL,
    type              VARCHAR(60)  NOT NULL,
    libelle           VARCHAR(150) NOT NULL,
    seuil             NUMERIC(18,2),
    enabled           BOOLEAN      NOT NULL DEFAULT TRUE,
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (entreprise_id, type)
);
CREATE INDEX idx_notif_rules_tenant ON notification_rules(entreprise_id);

-- Historique persistant des notifications envoyées
CREATE TABLE notifications_history (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID         NOT NULL,
    type          VARCHAR(60)  NOT NULL,
    message       TEXT         NOT NULL,
    severity      VARCHAR(10)  NOT NULL DEFAULT 'INFO',
    link          VARCHAR(200),
    lu            BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notif_hist_tenant ON notifications_history(entreprise_id, created_at DESC);
CREATE INDEX idx_notif_hist_unread  ON notifications_history(entreprise_id, lu) WHERE lu = FALSE;

-- Règles par défaut insérées à la création de chaque entreprise via application
