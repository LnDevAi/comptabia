-- ═══════════════════════════════════════════════════════════════
-- V55 — GED : Gestion Électronique Documentaire
-- ═══════════════════════════════════════════════════════════════

-- Types de documents personnalisables par entreprise
CREATE TABLE ged_types_documents (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    code          VARCHAR(50)  NOT NULL,
    libelle       VARCHAR(255) NOT NULL,
    description   TEXT,
    actif         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(entreprise_id, code)
);

-- Tags libres par entreprise
CREATE TABLE ged_tags (
    id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    libelle       VARCHAR(100) NOT NULL,
    couleur       VARCHAR(20)  NOT NULL DEFAULT '#6B7280',
    UNIQUE(entreprise_id, libelle)
);

-- Documents GED (entités de premier rang)
CREATE TABLE ged_documents (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id     UUID         NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    type_document_id  UUID         REFERENCES ged_types_documents(id) ON DELETE SET NULL,
    titre             VARCHAR(500) NOT NULL,
    description       TEXT,
    statut            VARCHAR(20)  NOT NULL DEFAULT 'BROUILLON',
    type_entite       VARCHAR(30),
    entite_id         UUID,
    reference_externe VARCHAR(100),
    date_document     DATE,
    search_vector     TSVECTOR,
    created_by        UUID         REFERENCES utilisateurs(id) ON DELETE SET NULL,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Versions de fichiers liées à un document
CREATE TABLE ged_document_versions (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id    UUID         NOT NULL REFERENCES ged_documents(id) ON DELETE CASCADE,
    version_numero INTEGER      NOT NULL DEFAULT 1,
    nom_fichier    VARCHAR(255) NOT NULL,
    content_type   VARCHAR(100) NOT NULL,
    taille         BIGINT       NOT NULL,
    chemin         TEXT         NOT NULL,
    uploaded_by    UUID         REFERENCES utilisateurs(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(document_id, version_numero)
);

-- Association document ↔ tags (M2M)
CREATE TABLE ged_document_tags (
    document_id UUID NOT NULL REFERENCES ged_documents(id) ON DELETE CASCADE,
    tag_id      UUID NOT NULL REFERENCES ged_tags(id) ON DELETE CASCADE,
    PRIMARY KEY (document_id, tag_id)
);

-- Historique des transitions de statut (workflow)
CREATE TABLE ged_workflow_history (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID        NOT NULL REFERENCES ged_documents(id) ON DELETE CASCADE,
    statut_avant VARCHAR(20),
    statut_apres VARCHAR(20) NOT NULL,
    commentaire  TEXT,
    fait_par     UUID        REFERENCES utilisateurs(id) ON DELETE SET NULL,
    fait_le      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Journal d'audit immuable (pas de FK → conserver l'historique après suppression)
CREATE TABLE ged_audit_log (
    id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID         NOT NULL,
    document_id     UUID         NOT NULL,
    action          VARCHAR(50)  NOT NULL,
    details         TEXT,
    fait_par_email  VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── Index ────────────────────────────────────────────────────────────────────
CREATE INDEX idx_ged_docs_entreprise  ON ged_documents(entreprise_id);
CREATE INDEX idx_ged_docs_statut      ON ged_documents(entreprise_id, statut);
CREATE INDEX idx_ged_docs_type        ON ged_documents(entreprise_id, type_document_id);
CREATE INDEX idx_ged_docs_entite      ON ged_documents(entreprise_id, type_entite, entite_id);
CREATE INDEX idx_ged_docs_created     ON ged_documents(entreprise_id, created_at DESC);
CREATE INDEX idx_ged_docs_search      ON ged_documents USING GIN(search_vector);
CREATE INDEX idx_ged_versions_doc     ON ged_document_versions(document_id, version_numero);
CREATE INDEX idx_ged_workflow_doc     ON ged_workflow_history(document_id);
CREATE INDEX idx_ged_audit_ent        ON ged_audit_log(entreprise_id, created_at DESC);
CREATE INDEX idx_ged_audit_doc        ON ged_audit_log(document_id);
CREATE INDEX idx_ged_types_ent        ON ged_types_documents(entreprise_id);
CREATE INDEX idx_ged_tags_ent         ON ged_tags(entreprise_id);

-- ─── FTS trigger ──────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION ged_documents_search_update() RETURNS trigger AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('french', coalesce(NEW.titre, '')), 'A') ||
        setweight(to_tsvector('french', coalesce(NEW.description, '')), 'B') ||
        setweight(to_tsvector('french', coalesce(NEW.reference_externe, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ged_documents_search_trigger
    BEFORE INSERT OR UPDATE OF titre, description, reference_externe
    ON ged_documents
    FOR EACH ROW EXECUTE FUNCTION ged_documents_search_update();
