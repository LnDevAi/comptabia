ALTER TABLE notes_annexes ADD COLUMN numero_note INTEGER;

CREATE UNIQUE INDEX uq_notes_numero_tenant_exercice
    ON notes_annexes(entreprise_id, exercice, numero_note)
    WHERE numero_note IS NOT NULL;
