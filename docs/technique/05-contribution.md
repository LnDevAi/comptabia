# Guide de contribution

Merci de contribuer à e-Compta IA ! Ce guide décrit les conventions à respecter pour maintenir la qualité du code.

---

## Workflow Git

### Stratégie de branches

```
main          ← Production (protégé, PR obligatoire, 1 approbation)
  └── feature/nom-feature    ← Nouvelle fonctionnalité
  └── fix/nom-bug             ← Correction de bug
  └── refactor/nom-refactor   ← Refactoring sans nouvelle feature
  └── docs/nom-doc            ← Documentation uniquement
```

### Workflow type

```bash
# 1. Synchroniser main
git checkout main && git pull origin main

# 2. Créer une branche de feature
git checkout -b feature/ma-nouvelle-feature

# 3. Travailler, committer
git add <fichiers>
git commit -m "feat: description claire de la feature"

# 4. Pousser et ouvrir une PR
git push -u origin feature/ma-nouvelle-feature
gh pr create --title "feat: ..." --body-file pr_body.md --base main
```

### Utilisation des worktrees (développement parallèle)

Pour travailler sur plusieurs branches simultanément sans changer de répertoire :

```bash
# Depuis le dépôt principal
git worktree add worktrees/ma-feature feature/ma-feature

# Travailler dans le worktree
cd worktrees/ma-feature

# Partager node_modules (évite une réinstallation)
New-Item -ItemType Junction -Path frontend/node_modules \
  -Target ../main-worktree/frontend/node_modules
```

---

## Conventions de commit (Conventional Commits)

Format : `<type>(<scope>): <description>`

| Type | Usage |
|------|-------|
| `feat` | Nouvelle fonctionnalité |
| `fix` | Correction de bug |
| `refactor` | Refactoring sans changement de comportement |
| `docs` | Documentation uniquement |
| `test` | Ajout ou modification de tests |
| `chore` | Tâches de maintenance (dépendances, CI…) |
| `perf` | Amélioration de performance |

**Exemples valides :**
```
feat: module Consolidation multi-entités
fix: correction calcul TVA sur factures en devise
refactor: extraction service PaiementHelper
docs: guide déploiement Docker Compose
test: couverture service MigrationService
```

---

## Checklist de Pull Request

Avant d'ouvrir une PR, vérifiez :

### Backend
- [ ] `mvn clean compile -q` — zéro erreur de compilation
- [ ] `mvn test` — tous les tests passent
- [ ] Pas de `System.out.println()` oublié
- [ ] Pas de credentials en dur dans le code
- [ ] Les nouvelles entités JPA ont `entreprise_id` (multi-tenancy)
- [ ] Toute nouvelle table a un script Flyway `V{N}__description.sql`
- [ ] Les endpoints REST utilisent `@PreAuthorize` pour le contrôle d'accès
- [ ] Les requêtes SQL natives filtrent sur `entreprise_id`

### Frontend
- [ ] `npx tsc --noEmit -p tsconfig.json` — zéro erreur TypeScript
- [ ] Composants standalone avec `ChangeDetectionStrategy.OnPush` si possible
- [ ] Les nouveaux services sont injectables via `inject()` (pas de constructeur DI)
- [ ] Les nouvelles routes sont lazy-loaded dans `app.routes.ts`
- [ ] Pas de `console.log()` oublié en production

### Général
- [ ] Description PR claire (contexte + changements + plan de test)
- [ ] Pas de fichiers `.env`, secrets ou tokens commités

---

## Architecture Backend — Conventions

### Structure d'un module

```
controller/
  ImportMigrationController.java    # @RestController, validation des entrées
service/
  migration/
    MigrationService.java           # Logique métier, @Service
domain/
  ImportHistorique.java             # @Entity JPA
repository/
  ImportHistoriqueRepository.java   # extends JpaRepository<>
dto/
  migration/
    ImportResultDto.java            # record Java (immuable)
    PreviewDto.java
```

### Règles

