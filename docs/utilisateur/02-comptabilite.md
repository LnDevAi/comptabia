# Guide — Comptabilité générale

Ce guide couvre les fonctionnalités comptables fondamentales : plan de comptes, journaux, écritures et exercices.

---

## Plan de comptes

### Consulter le plan de comptes
Accédez à **Plan de comptes** dans le menu principal. La liste affiche tous les comptes avec leur numéro, intitulé, classe et solde courant.

### Créer un compte
1. Cliquez sur **« Nouveau compte »**.
2. Saisissez le **numéro de compte** (ex. `411000` — Clients).
3. Renseignez l'**intitulé** et sélectionnez la **classe** (1 à 9 selon SYSCOHADA).
4. Cochez **« Compte auxiliaire »** si le compte est lié à un tiers.
5. Cliquez sur **« Enregistrer »**.

### Modifier ou désactiver un compte
- Cliquez sur un compte pour l'éditer.
- Un compte ayant des écritures ne peut pas être supprimé ; vous pouvez le **désactiver** pour l'exclure des sélections.

### Numérotation SYSCOHADA
| Classe | Nature |
|--------|--------|
| 1 | Comptes de ressources durables |
| 2 | Comptes d'actif immobilisé |
| 3 | Comptes de stocks |
| 4 | Comptes de tiers |
| 5 | Comptes de trésorerie |
| 6 | Comptes de charges |
| 7 | Comptes de produits |
| 8 | Comptes des autres charges et produits |
| 9 | Comptes analytiques (si utilisés) |

---

## Journaux comptables

### Types de journaux par défaut
| Code | Intitulé | Usage |
|------|----------|-------|
| AC | Achats | Factures fournisseurs |
| VT | Ventes | Factures clients |
| BQ | Banque | Opérations bancaires |
| CA | Caisse | Mouvements de caisse |
| OD | Opérations diverses | Écritures de régularisation, paie, etc. |

### Créer un journal personnalisé
Depuis **Paramètres › Journaux** : cliquez **« Nouveau journal »**, saisissez un code (2–4 caractères), un intitulé et sélectionnez le type (Achats, Ventes, Trésorerie, Divers).

---

## Écritures comptables

### Saisir une écriture manuelle

1. Depuis **Écritures comptables**, cliquez **« Nouvelle écriture »**.
2. Sélectionnez le **journal** et l'**exercice**.
3. Saisissez la **date** (format JJ/MM/AAAA), le **numéro de pièce** (libre) et le **libellé général**.
4. Ajoutez les lignes :
   - Compte débiteur → montant au débit
   - Compte créditeur → montant au crédit
5. Le système vérifie l'équilibre débit/crédit en temps réel.
6. Choisissez le statut :
   - **Brouillon** : modifiable, non comptabilisé définitivement
   - **Valider** : passe en statut VALIDEE, non modifiable

> **Règle d'or :** Toute écriture doit être équilibrée (Σ Débit = Σ Crédit).

### Importer des écritures en masse
Utilisez le module **Import & Migration** pour importer depuis FEC, Sage, EBP, WaveSoft ou Excel/CSV.
Voir [Guide Import & Migration](./05-import-migration.md).

### Rechercher et filtrer
Le tableau des écritures permet de filtrer par :
- Journal, exercice, période
- Compte, tiers
- Statut (brouillon, validée)
- Montant, numéro de pièce

### Lettrage
Le lettrage permet de pointer les écritures clients/fournisseurs contre leurs règlements.
Voir [Guide Lettrage](#lettrage).

---

## Exercices comptables

### Créer un exercice
Depuis **Exercices** :
1. Cliquez **« Nouvel exercice »**.
2. Définissez la date de début et de fin.
3. L'exercice passe automatiquement en statut **Ouvert**.

### Clôturer un exercice
La clôture d'un exercice :
1. Gèle toutes les écritures de la période (plus de modification possible).
2. Génère automatiquement les **écritures de résultat** (compte 120/129 — Résultat net).
3. Crée les **soldes d'ouverture** du nouvel exercice.

> **Attention :** La clôture est irréversible. Assurez-vous que tous les pointages, lettrages et régularisations sont effectués.

### Exercices multiples
La plateforme gère plusieurs exercices simultanément. Vous pouvez consulter l'historique et générer des états sur n'importe quel exercice clos.

---

## Lettrage

Le lettrage permet d'associer des écritures de charges/produits à leurs règlements (rapprochement clients/fournisseurs).

### Lettrer manuellement
1. Depuis **Lettrage**, sélectionnez un compte (4xx).
2. Cochez les lignes à pointer (facture + règlement).
3. Vérifiez que le solde des lignes sélectionnées est nul.
4. Cliquez **« Lettrer »** — une lettre (A, B, C…) est attribuée.

### Délettrer
Cliquez sur une lettre existante puis **« Délettrer »** pour annuler le pointage.

---

## Analytique

La comptabilité analytique permet de ventiler les charges et produits par **axe analytique** (projet, département, activité).

### Configurer les axes
Depuis **Analytique › Axes** : créez vos axes (ex. « Projets », « Départements »).

### Saisir un code analytique
Sur chaque ligne d'écriture, un champ **Code analytique** permet d'affecter la ligne à un axe et un code.

### Rapports analytiques
Le module **Analytique** génère des tableaux de résultat par axe avec ventilation des charges et produits.
