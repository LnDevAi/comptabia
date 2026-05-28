# Guide — Tiers & Rapprochement bancaire

---

## Gestion des tiers

Les **tiers** regroupent vos clients, fournisseurs et autres interlocuteurs auxquels des comptes auxiliaires (4xx) sont associés.

### Créer un tiers

1. Accédez à **Tiers** dans le menu.
2. Cliquez sur **« Nouveau tiers »**.
3. Renseignez :
   - **Code** (ex. `CLI001`, `FOU042`) — unique par entreprise
   - **Raison sociale** ou Nom/Prénom
   - **Type** : Client, Fournisseur ou Autre
   - Coordonnées : e-mail, téléphone, adresse
   - **Compte comptable lié** (ex. `411xxx` pour clients, `401xxx` pour fournisseurs)
4. Cliquez sur **« Enregistrer »**.

### Importer des tiers en masse
Utilisez le module **Import & Migration** avec le type de données « Tiers (clients/fournisseurs) » depuis Excel/CSV, Sage, EBP ou WaveSoft.
Voir [Guide Import & Migration](./05-import-migration.md).

### Fiche tiers
La fiche d'un tiers affiche :
- Solde comptable en temps réel
- Historique des écritures liées
- Factures et règlements (si module Facturation actif)
- Relances envoyées

### Relances clients
Le module **Relances** permet d'envoyer automatiquement des e-mails de relance aux clients en retard de paiement.

1. Accédez à **Relances**.
2. Configurez les niveaux de relance (1er rappel, 2e rappel, mise en demeure).
3. Sélectionnez les clients à relancer.
4. Cliquez sur **« Envoyer les relances »**.

---

## Rapprochement bancaire

Le rapprochement bancaire permet de **vérifier la cohérence** entre votre comptabilité et vos relevés bancaires.

### Principe
Pour chaque mouvement du relevé bancaire, vous retrouvez (ou créez) l'écriture comptable correspondante. Une fois tous les mouvements pointés, le solde comptable doit correspondre au solde bancaire.

### Importer un relevé bancaire

1. Accédez à **Rapprochement bancaire**.
2. Sélectionnez le **compte bancaire** (compte de trésorerie 5xx).
3. Importez votre relevé au format **OFX**, **QIF** ou **CSV bancaire**.
4. La plateforme propose automatiquement les correspondances avec les écritures existantes.

### Pointer manuellement

1. Le tableau affiche côte à côte les mouvements bancaires et les écritures comptables.
2. Cochez les lignes correspondantes pour les associer.
3. Si une ligne du relevé n'a pas d'écriture :
   - Cliquez **« Créer l'écriture »** pour générer l'écriture manquante directement.
4. Si une écriture n'a pas de mouvement bancaire :
   - Vérifiez qu'elle ne correspond pas à un mouvement déjà pointé, ou laissez-la en attente.

### Valider le rapprochement

Quand **Solde relevé = Solde pointé comptable**, cliquez **« Valider le rapprochement »**.
Un état de rapprochement daté et signable est généré automatiquement (export PDF).

### Bonne pratique
Effectuez le rapprochement **mensuellement**, idéalement dans les 10 premiers jours du mois suivant.

---

## Trésorerie

### Tableau de bord trésorerie
Le module **Trésorerie** affiche :
- Soldes en temps réel par compte bancaire
- Flux entrants et sortants sur la période
- Graphique d'évolution

### Trésorerie avancée (Plan PREMIUM)
Le module **Trésorerie avancée** ajoute :
- **Prévisions de trésorerie** à 30, 60 et 90 jours
- Scénarios d'optimisation
- Alertes de seuil (notification si le solde descend sous un seuil défini)

### Prévisions de trésorerie
1. Accédez à **Prévisions de trésorerie**.
2. Saisissez les encaissements et décaissements prévisionnels.
3. La plateforme projette la trésorerie sur la période et signale les risques de découvert.
