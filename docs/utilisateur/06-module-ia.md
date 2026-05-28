# Guide — Module IA (Intelligence Artificielle)

Le **Module IA** d'ComptaBIA utilise l'intelligence artificielle pour vous assister dans votre travail comptable quotidien. Disponible à partir du plan **PREMIUM**.

---

## Fonctionnalités disponibles

| Fonctionnalité | Description |
|----------------|-------------|
| **Suggestion d'imputation** | Propose automatiquement les comptes débit/crédit lors de la saisie |
| **Détection d'anomalies** | Signale les écritures inhabituelles ou potentiellement erronées |
| **Analyse financière** | Génère une analyse commentée de vos états financiers |
| **Questions / Réponses** | Répondez à vos questions comptables en langage naturel |
| **Aide à la clôture** | Vérifie la cohérence des comptes avant la clôture d'exercice |
| **Prévisions** | Projections de trésorerie et de résultat basées sur l'historique |

---

## Accéder au Module IA

Depuis le menu principal, cliquez sur **IA Comptable**.

L'interface se compose de :
- Un **chat** pour poser vos questions en langage naturel
- Des **suggestions contextuelles** apparaissant automatiquement lors de la saisie
- Un **tableau de bord d'alertes** recensant les anomalies détectées

---

## Suggestion d'imputation automatique

### Comment ça fonctionne
Lors de la saisie d'une écriture, dès que vous tapez un **libellé** (ex. « Facture électricité SONABEL »), le Module IA propose :
- Le compte débiteur probable (ex. `6051 — Eau et électricité`)
- Le journal recommandé (ex. `AC — Achats`)
- Le taux de TVA applicable si détecté

### Accepter ou refuser une suggestion
- Cliquez sur la suggestion pour l'appliquer automatiquement.
- Ignorez-la pour saisir manuellement : la plateforme mémorise votre choix pour améliorer les suggestions futures.

### Apprentissage continu
Le Module IA apprend de vos habitudes de saisie. Plus vous l'utilisez, plus les suggestions deviennent précises pour votre dossier.

---

## Détection d'anomalies

Le système analyse en continu vos écritures et signale dans le tableau de bord :

| Type d'anomalie | Exemple |
|-----------------|---------|
| **Écriture déséquilibrée** | Débit ≠ Crédit (ne devrait pas arriver mais signalé si état brouillon oublié) |
| **Doublon probable** | Même pièce, même montant, même date — risque de double saisie |
| **Compte inhabituel** | Utilisation d'un compte rarement utilisé pour ce type d'opération |
| **Montant atypique** | Montant très éloigné de la moyenne historique pour ce compte |
| **TVA incohérente** | Base HT × taux ≠ montant TVA saisi |
| **Journal incorrect** | Ex. une facture fournisseur saisie en journal Ventes |

### Traiter une anomalie
Pour chaque anomalie, vous pouvez :
- **Corriger** : modifier l'écriture directement
- **Ignorer** : marquer comme faux positif (ne sera plus signalée)
- **En savoir plus** : demander une explication détaillée à l'IA

---

## Analyse financière automatique

1. Depuis **IA Comptable**, cliquez sur **« Analyser ma situation »**.
2. Choisissez la période (mois, trimestre, exercice).
3. Le Module IA génère un rapport commenté incluant :
   - Évolution du chiffre d'affaires et des charges
   - Comparaison N vs N−1
   - Points d'attention (charges en hausse, marges en baisse, dettes clients…)
   - Recommandations concrètes

> **Important :** Ce rapport est fourni à titre indicatif. Il ne se substitue pas à un avis professionnel d'expert-comptable.

---

## Questions en langage naturel

Posez vos questions comptables directement dans le chat :

**Exemples de questions :**
- « Quel est mon résultat net à fin juin ? »
- « Quelles sont mes créances clients de plus de 60 jours ? »
- « Comment comptabiliser un remboursement de frais professionnel ? »
- « Quel compte utiliser pour les frais de déplacement ? »
- « Mon bilan est-il équilibré ? »

Le Module IA répond en français, cite les références SYSCOHADA applicables et peut générer les écritures directement si vous le demandez.

---

## Aide à la clôture

Avant de clôturer un exercice, lancez le **Contrôle pré-clôture** :

1. Depuis **IA Comptable › Clôture**, cliquez **« Lancer le contrôle »**.
2. Le système vérifie :
   - Toutes les écritures brouillon (non validées)
   - Comptes sans mouvement suspects
   - Lettrage incomplet sur les comptes de tiers
   - TVA à régulariser
   - Amortissements non calculés
   - Cohérence capitaux propres / résultat
3. Un rapport liste les points à corriger avant clôture.

---

## Bonnes pratiques

- **Validez les suggestions** régulièrement pour améliorer la précision du modèle sur votre dossier.
- **Traitez les anomalies** hebdomadairement pour garder un dossier propre.
- **Consultez l'analyse mensuelle** pour piloter votre activité en temps réel.
- Les suggestions IA sont des **aides à la décision**, pas des certifications. En cas de doute, consultez votre expert-comptable.

---

## Limitations

- Le Module IA ne connaît que les données de votre dossier sur la plateforme.
- Les prévisions sont basées sur l'historique disponible — elles sont moins fiables pour les dossiers récents.
- Le chat IA ne peut pas accéder à des données externes (cours de change en temps réel, jurisprudence, etc.).
