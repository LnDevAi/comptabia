-- V44 : Authentification à deux facteurs (TOTP)
ALTER TABLE utilisateurs
    ADD COLUMN totp_secret  VARCHAR(64),
    ADD COLUMN totp_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_utilisateurs_totp ON utilisateurs(totp_enabled) WHERE totp_enabled = TRUE;
