-- V43 : Indexes de performance pour la production

-- Filtrage des écritures par statut et journal (requêtes fréquentes)
CREATE INDEX IF NOT EXISTS idx_ecritures_statut
    ON ecritures_comptables(entreprise_id, statut);

CREATE INDEX IF NOT EXISTS idx_ecritures_journal
    ON ecritures_comptables(entreprise_id, journal);

-- Requêtes analytiques sur les lignes d'écriture (colonne ajoutée en V10)
CREATE INDEX IF NOT EXISTS idx_lignes_axe_analytique
    ON lignes_ecriture(axe_analytique_id) WHERE axe_analytique_id IS NOT NULL;

-- Recherche des utilisateurs actifs
CREATE INDEX IF NOT EXISTS idx_utilisateurs_actifs
    ON utilisateurs(entreprise_id, actif) WHERE actif = TRUE;

-- Requêtes de lettrage sur plage de dates
CREATE INDEX IF NOT EXISTS idx_lignes_lettre_date
    ON lignes_ecriture(lettre_date) WHERE lettre IS NOT NULL;

-- Axes analytiques par entreprise
CREATE INDEX IF NOT EXISTS idx_axes_analytiques_tenant
    ON axes_analytiques(entreprise_id);

-- Comptes actifs par classe (requêtes balance/grand-livre)
CREATE INDEX IF NOT EXISTS idx_comptes_actifs_classe
    ON comptes_comptables(entreprise_id, classe, actif) WHERE actif = TRUE;
