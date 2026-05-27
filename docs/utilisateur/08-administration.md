# Guide — Administration & Paramètres

Ce guide s'adresse aux **Administrateurs** du dossier. Il couvre la gestion des utilisateurs, des droits d'accès, des paramètres de l'entreprise et de l'abonnement.

---

## Rôles et permissions

La plateforme propose trois niveaux d'accès :

| Rôle | Permissions |
|------|-------------|
| **Administrateur** | Accès complet — paramètres, utilisateurs, toutes fonctionnalités |
| **Comptable** | Saisie, validation, états, import — pas de gestion des utilisateurs |
| **Lecteur** | Consultation uniquement — aucune modification possible |

Le premier utilisateur d'une entreprise est automatiquement **Administrateur**.

---

## Gestion des utilisateurs

### Inviter un collaborateur

1. Depuis **Utilisateurs & Droits**, cliquez **« Inviter un utilisateur »**.
2. Saisissez son **adresse e-mail**.
3. Choisissez son **rôle** (Administrateur, Comptable, Lecteur).
4. Cliquez **« Envoyer l'invitation »**.

L'invité reçoit un e-mail avec un lien valide **48 heures**. S'il n'a pas encore de compte, il est invité à en créer un.

### Modifier le rôle d'un utilisateur
Dans la liste des utilisateurs, cliquez sur l'icône **✏ Modifier** en face de l'utilisateur concerné, puis changez son rôle et enregistrez.

### Désactiver un utilisateur
Cliquez sur l'icône **🚫 Désactiver**. L'utilisateur perd immédiatement l'accès sans être supprimé. Son historique d'actions est conservé.

### Réactiver un utilisateur
Un utilisateur désactivé peut être réactivé à tout moment depuis la liste.

---

## Paramètres de l'entreprise

Depuis **Paramètres › Entreprise** :

| Champ | Description |
|-------|-------------|
| Raison sociale | Nom officiel de l'entreprise |
| IFU | Identifiant Fiscal Unique (Burkina Faso) |
| RCCM | Registre du Commerce et du Crédit Mobilier |
| Adresse du siège | Utilisée sur les documents imprimables |
| Logo | Affiché sur les PDF générés (états, factures…) |
| Référentiel comptable | SYSCOHADA Révisé (par défaut) |
| Devise principale | XOF — Franc CFA BCEAO (par défaut) |
| Format de date | JJ/MM/AAAA (par défaut) |

Cliquez **« Enregistrer »** pour appliquer les modifications.

---

## Gestion multi-entreprises

Un même compte peut gérer plusieurs entreprises (cabinet d'expertise, groupe).

### Ajouter une entreprise
1. Cliquez sur le sélecteur d'entreprise en haut à gauche du tableau de bord.
2. Cliquez **« + Nouvelle entreprise »**.
3. Suivez l'assistant de configuration (voir [Guide de démarrage](./01-demarrage.md)).

### Passer d'une entreprise à une autre
Cliquez sur le sélecteur d'entreprise et choisissez le dossier souhaité. Toutes les données affichées basculent instantanément.

### Isolation des données
Les données de chaque entreprise sont **strictement isolées**. Un utilisateur ne peut pas accéder à une entreprise à laquelle il n'a pas été invité.

---

## Abonnement et facturation

### Consulter l'abonnement en cours
Depuis **Paramètres › Abonnement**, vous voyez :
- Plan actif et date de renouvellement
- Modules activés
- Historique des factures

### Changer de plan
1. Cliquez **« Changer de plan »**.
2. Sélectionnez le nouveau plan sur la page Tarifs.
3. Le changement est immédiat pour une montée en gamme (upgrade).
4. Un downgrade prend effet à la prochaine échéance.

### Télécharger une facture
Depuis l'historique des factures, cliquez sur **« Télécharger »** pour obtenir le PDF de la facture.

---

## Sécurité du compte

### Changer de mot de passe
Depuis **Mon profil › Sécurité** :
1. Saisissez votre mot de passe actuel.
2. Saisissez et confirmez le nouveau mot de passe.
3. Cliquez **« Mettre à jour »**.

### Double authentification (2FA)
1. Depuis **Mon profil › Sécurité**, activez l'option **« Authentification à deux facteurs »**.
2. Scannez le QR code avec une application d'authentification (Google Authenticator, Authy…).
3. Confirmez avec le code à 6 chiffres affiché.

Une fois activée, la 2FA est requise à chaque connexion.

### Sessions actives
Depuis **Mon profil › Sessions**, consultez toutes vos sessions ouvertes. Fermez à distance les sessions suspectes avec le bouton **« Déconnecter »**.

---

## Journaux d'audit

Le module **Audit** enregistre toutes les actions sensibles :

- Connexions et déconnexions
- Création, modification et suppression d'écritures
- Changements de paramètres
- Exports de données
- Ajout ou suppression d'utilisateurs

Accédez à **Audit** pour consulter l'historique filtrable par utilisateur, action, date et module.

---

## Export et sauvegarde des données

### Export manuel
Depuis **Export**, vous pouvez exporter :
- Balance générale (Excel, CSV)
- Grand livre (Excel, PDF)
- Écritures filtrées (CSV)
- Tiers (CSV)
- Plan comptable (CSV)

### Sauvegarde automatique
La plateforme effectue des sauvegardes chiffrées **quotidiennes** de vos données avec une rétention de 30 jours. Pour demander la restauration d'une sauvegarde, contactez le support : [EMAIL_CONTACT].

### Portabilité RGPD / loi 010-2004/AN
Depuis **Paramètres › Mes données**, demandez l'export complet de toutes vos données personnelles au format JSON (traité sous 30 jours).

---

## Alertes et notifications

### Configurer les alertes
Depuis **Alertes** :
- Alertes de TVA (N jours avant l'échéance)
- Alertes de trésorerie (seuil bas sur compte bancaire)
- Alertes de clôture d'exercice
- Alertes sur créances clients échues

### Notifications en temps réel
Les notifications en temps réel apparaissent dans la cloche 🔔 en haut à droite. Configurez la fréquence (temps réel, quotidien, hebdomadaire) depuis **Mon profil › Notifications**.