- **Contrôleurs** : valident les entrées, délèguent au service, gèrent les erreurs HTTP
- **Services** : contiennent la logique métier, jamais de logique HTTP
- **DTOs** : préférer les `record` Java pour l'immuabilité
- **Repositories** : Spring Data uniquement, nommage explicite des méthodes
- **Pas de logique dans les entités JPA** (pas de méthodes métier dans `@Entity`)

### Gestion des exceptions

```java
// Exception métier personnalisée
throw new BusinessException("Compte " + numero + " introuvable");

// Erreur de validation
throw new ValidationException("Débit et crédit déséquilibrés");
```

Les exceptions sont capturées par `GlobalExceptionHandler` et transformées en réponses JSON standard.

---

## Architecture Frontend — Conventions

### Structure d'un composant

```typescript
// Toujours standalone
@Component({
  selector: 'app-mon-module',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `...`   // inline pour les petits composants
})
export class MonModuleComponent {
  // Injection via inject() (pas de constructeur)
  private service = inject(MonService);
  private router = inject(Router);

  // État via signals
  items = signal<Item[]>([]);
  loading = signal(false);
  total = computed(() => this.items().length);

  // Pas d'abonnements non résiliés — utiliser toSignal() ou takeUntilDestroyed()
}
```

### Règles

- **Signals** pour l'état local, `computed()` pour les valeurs dérivées
- **`inject()`** pour l'injection de dépendances (jamais de constructeur DI)
- **Lazy loading** obligatoire pour tous les composants dans les routes
- **Pas de `any`** en TypeScript — toujours typer explicitement
- **Tailwind CSS** pour les styles — pas de CSS global sauf pour les variables

---

## Migrations de base de données

### Créer une migration

```bash
# Trouver le dernier numéro de version
ls backend/src/main/resources/db/migration/

# Créer le fichier suivant
touch backend/src/main/resources/db/migration/V62__description_migration.sql
```

### Règles Flyway

```sql
-- ✅ Bon — opérations idempotentes
CREATE TABLE IF NOT EXISTS ma_table (...);
ALTER TABLE ma_table ADD COLUMN IF NOT EXISTS nouvelle_col VARCHAR(50);

-- ✅ Bon — index avec IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_ma_table_col ON ma_table(col);

-- ❌ Interdit — ne jamais modifier une migration existante appliquée
-- ❌ Interdit — DROP TABLE sans sauvegarde préalable
```

### Template de migration

```sql
-- V62__description_claire.sql
-- Description : Ce que fait cette migration et pourquoi
-- Auteur : Prénom NOM
-- Date : YYYY-MM-DD

BEGIN;

-- Corps de la migration
CREATE TABLE IF NOT EXISTS nouvelle_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    -- colonnes métier
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nouvelle_table_ent
    ON nouvelle_table(entreprise_id, created_at DESC);

COMMIT;
```

---

## Tests

### Backend — Tests unitaires

```java
@ExtendWith(MockitoExtension.class)
class MigrationServiceTest {

    @Mock private CompteComptableRepository compteRepo;
    @Mock private EcritureComptableRepository ecritureRepo;
    @InjectMocks private MigrationService service;

    @Test
    void preview_fec_detecte_separateur_tabulation() {
        // Given
        byte[] contenu = "JournalCode\tEcritureDate\t...\n".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", contenu);

        // When
        PreviewDto result = service.preview(file, "FEC");

        // Then
        assertThat(result.separateurDetecte()).isEqualTo("TAB");
    }
}
```

### Frontend — Vérification TypeScript

```bash
cd frontend
npx tsc --noEmit -p tsconfig.json
```

Les tests Angular (`ng test`) sont à ajouter progressivement pour les services critiques.

---

## Revue de code

### Ce que l'on vérifie

1. **Sécurité** : isolation multi-tenant, contrôle d'accès, pas de fuite de données
2. **Logique métier** : conformité SYSCOHADA, équilibre débit/crédit
3. **Qualité** : lisibilité, nommage, pas de code mort
4. **Performance** : index manquants, N+1 queries, pagination
5. **Tests** : couverture des cas limites (fichier vide, format invalide…)

### Ce que l'on ne bikeshed pas

- Style de formatage (géré par les linters)
- Ordre des imports
- Noms de variables locales évidents
