# Guide de contribution

Merci de contribuer a ce projet ! Voici les regles et bonnes pratiques a suivre.

---

## Sommaire

- [Code de conduite](#code-de-conduite)
- [Workflow Git](#workflow-git)
- [Creer une Pull Request](#creer-une-pull-request)
- [Conventions de commits](#conventions-de-commits)
- [Standards de code](#standards-de-code)
- [Signaler un bug](#signaler-un-bug)
- [Proposer une fonctionnalite](#proposer-une-fonctionnalite)

---

## Code de conduite

Ce projet applique un code de conduite simple : respect, bienveillance et collaboration. Tout comportement irrespectueux envers les membres de l equipe sera signale a l administrateur du depot.

---

## Workflow Git

Nous suivons un workflow base sur des branches courtes et des PR systematiques.

```
main          ← production stable (protegee)
dev           ← integration (protegee)
feature/xxx   ← nouvelles fonctionnalites
fix/xxx       ← corrections de bugs
chore/xxx     ← maintenance, configuration
```

### Etapes

1. Partir toujours de `dev` pour creer sa branche :
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/ma-fonctionnalite
   ```

2. Travailler sur sa branche, commiter regulierement.

3. Ouvrir une PR vers `dev` quand le travail est pret.

4. Les merges de `dev` vers `main` sont effectues par les mainteneurs apres validation.

---

## Creer une Pull Request

- Le titre doit etre clair et concis (ex. : `feat: ajout du module de connexion`)
- Remplir le template de PR fourni
- Lier l issue concernee si applicable (`Closes #42`)
- Demander une review a au moins **1 membre de l equipe**
- S assurer que la CI passe avant de demander une review

---

## Conventions de commits

Nous utilisons [Conventional Commits](https://www.conventionalcommits.org/) :

| Prefixe | Usage |
|---------|-------|
| `feat:` | Nouvelle fonctionnalite |
| `fix:` | Correction de bug |
| `docs:` | Documentation uniquement |
| `style:` | Formatage, espaces (pas de logique) |
| `refactor:` | Refactoring sans ajout de feature ni fix |
| `test:` | Ajout ou modification de tests |
| `chore:` | Maintenance, dependances, config CI |
| `ci:` | Modifications des workflows CI/CD |

**Exemples :**
```
feat: ajout de l authentification OAuth2
fix: correction du calcul de TVA sur les factures
docs: mise a jour du README avec la stack technique
chore: mise a jour de la version de Node.js vers 20
```

---

## Standards de code

- Ecrire du code lisible et auto-documenté
- Privilegier les petits commits atomiques
- Ne pas commiter de fichiers `.env` ou de secrets
- Toujours lancer les tests en local avant de pousser
- Les PR doivent avoir une couverture de tests suffisante

---

## Signaler un bug

Ouvrez une **Issue** avec le label `bug` en incluant :

- La description du probleme
- Les etapes pour reproduire
- Le comportement attendu vs observe
- Votre environnement (OS, version, navigateur...)

---

## Proposer une fonctionnalite

Ouvrez une **Issue** avec le label `enhancement` en decrivant :

- Le besoin ou le probleme a resoudre
- La solution proposee
- Les alternatives envisagees

---

## Contacts

- **@LnDevAi** — Mainteneur principal
- **@MoussaNEYA** — Contributeur frontend
- **@Yamalr** — Contributeur securite
