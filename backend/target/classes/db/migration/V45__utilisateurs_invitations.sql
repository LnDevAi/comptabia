ALTER TABLE utilisateurs
    ADD COLUMN IF NOT EXISTS invite_token      VARCHAR(64),
    ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_utilisateurs_invite
    ON utilisateurs(invite_token) WHERE invite_token IS NOT NULL;
