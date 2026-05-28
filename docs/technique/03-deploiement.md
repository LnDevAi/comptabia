# Guide de déploiement

## Prérequis

| Outil | Version minimale |
|-------|------------------|
| Java (JDK) | 17 LTS |
| Maven | 3.9+ |
| Node.js | 18 LTS |
| PostgreSQL | 16 |
| Redis | 7.x |
| Docker | 24+ |
| Docker Compose | 2.20+ |

---

## Démarrage rapide — Docker Compose

### 1. Cloner le dépôt

```bash
git clone https://github.com/LnDevAi/e-compta-ia-inter.git
cd e-compta-ia-inter
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine (ne jamais committer ce fichier) :

```env
# Base de données
DB_USER=ecompta
DB_PASSWORD=changeme_in_production
DB_NAME=ecompta

# JWT
JWT_SECRET=votre_secret_jwt_base64_min_32_chars
JWT_EXPIRATION=900000
JWT_REFRESH_EXPIRATION=604800000

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# CinetPay (paiements Mobile Money)
CINETPAY_API_KEY=
CINETPAY_SITE_ID=

# Stripe (paiements carte)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=noreply@[DOMAINE]
```

### 3. Lancer la stack complète

```bash
docker-compose up -d
```

**Services démarrés :**
- `backend` → port 8080
- `frontend` → port 4200 (dev) / 80 (prod via Nginx)
- `postgres` → port 5432
- `redis` → port 6379

### 4. Vérifier le démarrage

```bash
docker-compose logs -f backend
# Attendez : "Started EcomptaApplication in X seconds"

curl http://localhost:8080/api/actuator/health
# Réponse : {"status":"UP"}
```

---

## Déploiement manuel — Développement local

### Backend

```bash
cd backend

# Compiler et lancer les tests
mvn clean verify

# Lancer en mode développement
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

**Profil `dev` :** active les logs SQL, désactive Redis obligatoire, active Swagger UI à `/swagger-ui.html`.

### Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start
# → http://localhost:4200
# Le proxy redirige /api/* → http://localhost:8080

# Build de production
npm run build
# Output dans dist/frontend/browser/
```

---

## Variables d'environnement — Référence complète

### Backend (`application.yml`)

```yaml
spring:
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:ecompta}
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2

  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}

  flyway:
    enabled: true
    locations: classpath:db/migration

jwt:
  secret: ${JWT_SECRET}
  expiration: ${JWT_EXPIRATION:900000}        # 15 min
  refresh-expiration: ${JWT_REFRESH_EXPIRATION:604800000}  # 7 jours

app:
  cinetpay:
    api-key: ${CINETPAY_API_KEY:}
    site-id: ${CINETPAY_SITE_ID:}
  stripe:
    secret-key: ${STRIPE_SECRET_KEY:}
    webhook-secret: ${STRIPE_WEBHOOK_SECRET:}
  mail:
    from: ${MAIL_FROM}
```

---

## Build de production

### Backend — JAR exécutable

```bash
cd backend
mvn clean package -DskipTests
# Output : target/ecompta-0.0.1-SNAPSHOT.jar
```

Lancer en production :
```bash
java -jar target/ecompta-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --DB_USER=ecompta \
  --DB_PASSWORD=secret \
  --JWT_SECRET=votre_secret
```

### Frontend — Build optimisé

```bash
cd frontend
npm run build -- --configuration=production
```

Le dossier `dist/frontend/browser/` contient les fichiers statiques à servir via Nginx.

### Configuration Nginx (production)

```nginx
server {
    listen 80;
    server_name [DOMAINE];

    # Frontend Angular (SPA)
    root /var/www/ecompta;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse proxy vers le backend Spring Boot
    location /api/ {
        proxy_pass http://backend:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE — désactiver le buffering pour les notifications temps réel
    location /api/notifications/stream {
        proxy_pass http://backend:8080/api/notifications/stream;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 3600s;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
    }
}
```

---

## CI/CD — GitHub Actions

Le workflow `.github/workflows/ci.yml` (à créer) exécute à chaque push sur `main` :

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: ecompta_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - run: mvn clean verify -q
        working-directory: backend
        env:
          DB_USER: test
          DB_PASSWORD: test
          DB_NAME: ecompta_test

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: npm ci
        working-directory: frontend
      - run: npx tsc --noEmit -p tsconfig.json
        working-directory: frontend
```

---

## Migrations Flyway en production

Les migrations sont appliquées automatiquement au démarrage du backend.

**Procédure pour une nouvelle migration :**

1. Créer le fichier `V{N}__description.sql` dans `backend/src/main/resources/db/migration/`
2. Tester localement : `mvn flyway:migrate -Dflyway.url=... -Dflyway.user=...`
3. Ne **jamais** modifier un script de migration déjà appliqué en production
4. Si un script est corrompu : `mvn flyway:repair` puis relancer

**En cas d'urgence (rollback) :**
Flyway OSS ne supporte pas le rollback automatique. Écrivez un script `V{N+1}__rollback_vN.sql` qui annule les changements manuellement.

---

## Sauvegardes PostgreSQL

### Sauvegarde manuelle

```bash
pg_dump -h localhost -U ecompta -d ecompta -F c -f backup_$(date +%Y%m%d).dump
```

### Restauration

```bash
pg_restore -h localhost -U ecompta -d ecompta -F c backup_20250615.dump
```

### Sauvegarde automatisée (cron)

```cron
0 2 * * * pg_dump -h localhost -U ecompta ecompta | gzip > /backups/ecompta_$(date +\%Y\%m\%d).sql.gz
```

Rétention recommandée : 30 jours quotidien + 12 mois mensuel.

---

## Monitoring et observabilité

### Actuator Spring Boot

Endpoints disponibles en production :
- `GET /api/actuator/health` — état de santé
- `GET /api/actuator/info` — version et métadonnées
- `GET /api/actuator/metrics` — métriques JVM et applicatives

Sécurisez l'accès à l'actuator en production :
```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info
  endpoint:
    health:
      show-details: when-authorized
```

### Logs

Format JSON recommandé en production pour intégration avec un agrégateur (Loki, CloudWatch…) :
```yaml
logging:
  pattern:
    console: '{"timestamp":"%d","level":"%p","logger":"%c","message":"%m"}%n'
```
