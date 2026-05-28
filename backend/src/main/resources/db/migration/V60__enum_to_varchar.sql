-- Convertit les colonnes de type ENUM PostgreSQL natif en VARCHAR
-- Hibernate utilise @Enumerated(EnumType.STRING) qui insère du VARCHAR ;
-- PostgreSQL refusait le cast implicite VARCHAR → type ENUM.
-- Les defaults ENUM doivent être supprimés avant la conversion puis restaurés en VARCHAR.

ALTER TABLE entreprises ALTER COLUMN plan DROP DEFAULT;
ALTER TABLE entreprises ALTER COLUMN plan TYPE VARCHAR(20) USING plan::TEXT;
ALTER TABLE entreprises ALTER COLUMN plan SET DEFAULT 'FREE';

ALTER TABLE utilisateurs ALTER COLUMN role DROP DEFAULT;
ALTER TABLE utilisateurs ALTER COLUMN role TYPE VARCHAR(20) USING role::TEXT;
ALTER TABLE utilisateurs ALTER COLUMN role SET DEFAULT 'COMPTABLE';

ALTER TABLE ecritures_comptables ALTER COLUMN journal TYPE VARCHAR(20) USING journal::TEXT;
ALTER TABLE ecritures_comptables ALTER COLUMN statut DROP DEFAULT;
ALTER TABLE ecritures_comptables ALTER COLUMN statut TYPE VARCHAR(20) USING statut::TEXT;
ALTER TABLE ecritures_comptables ALTER COLUMN statut SET DEFAULT 'BROUILLON';

-- Suppression des types ENUM devenus inutiles (CASCADE pour les éventuels defaults résiduels)
DROP TYPE IF EXISTS plan_type CASCADE;
DROP TYPE IF EXISTS role_utilisateur CASCADE;
DROP TYPE IF EXISTS type_journal CASCADE;
DROP TYPE IF EXISTS statut_ecriture CASCADE;
