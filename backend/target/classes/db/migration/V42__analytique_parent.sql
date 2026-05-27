ALTER TABLE axes_analytiques
    ADD COLUMN parent_id UUID REFERENCES axes_analytiques(id) ON DELETE SET NULL;

CREATE INDEX idx_axe_parent ON axes_analytiques(parent_id);
