# Foire aux questions (FAQ)

---

## Compte et accès

**Q : J'ai oublié mon mot de passe. Comment le réinitialiser ?**
Cliquez sur **« Mot de passe oublié »** sur la page de connexion. Saisissez votre adresse e-mail, puis suivez le lien reçu (valable 1 heure).

**Q : Je n'ai pas reçu l'e-mail de confirmation à l'inscription.**
Vérifiez votre dossier Spam/Indésirables. Si le problème persiste après 5 minutes, contactez [EMAIL_CONTACT].

**Q : Mon lien d'invitation a expiré.**
Les liens d'invitation sont valides 48 heures. Demandez à votre Administrateur de vous renvoyer une invitation.

**Q : Puis-je avoir plusieurs comptes avec la même adresse e-mail ?**
Non. Une adresse e-mail est liée à un seul compte utilisateur. En revanche, un compte peut gérer plusieurs entreprises.

---

## Abonnement et facturation

**Q : Le plan FREE est-il vraiment gratuit ?**
Oui, le plan FREE est gratuit et sans limite de durée. Certaines fonctionnalités avancées (IA, trésorerie avancée, consolidation…) sont réservées aux plans payants.

**Q : Puis-je annuler mon abonnement à tout moment ?**
Oui. Depuis **Paramètres › Abonnement**, cliquez **« Résilier »**. L'accès aux fonctionnalités payantes reste actif jusqu'à la fin de la période en cours.

**Q : Mes données sont-elles conservées après résiliation ?**
Oui, pendant 30 jours. Vous pouvez exporter toutes vos données avant cette échéance. Passé ce délai, les données sont supprimées définitivement.

**Q : Comment payer avec Orange Money ou Moov Money ?**
Sur la page de paiement, sélectionnez **Mobile Money**, choisissez votre opérateur et entrez votre numéro. Vous recevrez un code USSD ou une notification push pour confirmer.

**Q : Ma facture ne s'affiche pas correctement.**
Contactez [EMAIL_CONTACT] avec votre numéro de commande. Une facture PDF vous sera renvoyée sous 24 heures ouvrées.

---

## Comptabilité

**Q : Quelle norme comptable la plateforme utilise-t-elle ?**
La plateforme est optimisée pour le **SYSCOHADA Révisé** (adopté par 17 États membres de l'OHADA). Elle peut être configurée pour d'autres référentiels depuis **Paramètres › Entreprise**.

**Q : Puis-je modifier une écriture validée ?**
Non. Une écriture validée est définitive. Pour corriger une erreur, saisissez une **écriture d'extourne** (inversion de l'écriture erronée), puis saisissez la bonne écriture.

**Q : Comment annuler une clôture d'exercice ?**
La clôture d'un exercice est irréversible. Si une erreur est découverte après clôture, créez une écriture de correction dans l'exercice suivant. Contactez votre expert-comptable pour valider la procédure appropriée.

**Q : La balance est déséquilibrée. Que faire ?**
1. Vérifiez les écritures en statut **Brouillon** — elles ne sont pas comptabilisées.
2. Cherchez des écritures avec un seul côté (débit sans crédit).
3. Utilisez le rapport **Anomalies IA** pour détecter automatiquement les problèmes.

**Q : Puis-je gérer plusieurs devises ?**
Oui, avec le module **Devises**. Les taux de change sont configurables manuellement. La devise de tenue de compte principale reste le XOF.

---

## Import & Migration

**Q : Quelle taille maximale pour un fichier d'import ?**
La limite est de **50 Mo** par fichier. Pour des fichiers plus volumineux, découpez-les par période (ex. par trimestre).

**Q : Mon fichier FEC n'est pas accepté. Pourquoi ?**
Vérifiez que :
- Le fichier est au format `.txt` ou `.csv`
- Les colonnes obligatoires sont présentes (`JournalCode`, `EcritureDate`, `CompteNum`, `Debit`, `Credit`)
- L'encodage est Windows-1252 ou UTF-8
- Les dates sont au format `AAAAMMJJ` (format FEC standard)

**Q : Des doublons ont été importés par erreur. Comment les supprimer ?**
Le module Import détecte les doublons par numéro de pièce. Si des doublons ont été importés, utilisez le filtre sur le numéro de pièce dans **Écritures** pour les identifier et les supprimer manuellement.

**Q : L'import s'est arrêté à mi-chemin. Mes données sont-elles corrompues ?**
Non. L'import est transactionnel : soit toutes les lignes valides sont importées, soit rien n'est importé en cas d'erreur critique. Consultez le rapport d'import dans l'onglet **Historique** pour voir ce qui a été traité.

---

## Module IA

**Q : Le Module IA a accès à mes données confidentielles ?**
Le Module IA traite uniquement les données de votre dossier comptable sur la plateforme. Il n'envoie aucune donnée à des services tiers. Voir notre [Politique de Confidentialité](/legal/confidentialite).

**Q : Les suggestions de l'IA sont-elles certifiées ?**
Non. Les suggestions sont des aides à la décision. Elles ne remplacent pas le jugement d'un expert-comptable qualifié. Vous restez responsable des écritures validées.

**Q : Pourquoi les suggestions IA sont-elles peu pertinentes au début ?**
Le modèle s'améliore avec l'utilisation. Dans les premières semaines, les suggestions se basent sur des données générales SYSCOHADA. Elles deviennent personnalisées au fil de vos validations/rejets.

---

## Sécurité et données

**Q : Mes données sont-elles sauvegardées ?**
Oui. La plateforme effectue des sauvegardes chiffrées quotidiennes avec une rétention de 30 jours.

**Q : Que se passe-t-il si la plateforme est indisponible ?**
En cas d'indisponibilité prolongée (> 72h consécutives), un crédit prorata temporis est accordé selon les termes des [CGV](/legal/cgv).

**Q : Comment exporter toutes mes données ?**
Depuis **Paramètres › Mes données**, cliquez **« Exporter mes données »**. Vous recevrez un lien de téléchargement par e-mail sous 30 jours (données personnelles RGPD) ou immédiatement pour les exports comptables standard.

**Q : Comment supprimer mon compte ?**
Depuis **Paramètres › Mon compte**, cliquez **« Supprimer mon compte »**. Cette action est irréversible. Vos données sont supprimées dans les 30 jours.

---

## Support

**Q : Comment contacter le support ?**
- E-mail : [EMAIL_CONTACT]
- Réponse sous 48h (plan STANDARD), 24h (PREMIUM), 4h (ENTERPRISE)

**Q : Puis-je demander une formation personnalisée ?**
Oui. L'N EXPERTISE propose des formations en présentiel et à distance sur ComptaBIA. Contactez [EMAIL_CONTACT] pour un devis.

**Q : Y a-t-il une application mobile ?**
Pas encore. La plateforme est accessible depuis tout navigateur web sur mobile, tablette et ordinateur (design responsive). Une application native est en cours de développement.
