# Historique des migrations de base de données

Toutes les migrations sont gérées par **Flyway**. Ce document centralise la liste et le contexte de chaque version pour faciliter les diagnostics et les audits.

> **Règle absolue :** ne jamais modifier un script déjà appliqué en production.
> En cas d'erreur → créer une migration corrective `V{N+1}`.

---

## Migrations appliquées

| Version | Fichier | Description |
|---------|---------|-------------|
| V1 | `V1__init.sql` | Schéma initial : `entreprises`, `utilisateurs`, `plan_comptable`, `journaux`, `ecritures_comptables` |
| V2 | `V2__exercices.sql` | Table `exercices`, liaison exercice → écritures |
| V3 | `V3__tiers.sql` | Table `tiers` (clients/fournisseurs) |
| V4 | `V4__licences.sql` | Tables `licences`, `abonnements`, `paiements` |
| V5 | `V5__alertes.sql` | Table `alertes` et `regles_alerte` |
| V6 | `V6__notifications.sql` | Table `notifications` pour SSE |
| V7 | `V7__immobilisations.sql` | Tables `immobilisations`, `amortissements` |
| V8 | `V8__budget.sql` | Table `lignes_budget` |
| V9 | `V9__rapprochement.sql` | Table `rapprochements_bancaires`, `lignes_rapprochement` |
| V10 | `V10__analytique.sql` | Tables `axes_analytiques`, `codes_analytiques` |
| V11 | `V11__modeles.sql` | Table `modeles_ecritures` |
| V12 | `V12__tva.sql` | Table `declarations_tva` |
| V13 | `V13__etats_config.sql` | Configuration des états financiers personnalisables |
| V14 | `V14__lettrage.sql` | Colonnes `lettre` sur `lignes_ecriture` |
| V15 | `V15__audit.sql` | Table `audit_logs` |
| V16 | `V16__facturation.sql` | Tables `factures`, `lignes_facture`, `devis` |
| V17 | `V17__rh_base.sql` | Tables `employes`, `contrats`, `bulletins_paie` |
| V18 | `V18__conges.sql` | Tables `demandes_conge`, `types_conge` |
| V19 | `V19__notes_frais.sql` | Table `notes_frais`, `lignes_note_frais` |
| V20 | `V20__recrutement.sql` | Tables `offres_emploi`, `candidatures` |
| V21 | `V21__formation.sql` | Tables `plans_formation`, `sessions_formation` |
| V22 | `V22__evaluations.sql` | Tables `evaluations`, `objectifs` |
| V23 | `V23__discipline.sql` | Table `sanctions_disciplinaires` |
| V24 | `V24__temps_presences.sql` | Table `pointages` |
| V25 | `V25__consolidation.sql` | Tables `groupes_consolidation`, `eliminations` |
| V26 | `V26__documents.sql` | Table `documents_ged`, `categories_document` |
| V27 | `V27__devises.sql` | Tables `devises`, `taux_change` |
| V28 | `V28__relances.sql` | Tables `modeles_relance`, `relances_envoyees` |
| V29 | `V29__regularisations.sql` | Table `ecritures_regularisation` |
| V30 | `V30__abonnements_compta.sql` | Table `abonnements_comptables` (écritures récurrentes) |
| V31 | `V31__crm.sql` | Tables `opportunites`, `contacts_crm`, `activites_crm` |
| V32 | `V32__stocks.sql` | Tables `articles`, `mouvements_stock`, `inventaires` |
| V33 | `V33__kpi.sql` | Table `kpi_config`, vues matérialisées KPI |
| V34 | `V34__pilotage.sql` | Tables `tableaux_pilotage`, `widgets_pilotage` |
| V35 | `V35__approbations.sql` | Tables `workflows_approbation`, `etapes_approbation` |
| V36 | `V36__portail_associe.sql` | Tables `portails_associes`, `tokens_portail` |
| V37 | `V37__assurance.sql` | Tables `polices_assurance`, `provisions_techniques` |
| V38 | `V38__sfd.sql` | Tables `credits_sfd`, `portefeuille_sfd` |
| V39 | `V39__finance_islamique.sql` | Tables `contrats_islamiques` (Mourabaha, Ijara…) |
| V40 | `V40__gouvernance.sql` | Tables `assemblees`, `resolutions`, `mandats` |
| V41 | `V41__liasse_fiscale.sql` | Tables `liasses_fiscales`, `lignes_liasse` |
| V42 | `V42__is_declaration.sql` | Table `declarations_is`, `reintegrations` |
| V43 | `V43__notes_annexes.sql` | Table `notes_annexes_fiscales` |
| V44 | `V44__paie_cotisations.sql` | Tables `cotisations_sociales`, `taux_cotisation` |
| V45 | `V45__previsions_treso.sql` | Table `previsions_tresorerie` |
| V46 | `V46__reporting.sql` | Table `rapports_personnalises` |
| V47 | `V47__invitations.sql` | Table `invitations_utilisateurs` |
| V48 | `V48__parametres.sql` | Table `parametres_entreprise` (clé-valeur) |
| V49 | `V49__plan_rh.sql` | Tables `postes`, `organigramme` |
| V50 | `V50__prets.sql` | Table `prets_employes` |
| V51 | `V51__academie.sql` | Tables `cours`, `inscriptions_academie` |
| V52 | `V52__commercial.sql` | Tables `opportunites_commerciales`, `pipelines` |
| V53 | `V53__portail_client.sql` | Tables `portails_client`, `sessions_portail` |
| V54 | `V54__balance_agee_config.sql` | Configuration des tranches balance âgée |
| V55 | `V55__gestion_fiscale.sql` | Tables `echeances_fiscales`, `calendrier_fiscal` |
| V56 | `V56__gestion_sociale.sql` | Tables `declarations_sociales`, `charges_patronales` |
| V57 | `V57__documents_rh.sql` | Table `documents_rh` (bulletins archivés, contrats) |
| V58 | `V58__documents_regl.sql` | Table `documents_reglementaires` |
| V59 | `V59__pilotage_global.sql` | Vue consolidée multi-entités |
| **V60** | `V60__enum_to_varchar.sql` | Migration ENUM → VARCHAR(20) sur `entreprises.plan`, `utilisateurs.role`, `ecritures_comptables.journal/statut` — résout l'incompatibilité Hibernate 6 / PostgreSQL ENUM natif |
| **V61** | `V61__import_migration.sql` | Table `import_historique` pour le module Import & Migration |

