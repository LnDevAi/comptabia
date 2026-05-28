# Guide — Fiscalité & TVA

Ce guide couvre la gestion de la TVA, les déclarations fiscales et les outils de conformité fiscale disponibles sur ComptaBIA.

---

## TVA — Principes généraux

La plateforme gère la TVA conformément à la réglementation burkinabè (Direction Générale des Impôts — DGI) et aux dispositions harmonisées de l'UEMOA.

### Taux de TVA configurés

| Taux | Description |
|------|-------------|
| **18 %** | Taux normal (Burkina Faso) |
| **0 %** | Opérations exonérées ou hors champ |

Les taux peuvent être adaptés depuis **Paramètres › TVA** selon votre régime fiscal et le pays d'activité.

### Régimes TVA supportés
- **Régime du réel normal** — déclaration mensuelle
- **Régime du réel simplifié** — déclaration trimestrielle
- **Exonération** — pour les structures non assujetties

---

## Saisie des écritures de TVA

### Méthode automatique (recommandée)
Lors de la saisie d'une facture, renseignez le **montant HT** et sélectionnez le **taux de TVA**. La plateforme calcule automatiquement :
- Montant TVA = Base HT × Taux
- Montant TTC = HT + TVA
- Les lignes comptables dédiées (comptes 4431/4441)

Comptes TVA standard SYSCOHADA :
| Compte | Intitulé |
|--------|----------|
| `4431` | TVA facturée (collectée) |
| `4441` | TVA récupérable (déductible) |
| `4449` | État — TVA à décaisser |

### Méthode manuelle
Saisissez les trois lignes séparément (HT, TVA, TTC) dans votre écriture en veillant à utiliser les bons comptes de TVA.

---

## Déclaration de TVA

### Accéder à la déclaration
Depuis **TVA** dans le menu principal :

1. Sélectionnez la **période** (mois ou trimestre selon votre régime).
2. La plateforme calcule automatiquement :
   - **TVA collectée** (ventes, prestations) — compte `4431`
   - **TVA déductible** (achats, charges) — compte `4441`
   - **TVA nette à payer** = TVA collectée − TVA déductible

### Vérification avant déclaration
Avant de valider, vérifiez :
- Toutes les factures de vente de la période sont saisies
- Toutes les factures d'achat avec TVA sont enregistrées
- Les avoirs et retours sont comptabilisés

### Valider et exporter
1. Cliquez **« Valider la période »** — la TVA nette est comptabilisée (écriture de solde `4431`/`4441`/`4449`).
2. Exportez la déclaration en **PDF** pour transmission à la DGI.

### Paiement de la TVA
Une fois la déclaration validée, comptabilisez le règlement :
- Débit `4449 — TVA à décaisser`
- Crédit `521xxx — Compte bancaire`

---

## Gestion fiscale avancée

### Module Gestion fiscale
Accessible depuis **Gestion fiscale**, ce module couvre :
- Suivi des échéances fiscales (TVA, IS, patente, CNSS…)
- Calendrier des obligations déclaratives
- Historique des déclarations
- Alertes automatiques avant chaque échéance

### Impôt sur les Sociétés (IS)

Le module **Déclaration IS** vous accompagne dans le calcul de votre IS :

1. Accédez à **Déclaration IS**.
2. Sélectionnez l'exercice à déclarer.
3. La plateforme préremplie les cases à partir de votre compte de résultat.
4. Effectuez les **réintégrations et déductions extracomptables**.
5. Le résultat fiscal et l'IS calculé s'affichent automatiquement.

Taux IS Burkina Faso (à titre indicatif) :
| Régime | Taux |
|--------|------|
| IS sur bénéfices | 27,5 % |
| Impôt minimum forfaitaire (IMF) | 0,5 % du CA (minimum légal) |

> Vérifiez toujours les taux en vigueur auprès de la DGI, ils peuvent être modifiés par la loi de finances.

---

## Notes annexes fiscales

Le module **Notes annexes fiscales** génère les tableaux obligatoires à joindre à la liasse fiscale :
- Tableau des immobilisations et amortissements
- Tableau des provisions
- État des filiales et participations
- Tableaux de détail des charges déductibles

Accédez à **Notes annexes fiscales**, sélectionnez l'exercice et cliquez **« Générer »**.

---

## Paramétrage fiscal

Depuis **Paramètres › Fiscalité** :

- **Régime fiscal** : Normal, Simplifié, Exonération
- **Périodicité TVA** : Mensuelle, Trimestrielle
- **Taux IS** : personnalisable selon la loi de finances en vigueur
- **Codes douaniers** (pour les entreprises importatrices/exportatrices)

---

## Conseils pratiques

- **Rapprochez** votre TVA comptable avec vos relevés DGI chaque trimestre.
- **Archivez** toutes vos déclarations exportées (obligation légale : 10 ans).
- En cas de **crédit de TVA**, contactez la DGI pour les modalités de remboursement ou de report.
- Configurez les **alertes d'échéances fiscales** dans le module Alertes pour ne jamais manquer une date limite.
