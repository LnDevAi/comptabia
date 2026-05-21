# Politique de securite

## Versions supportees

Seules les versions listees ci-dessous recoivent des correctifs de securite actifs :

| Version | Supportee |
|---------|-----------|
| `main`  | Oui       |
| `dev`   | Oui       |
| Autres  | Non       |

---

## Signaler une vulnerabilite

**Ne pas ouvrir une issue publique pour un probleme de securite.**

Si vous decouvrez une vulnerabilite, merci de la signaler de maniere responsable :

1. **Envoyer un rapport prive** via [GitHub Security Advisories](../../security/advisories/new)
2. Inclure dans votre rapport :
   - Une description claire de la vulnerabilite
   - Les etapes pour la reproduire
   - L'impact potentiel (confidentialite, integrite, disponibilite)
   - Si possible, une suggestion de correctif

---

## Delais de reponse

| Etape | Delai cible |
|-------|-------------|
| Accuse de reception | 48 heures |
| Evaluation initiale | 5 jours ouvrables |
| Correctif et divulgation | 30 jours (selon la severite) |

---

## Processus de divulgation

Nous suivons le principe de **divulgation coordonnee** :

1. Vous signalez la vulnerabilite en prive
2. Nous confirmons la reception et evaluons la severite
3. Nous developpons et testons un correctif
4. Nous publions le correctif avec les notes de securite associees
5. Vous etes credite dans les notes de version (sauf demande contraire)

---

## Severite des vulnerabilites

Nous utilisons le referentiel [CVSS v3.1](https://www.first.org/cvss/) pour evaluer la severite :

| Score | Niveau | Priorite de traitement |
|-------|--------|------------------------|
| 9.0 – 10.0 | Critique | Correctif d'urgence sous 48h |
| 7.0 – 8.9  | Eleve   | Correctif sous 7 jours |
| 4.0 – 6.9  | Moyen   | Correctif sous 30 jours |
| 0.1 – 3.9  | Faible  | Correctif planifie |

---

## Bonnes pratiques pour les contributeurs

- Ne jamais commiter de secrets, tokens ou cles API (verifier `.gitignore`)
- Utiliser des variables d'environnement pour toute configuration sensible
- Maintenir les dependances a jour (`npm audit` / `pip-audit`)
- Signaler toute dependance vulnerabilite identifiee dans une PR

---

## Contact

- **Responsable securite** : [@Yamalr](https://github.com/Yamalr)
- **Mainteneur principal** : [@LnDevAi](https://github.com/LnDevAi)
- **GitHub Security Advisories** : [Soumettre un rapport](../../security/advisories/new)
