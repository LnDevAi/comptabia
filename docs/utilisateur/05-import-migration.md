# Guide — Import & Migration

Le module **Import & Migration** vous permet de transférer vos données depuis un autre logiciel comptable vers e-Compta IA en quelques étapes.

---

## Formats supportés

| Format | Logiciel source | Types de données |
|--------|-----------------|------------------|
| **FEC** | Tout logiciel conforme DGI/DGFiP | Écritures comptables |
| **Sage** | Sage Comptabilité 50/100 | Écritures, Tiers, Plan comptable |
| **EBP** | EBP Comptabilité Open Line | Écritures, Tiers, Plan comptable |
| **WaveSoft** | WaveSoft Compta | Écritures, Tiers, Plan comptable |
| **Excel / CSV** | Tout tableur | Écritures, Tiers, Plan comptable, Soldes |
| **Soldes d'ouverture** | Excel / CSV | Soldes d'ouverture uniquement |

---

## Accéder au module

Depuis le menu principal, cliquez sur **Import & Migration**.
L'assistant s'ouvre sur un wizard en 4 étapes.

---

## Étape 1 — Choisir le format et le type de données

1. **Format du fichier** : sélectionnez votre logiciel source ou « Excel / CSV générique ».
2. **Type de données** : choisissez ce que vous souhaitez importer :
   - **Écritures comptables** — transfert du journal comptable
   - **Tiers** — clients et fournisseurs
   - **Plan comptable** — comptes personnalisés
   - **Soldes d'ouverture** — balances de début d'exercice
3. Cliquez **« Suivant »**.

---

## Étape 2 — Téléverser le fichier

1. Glissez-déposez votre fichier dans la zone d'upload, ou cliquez pour le sélectionner.
2. Extensions acceptées selon le format :
   - FEC, Sage, EBP, WaveSoft : `.txt`, `.csv`
   - Excel/CSV, Soldes : `.xlsx`, `.xls`, `.csv`
3. La plateforme analyse automatiquement le fichier :
   - Détection du séparateur (tabulation, point-virgule, virgule)
   - Détection de l'encodage (Windows-1252, UTF-8)
   - Aperçu des 5 premières lignes
4. Cliquez **« Suivant »**.

---

## Étape 3 — Vérifier le mapping des colonnes

La plateforme suggère automatiquement la correspondance entre vos colonnes source et les champs cibles.

### Champs cibles pour les écritures

| Champ cible | Description | Obligatoire |
|-------------|-------------|-------------|
| `journal` | Code journal (ex. AC, VT, BQ) | Oui |
| `date` | Date de l'écriture | Oui |
| `piece` | Numéro de pièce | Non |
| `compte` | Numéro de compte | Oui |
| `libelle` | Libellé de la ligne | Non |
| `debit` | Montant débiteur | Oui* |
| `credit` | Montant créditeur | Oui* |

*Au moins l'un des deux (débit ou crédit) est requis.

### Champs cibles pour les tiers

| Champ cible | Description |
|-------------|-------------|
| `code` | Code tiers unique |
| `nom` | Raison sociale ou nom |
| `email` | Adresse e-mail |
| `telephone` | Numéro de téléphone |
| `adresse` | Adresse postale |
| `typeTiers` | `CLIENT` ou `FOURNISSEUR` |

### Modifier le mapping
Si la suggestion automatique n'est pas correcte, modifiez le mapping via les menus déroulants.
Vous pouvez également **ignorer** une colonne source en la laissant non mappée.

Cliquez **« Suivant »** quand le mapping est correct.

---

## Étape 4 — Confirmer et importer

Un résumé affiche :
- Nombre de lignes détectées
- Format et type de données
- Mapping configuré

Cliquez **« Lancer l'import »** pour démarrer le traitement.

---

## Résultats de l'import

Après traitement, un rapport détaillé s'affiche :

| Indicateur | Description |
|------------|-------------|
| ✅ **Importés** | Lignes insérées avec succès |
| ⏭ **Ignorés** | Doublons détectés (déjà présents) |
| ❌ **Erreurs** | Lignes rejetées (problème de format, compte introuvable…) |

### Gérer les erreurs
Le tableau des erreurs indique pour chaque ligne :
- Le numéro de ligne dans le fichier source
- La référence (numéro de pièce, code tiers…)
- Le message d'erreur explicite

Corrigez votre fichier source puis relancez l'import.

---

## Historique des imports

Accédez à l'onglet **Historique** pour consulter tous les imports passés :
- Date et heure
- Format et type de données
- Fichier source
- Résultats (importés, ignorés, erreurs)
- Utilisateur ayant réalisé l'import

---

## Conseils et bonnes pratiques

### Avant l'import
- Effectuez une **sauvegarde** de votre dossier comptable actuel.
- Testez d'abord avec un **petit fichier** (quelques dizaines de lignes) avant d'importer des milliers d'écritures.
- Vérifiez que les **comptes** de votre plan comptable existent déjà (créez-les manuellement ou importez le plan comptable en premier).

### Import par étapes recommandé
1. Plan comptable (si nécessaire)
2. Tiers (clients et fournisseurs)
3. Soldes d'ouverture (si migration en cours d'exercice)
4. Écritures comptables

### FEC — Spécificités
Le FEC (Fichier des Écritures Comptables) est un format normalisé (arrêté du 29 juillet 2013 — adapté en contexte OHADA). Il contient obligatoirement les champs : `JournalCode`, `JournalLib`, `EcritureNum`, `EcritureDate`, `CompteNum`, `CompteLib`, `Debit`, `Credit`.

### Sage — Spécificités
Les exports Sage sont généralement en tabulation (`.txt`), encodage Windows-1252. La plateforme les détecte automatiquement.

### Excel/CSV générique
Pour un import depuis Excel :
- Première ligne = en-têtes de colonnes
- Dates au format `JJ/MM/AAAA` ou `AAAA-MM-JJ`
- Montants sans espace ni symbole monétaire (ex. `1500.00`, pas `1 500 FCFA`)
- Séparateur décimal : point (`.`) recommandé

---

## Soldes d'ouverture

Si vous démarrez e-Compta IA **en cours d'exercice**, importez vos soldes d'ouverture :

1. Préparez un fichier avec les colonnes : `compte`, `libelle`, `soldeDebit`, `soldeCredit`.
2. Choisissez le format **Soldes d'ouverture** et le type **Soldes d'ouverture**.
3. La plateforme crée automatiquement les écritures de report au journal **Bilan d'ouverture (OD)** en contrepartie du compte **890 — Bilan d'ouverture**.
