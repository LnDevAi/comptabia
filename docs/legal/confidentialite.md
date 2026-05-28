# Politique de Confidentialité

**Version :** 1.0
**Date d'entrée en vigueur :** [DATE_ENTREE_EN_VIGUEUR]
**Éditeur :** L'N EXPERTISE — Lassané NACOULMA

---

## Préambule

L'N EXPERTISE accorde une importance primordiale à la protection de vos données à caractère personnel. La présente Politique de Confidentialité décrit les traitements mis en œuvre dans le cadre de l'utilisation de la plateforme **e-Compta IA**, en conformité avec :

- La **loi n°010-2004/AN du 20 avril 2004** portant protection des données à caractère personnel au Burkina Faso ;
- Les lignes directrices et recommandations de la **CNDP** (Commission Nationale de l'Informatique et des Libertés — Burkina Faso) ;
- Le **Règlement Général sur la Protection des Données (RGPD)** de l'Union Européenne, appliqué par analogie aux utilisateurs européens.

---

## Article 1 — Responsable du Traitement

**L'N EXPERTISE**
Propriétaire : Lassané NACOULMA
[ADRESSE_SIEGE], Ouagadougou, Burkina Faso
E-mail : [EMAIL_CONTACT]
Téléphone : [TELEPHONE]

**Délégué à la Protection des Données (DPD) :**
E-mail : [EMAIL_DPO]

---

## Article 2 — Données collectées

### 2.1 Données d'identification et de compte

| Donnée | Finalité | Base légale |
|--------|----------|-------------|
| Nom, prénom | Identification, facturation | Exécution du contrat |
| Adresse e-mail | Connexion, notifications, support | Exécution du contrat |
| Mot de passe (hashé) | Authentification sécurisée | Exécution du contrat |
| Numéro de téléphone | Vérification 2FA (si activée) | Consentement |

### 2.2 Données de l'entreprise gérée

| Donnée | Finalité | Base légale |
|--------|----------|-------------|
| Raison sociale, RCCM, IFU | Configuration du dossier comptable | Exécution du contrat |
| Exercices comptables | Tenue de comptabilité | Exécution du contrat |
| Coordonnées bancaires (RIB masqué) | Rapprochement bancaire | Exécution du contrat |

### 2.3 Données comptables et financières

Les écritures comptables, journaux, pièces justificatives, bilans et autres documents financiers saisis par l'Utilisateur sont des données **appartenant à l'Utilisateur**. L'N EXPERTISE agit en qualité de **sous-traitant** pour ces données, sur instruction de l'Utilisateur.

### 2.4 Données de navigation et techniques

| Donnée | Finalité | Base légale |
|--------|----------|-------------|
| Adresse IP | Sécurité, détection de fraude | Intérêt légitime |
| Journaux d'accès (logs) | Débogage, sécurité | Intérêt légitime |
| Type de navigateur, OS | Optimisation de l'interface | Intérêt légitime |
| Sessions et tokens JWT | Authentification | Exécution du contrat |

### 2.5 Données de paiement

L'N EXPERTISE ne stocke pas vos données de paiement (numéro de carte, code PIN Mobile Money). Ces données sont traitées directement par nos prestataires certifiés : **CinetPay** et **Stripe**.

---

## Article 3 — Finalités du traitement

Vos données sont traitées pour les finalités suivantes :

1. **Fourniture du service** : accès à la Plateforme, tenue de comptabilité, génération d'états financiers ;
2. **Gestion des abonnements et de la facturation** ;
3. **Support technique et assistance** ;
4. **Sécurité** : prévention des accès frauduleux, détection d'anomalies ;
5. **Amélioration du service** : analyse agrégée et anonymisée des usages ;
6. **Module IA** : traitement de vos données comptables pour générer des suggestions (traitement effectué sur vos données uniquement) ;
7. **Communications** : notifications de service, alertes, informations sur les évolutions de la Plateforme ;
8. **Obligations légales** : conservation des données conformément aux obligations fiscales et comptables burkinabè.

---

## Article 4 — Durée de conservation

| Catégorie de données | Durée de conservation |
|----------------------|-----------------------|
| Données de compte actif | Pendant toute la durée de l'Abonnement |
| Données de compte résilié | 30 jours après résiliation, puis suppression |
| Données comptables | 10 ans (obligation légale OHADA/fiscale BF) |
| Journaux de connexion | 12 mois glissants |
| Données de facturation | 10 ans (obligation fiscale) |
| Données de paiement | Non stockées par L'N EXPERTISE |

---

## Article 5 — Destinataires des données

Vos données peuvent être partagées avec :

### 5.1 Sous-traitants techniques

| Prestataire | Pays | Rôle |
|-------------|------|------|
| [HEBERGEUR_NOM] | [HEBERGEUR_PAYS] | Hébergement des données |
| CinetPay | Côte d'Ivoire | Traitement des paiements Mobile Money |
| Stripe | États-Unis (UE SCCs) | Traitement des paiements par carte |

Tous nos sous-traitants sont liés par un contrat de traitement des données (DPA) garantissant un niveau de protection équivalent.

### 5.2 Autorités compétentes

Vos données peuvent être communiquées aux autorités judiciaires, fiscales ou administratives burkinabè sur réquisition légale.

### 5.3 Aucune vente de données

L'N EXPERTISE **ne vend jamais** vos données à des tiers à des fins commerciales ou publicitaires.

---

## Article 6 — Transferts hors Burkina Faso

Certains sous-traitants (notamment Stripe) sont établis hors du Burkina Faso. Ces transferts sont encadrés par des garanties contractuelles appropriées (Clauses Contractuelles Types) conformes aux exigences de la CNDP.

---

## Article 7 — Sécurité des données

L'N EXPERTISE met en œuvre les mesures techniques et organisationnelles suivantes :

- **Chiffrement** : communications HTTPS/TLS 1.3 ; mots de passe hachés (bcrypt) ; données sensibles chiffrées au repos
- **Contrôle d'accès** : authentification JWT, isolation des données par entreprise (multi-tenant)
- **Journalisation** : piste d'audit complète des actions sur les données
- **Sauvegarde** : sauvegardes chiffrées quotidiennes avec rétention de 30 jours
- **Mise à jour** : correctifs de sécurité appliqués régulièrement

---

## Article 8 — Vos droits

Conformément à la loi n°010-2004/AN et au RGPD (pour les utilisateurs européens), vous disposez des droits suivants :

| Droit | Description |
|-------|-------------|
| **Accès** | Obtenir une copie de vos données personnelles |
| **Rectification** | Corriger des données inexactes ou incomplètes |
| **Effacement** | Demander la suppression de vos données (sous réserve des obligations légales) |
| **Portabilité** | Recevoir vos données dans un format structuré et machine-readable |
| **Opposition** | Vous opposer à certains traitements fondés sur l'intérêt légitime |
| **Limitation** | Demander la suspension temporaire d'un traitement |
| **Retrait du consentement** | Retirer votre consentement pour les traitements qui en dépendent |

### Exercice de vos droits

Adressez votre demande à notre DPD : **[EMAIL_DPO]**

Joignez une copie d'un justificatif d'identité. Nous répondrons dans un délai de **30 jours calendaires**.

En cas de réclamation non résolue, vous pouvez saisir la **CNDP (Commission Nationale de l'Informatique et des Libertés)** du Burkina Faso.

---

## Article 9 — Cookies

### 9.1 Cookies strictement nécessaires (pas de consentement requis)

| Cookie | Durée | Finalité |
|--------|-------|----------|
| `access_token` | Session | Authentification JWT |
| `refresh_token` | 7 jours | Renouvellement de session |
| `entreprise_active` | Session | Contexte multi-entreprise |

### 9.2 Cookies analytiques (avec consentement)

Des outils d'analyse d'audience anonymisés peuvent être utilisés pour améliorer la Plateforme. Le dépôt de ces cookies est conditionné à votre consentement explicite, recueilli via la bannière cookie.

### 9.3 Aucun cookie publicitaire tiers

La Plateforme n'intègre aucun cookie publicitaire ou de suivi comportemental tiers.

---

## Article 10 — Mineurs

La Plateforme est destinée aux professionnels et n'est pas destinée aux mineurs de moins de 18 ans. L'N EXPERTISE ne collecte pas sciemment de données relatives à des mineurs.

---

## Article 11 — Modifications de la Politique

Toute modification substantielle de la présente Politique sera notifiée aux Utilisateurs par e-mail au moins **15 jours** avant son entrée en vigueur. La version en vigueur est accessible en permanence à l'adresse [/legal/confidentialite].

---

## Article 12 — Contact

**L'N EXPERTISE — DPD**
[ADRESSE_SIEGE], Ouagadougou, Burkina Faso
E-mail DPD : [EMAIL_DPO]
E-mail général : [EMAIL_CONTACT]
Téléphone : [TELEPHONE]

---

*L'N EXPERTISE — Ouagadougou, Burkina Faso*
