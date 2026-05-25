CREATE TABLE audit_events (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID          NOT NULL,
    user_email    VARCHAR(255)  NOT NULL,
    action        VARCHAR(60)   NOT NULL,
    entity_type   VARCHAR(50)   NOT NULL,
    entity_ref    VARCHAR(100),
    details       TEXT,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_tenant_date ON audit_events(entreprise_id, created_at DESC);
CREATE INDEX idx_audit_action      ON audit_events(entreprise_id, action);
