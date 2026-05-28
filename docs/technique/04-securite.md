# Sécurité — e-Compta IA

## Modèle de sécurité

La sécurité repose sur quatre couches indépendantes :

```
1. Transport      HTTPS / TLS 1.3 (obligatoire en production)
2. Authentification  JWT (access + refresh tokens)
3. Autorisation   Spring Security + contrôle par rôle
4. Isolation      Filtre Hibernate multi-tenant par entreprise_id
```

---

## Authentification JWT

### Tokens

| Token | Durée | Usage |
|-------|-------|-------|
| `access_token` | 15 minutes | Authentification des requêtes API |
| `refresh_token` | 7 jours | Renouvellement de l'access token |

### Structure du payload JWT

```json
{
  "sub": "user@example.com",
  "entrepriseId": "uuid-entreprise",
  "role": "COMPTABLE",
  "plan": "PREMIUM",
  "iat": 1750000000,
  "exp": 1750000900
}
```

### Algorithme de signature
`HS256` (HMAC-SHA256) avec clé secrète de 32 octets minimum, configurée via la variable d'environnement `JWT_SECRET`.

> **Production :** utilisez une clé aléatoire de 64 octets minimum, générée par `openssl rand -base64 64`.

### Blacklist Redis

À la déconnexion (`POST /api/auth/logout`), le token est ajouté à Redis avec une TTL = durée restante du token.

```
SET blacklist:<token_hash> 1 EX <ttl_seconds>
```

Le filtre `JwtAuthFilter` consulte Redis à chaque requête. En cas d'indisponibilité Redis, le comportement est **fail-open** (le token est accepté) pour éviter de bloquer le service en développement. En production, Redis doit être hautement disponible.

---

## Autorisation par rôle (RBAC)

### Rôles

| Rôle | Droits |
|------|--------|
| `ADMIN` | Lecture/écriture sur toutes les ressources + gestion des utilisateurs |
| `COMPTABLE` | Lecture/écriture sur les ressources comptables, pas de gestion des utilisateurs |
| `LECTEUR` | Lecture seule, aucune modification |

### Contrôle dans les contrôleurs

```java
@PreAuthorize("hasAnyRole('ADMIN', 'COMPTABLE')")
@PostMapping("/ecritures")
public ResponseEntity<EcritureDto> creer(@RequestBody EcritureDto dto) { ... }

@PreAuthorize("hasRole('ADMIN')")
@DeleteMapping("/utilisateurs/{id}")
public ResponseEntity<Void> supprimer(@PathVariable UUID id) { ... }
```

### Contrôle par plan (licences)

Le `LicenceGuard` Angular vérifie côté frontend si le module est inclus dans le plan actif. Le backend vérifie indépendamment avec `@PreAuthorize("@licenceService.hasModule('IA')")`.

---

## Multi-tenancy — Isolation des données

### Filtre Hibernate

Toutes les entités métier portent l'annotation :
```java
@Filter(name = "tenantFilter", condition = "entreprise_id = :tenantId")
```

Ce filtre est activé dans `TenantAwareSession` à chaque requête :
```java
session.enableFilter("tenantFilter").setParameter("tenantId", getCurrentTenantId());
```

### Garanties d'isolation

- Un utilisateur **ne peut jamais** accéder aux données d'une entreprise à laquelle il n'appartient pas.
- Le filtre s'applique à **toutes** les requêtes JPA (find, JPQL, Criteria API).
- Les requêtes SQL natives doivent inclure manuellement la clause `WHERE entreprise_id = :tenantId`.

### Vérification en revue de code

À chaque PR touchant une requête SQL native, vérifiez la présence de la clause `entreprise_id`.

---

## Mots de passe

### Hachage

Tous les mots de passe sont hachés avec **BCrypt** (facteur de coût 12) :
```java
private final PasswordEncoder encoder = new BCryptPasswordEncoder(12);
String hash = encoder.encode(plainPassword);
boolean valid = encoder.matches(plainPassword, hash);
```

### Politique de mots de passe

- Longueur minimale : 8 caractères
- Pas de règle de complexité imposée côté serveur (recommandée côté client)
- Pas de stockage du mot de passe en clair, jamais

---

## CORS

La configuration CORS autorise les origines définies dans `application.yml` :

```yaml
app:
  cors:
    allowed-origins:
      - http://localhost:4200
      - https://[DOMAINE]
```

En production, la liste `allowed-origins` ne doit contenir que les domaines officiels.

**Configuration Spring :**
```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowedOrigins(allowedOrigins);
    config.setAllowedMethods(List.of("GET","POST","PUT","DELETE","OPTIONS"));
    config.setAllowedHeaders(List.of("Authorization","Content-Type"));
    config.setAllowCredentials(true);
    config.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", config);
    return source;
}
```

---

## Protection contre les attaques courantes

### Injection SQL

- Toutes les requêtes passent par Spring Data JPA (requêtes paramétrées)
- Les requêtes natives utilisent des `NamedParameter` — jamais de concaténation de chaînes

### XSS

- L'API produit du JSON — pas de HTML rendu côté serveur
- Angular échappe automatiquement les interpolations `{{ }}` et `[innerHTML]` pour les données non marquées `trustHtml`

### CSRF

Pas de cookies de session — les JWT dans les headers `Authorization` ne sont pas vulnérables au CSRF.

### Rate limiting

Configuré via Spring Boot Actuator ou un reverse proxy Nginx :
```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

---

## Checklist sécurité avant mise en production

- [ ] `JWT_SECRET` généré aléatoirement (64 octets minimum)
- [ ] `DB_PASSWORD` fort et unique
- [ ] HTTPS activé (certificat TLS valide)
- [ ] CORS restreint aux domaines officiels
- [ ] Actuator restreint (`health` et `info` uniquement)
- [ ] Redis avec authentification (`requirepass`)
- [ ] Logs de sécurité actifs (connexions, échecs d'auth)
- [ ] Sauvegardes automatiques testées
- [ ] Headers HTTP de sécurité configurés dans Nginx :
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
  - `Content-Security-Policy: default-src 'self'`

---

## Signalement de vulnérabilités

Pour signaler une vulnérabilité de sécurité, contactez **[EMAIL_CONTACT]** en objet **[SECURITY]**.
Ne divulguez pas publiquement la vulnérabilité avant qu'un correctif soit disponible.