---

## Schéma des tables clés

### `entreprises`
```sql
id              UUID PRIMARY KEY
raison_sociale  VARCHAR(200) NOT NULL
ifu             VARCHAR(20)
rccm            VARCHAR(50)
plan            VARCHAR(20) NOT NULL DEFAULT 'FREE'  -- ← VARCHAR depuis V60
referentiel     VARCHAR(30) DEFAULT 'SYSCOHADA'
devise          VARCHAR(10) DEFAULT 'XOF'
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### `utilisateurs`
```sql
id              UUID PRIMARY KEY
entreprise_id   UUID NOT NULL REFERENCES entreprises(id)
email           VARCHAR(200) NOT NULL UNIQUE
password_hash   VARCHAR(200) NOT NULL
nom             VARCHAR(200) NOT NULL
role            VARCHAR(20) NOT NULL DEFAULT 'COMPTABLE'  -- ← VARCHAR depuis V60
actif           BOOLEAN NOT NULL DEFAULT true
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### `ecritures_comptables`
```sql
id              UUID PRIMARY KEY
entreprise_id   UUID NOT NULL REFERENCES entreprises(id)
exercice_id     UUID NOT NULL REFERENCES exercices(id)
journal         VARCHAR(20) NOT NULL   -- ← VARCHAR depuis V60
date_ecriture   DATE NOT NULL
numero_piece    VARCHAR(50)
libelle         VARCHAR(500)
statut          VARCHAR(20) NOT NULL DEFAULT 'BROUILLON'  -- ← VARCHAR depuis V60
created_by      UUID REFERENCES utilisateurs(id)
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

### `lignes_ecriture`
```sql
id              UUID PRIMARY KEY
ecriture_id     UUID NOT NULL REFERENCES ecritures_comptables(id)
compte_id       UUID NOT NULL REFERENCES comptes_comptables(id)
libelle         VARCHAR(500)
debit           NUMERIC(20,4) NOT NULL DEFAULT 0
credit          NUMERIC(20,4) NOT NULL DEFAULT 0
lettre          VARCHAR(5)  -- NULL si non lettré
ordre           INTEGER
```

### `import_historique`
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE
utilisateur_id  UUID NOT NULL REFERENCES utilisateurs(id)
format          VARCHAR(20) NOT NULL  -- FEC, SAGE, EBP, WAVESOFT, EXCEL_CSV, SOLDES
type_donnees    VARCHAR(30) NOT NULL  -- ECRITURES, TIERS, PLAN_COMPTABLE, SOLDES
statut          VARCHAR(20) NOT NULL DEFAULT 'TERMINE'
nb_importes     INTEGER NOT NULL DEFAULT 0
nb_ignores      INTEGER NOT NULL DEFAULT 0
nb_erreurs      INTEGER NOT NULL DEFAULT 0
nom_fichier     VARCHAR(255)
rapport_json    TEXT
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

---

## Procédures de maintenance

### Vérifier l'état des migrations

```sql
SELECT version, description, installed_on, success
FROM flyway_schema_history
ORDER BY installed_rank DESC
LIMIT 20;
```

### Réparer après échec

Si une migration échoue à mi-chemin :
1. Corriger manuellement la base de données pour annuler les changements partiels
2. Supprimer la ligne en échec dans `flyway_schema_history`
3. Corriger le script SQL
4. Relancer : `mvn flyway:migrate`

### Ajouter un index sans bloquer la production

PostgreSQL permet les index concurrents (sans verrou) :
```sql
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ecritures_date
    ON ecritures_comptables(entreprise_id, date_ecriture DESC);
```
