# Guide — États financiers

La plateforme génère automatiquement les états financiers réglementaires conformes au **SYSCOHADA Révisé**.

---

## États disponibles

| État | Description | Norme SYSCOHADA |
|------|-------------|-----------------|
| **Bilan** | Situation patrimoniale à une date donnée | Tableau de synthèse — Actif/Passif |
| **Compte de résultat** | Charges et produits sur une période | Tableau de performance |
| **Tableau des flux de trésorerie** | Flux opérationnels, investissement, financement | Méthode directe ou indirecte |
| **Tableau de variation des capitaux propres** | Évolution des fonds propres | |
| **Balance générale** | Soldes de tous les comptes | |
| **Grand livre** | Détail des mouvements par compte | |
| **Journal centralisateur** | Totaux par journal | |
| **Balance âgée** | Créances et dettes par ancienneté | |

---

## Générer un état financier

1. Accédez à **États financiers**.
2. Sélectionnez l'**état** souhaité.
3. Choisissez l'**exercice** (ou la période personnalisée pour Grand livre / Balance).
4. Cliquez sur **« Générer »**.

L'état s'affiche à l'écran. Vous pouvez :
- **Exporter en PDF** — format imprimable, signable
- **Exporter en Excel** — pour retraitement ultérieur
- **Imprimer** directement

---

## Bilan SYSCOHADA

Le bilan est présenté en deux colonnes selon la norme SYSCOHADA Révisé :

### Actif
| Rubrique | Comptes concernés |
|----------|-------------------|
| Actif immobilisé (brut, amortissements, net) | Classes 2 |
| Actif circulant (stocks, créances, trésorerie) | Classes 3, 4, 5 |

### Passif
| Rubrique | Comptes concernés |
|----------|-------------------|
| Capitaux propres | Classe 1 (10 à 15) |
| Dettes financières | Classe 1 (16) |
| Passif circulant | Classe 4 (fournisseurs, dettes fiscales) |
| Trésorerie passif | Classe 5 (soldes créditeurs) |

> **Équilibre :** Total Actif = Total Passif. En cas de déséquilibre, vérifiez les écritures de clôture et les soldes d'ouverture.

---

## Compte de résultat SYSCOHADA

Le compte de résultat distingue :
- **Activités ordinaires** : charges et produits d'exploitation courants
- **Activités hors activités ordinaires (HAO)** : cessions d'immobilisations, etc.
- **Résultat net** : bénéfice ou perte de l'exercice

---

## Balance générale

La balance affiche pour chaque compte :
- Solde débiteur et créditeur en **cumul d'ouverture**
- **Mouvements** de la période (débit/crédit)
- **Solde final** (débiteur ou créditeur)

### Vérification
- Σ Mouvements débit = Σ Mouvements crédit (équilibre des journaux)
- Σ Soldes débiteurs = Σ Soldes créditeurs (équilibre général)

### Filtres disponibles
- Période personnalisée
- Classe de comptes (1 à 9)
- Comptes avec mouvements uniquement

---

## Grand livre

Le grand livre affiche le détail de toutes les écritures pour un ou plusieurs comptes sur une période.

### Navigation
1. Sélectionnez un ou plusieurs comptes (tapez le numéro dans le champ de recherche).
2. Choisissez la période.
3. Le tableau affiche : date, pièce, libellé, débit, crédit, solde progressif.

### Export
Le grand livre peut être exporté en **Excel** ou **PDF** compte par compte ou pour une plage de comptes.

---

## Balance âgée

La balance âgée classe les créances clients et dettes fournisseurs par tranches d'ancienneté.

### Tranches par défaut
| Tranche | Description |
|---------|-------------|
| Non échu | Factures dont l'échéance n'est pas atteinte |
| 0 – 30 jours | Retard entre 0 et 30 jours |
| 31 – 60 jours | Retard entre 31 et 60 jours |
| 61 – 90 jours | Retard entre 61 et 90 jours |
| + 90 jours | Créances/dettes très anciennes |

---

## Liasse fiscale

Le module **Liasse fiscale** génère les formulaires de déclaration annuelle conformes aux exigences fiscales burkinabè (DGI/DGE).

Accédez à **Liasse fiscale**, sélectionnez l'exercice et cliquez **« Générer la liasse »**.

---

## Ratios financiers

Le module **Ratios** calcule automatiquement les principaux indicateurs :

| Ratio | Formule |
|-------|---------|
| Fonds de Roulement (FR) | Capitaux permanents − Actif immobilisé net |
| Besoin en Fonds de Roulement (BFR) | Actif circulant − Passif circulant (hors trésorerie) |
| Trésorerie nette | FR − BFR |
| Ratio de liquidité générale | Actif circulant / Passif circulant |
| Taux de rentabilité | Résultat net / Chiffre d'affaires × 100 |

---

## Conseils pratiques

- **Arrêtez les comptes** mensuellement pour détecter les erreurs tôt.
- **Archivez** les PDF des états annuels signés (obligation légale OHADA : conservation 10 ans).
- **Comparez** N vs N−1 avec le filtre de comparaison disponible sur le bilan et le compte de résultat.
