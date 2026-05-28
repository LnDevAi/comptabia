import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

type TechDocId = 'architecture' | 'api' | 'deploiement' | 'securite' | 'contribution' | 'migrations-db';

interface TechSection { titre: string; contenu: string; }
interface TechDoc { id: TechDocId; titre: string; description: string; icone: string; badge?: string; sections: TechSection[]; }

const TECH_DOCS: TechDoc[] = [
  {
    id: 'architecture',
    titre: 'Architecture système',
    description: 'Stack technique, multi-tenancy, structure du projet, SSE.',
    icone: '🏗️',
    sections: [
      {
        titre: 'Vue d\'ensemble',
        contenu: `<pre class="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed">┌─────────────────────────────────────────┐
│         Clients (navigateurs)            │
│      Angular 17 SPA — Tailwind CSS      │
└──────────────┬──────────────────────────┘
               │ HTTPS / REST JSON
┌──────────────▼──────────────────────────┐
│      API REST — Spring Boot 3.2.5        │
│   Java 17 · Maven · JWT · Multitenancy  │
├─────────────────────────────────────────┤
│  Services métier │ Module IA │ Import   │
├─────────────────────────────────────────┤
│       Spring Data JPA · Hibernate 6     │
└──────────┬──────────────────┬───────────┘
           │                  │
    ┌──────▼──────┐   ┌──────▼──────┐
    │ PostgreSQL  │   │    Redis     │
    │  port 5432  │   │  port 6379  │
    └─────────────┘   └─────────────┘</pre>`
      },
      {
        titre: 'Stack Backend',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Composant</th><th class="border border-gray-200 px-3 py-2 text-left">Technologie</th><th class="border border-gray-200 px-3 py-2 text-left">Version</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2">Langage</td><td class="border border-gray-200 px-3 py-2 font-mono">Java</td><td class="border border-gray-200 px-3 py-2">17 LTS</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Framework</td><td class="border border-gray-200 px-3 py-2 font-mono">Spring Boot</td><td class="border border-gray-200 px-3 py-2">3.2.5</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Base de données</td><td class="border border-gray-200 px-3 py-2 font-mono">PostgreSQL</td><td class="border border-gray-200 px-3 py-2">16</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Cache</td><td class="border border-gray-200 px-3 py-2 font-mono">Redis</td><td class="border border-gray-200 px-3 py-2">7.x</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Migrations</td><td class="border border-gray-200 px-3 py-2 font-mono">Flyway</td><td class="border border-gray-200 px-3 py-2">9.x</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Excel</td><td class="border border-gray-200 px-3 py-2 font-mono">Apache POI</td><td class="border border-gray-200 px-3 py-2">5.2.5</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Stack Frontend',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Composant</th><th class="border border-gray-200 px-3 py-2 text-left">Technologie</th><th class="border border-gray-200 px-3 py-2 text-left">Version</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2">Framework</td><td class="border border-gray-200 px-3 py-2 font-mono">Angular</td><td class="border border-gray-200 px-3 py-2">17</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Style</td><td class="border border-gray-200 px-3 py-2 font-mono">Tailwind CSS</td><td class="border border-gray-200 px-3 py-2">3.x</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Langage</td><td class="border border-gray-200 px-3 py-2 font-mono">TypeScript</td><td class="border border-gray-200 px-3 py-2">5.x</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">État</td><td class="border border-gray-200 px-3 py-2 font-mono">Angular Signals</td><td class="border border-gray-200 px-3 py-2">17+</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Multi-tenancy',
        contenu: `<p class="text-sm text-gray-700">L'isolation des données entre entreprises est assurée par un <strong>filtre Hibernate</strong> activé à chaque session :</p>
        <ol class="list-decimal pl-5 space-y-1 mt-3 text-sm text-gray-600">
          <li>Chaque JWT contient l'<code class="bg-gray-100 px-1 rounded">entrepriseId</code> de l'entreprise active.</li>
          <li>Le filtre <code class="bg-gray-100 px-1 rounded">TenantFilter</code> injecte automatiquement <code class="bg-gray-100 px-1 rounded">WHERE entreprise_id = :tenantId</code> sur toutes les requêtes JPA.</li>
          <li>Toutes les entités métier portent <code class="bg-gray-100 px-1 rounded">@Filter("tenantFilter")</code>.</li>
        </ol>
        <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">⚠️ Les requêtes SQL natives doivent filtrer manuellement sur <code>entreprise_id</code>.</div>`
      },
      {
        titre: 'Structure du projet',
        contenu: `<pre class="bg-gray-900 text-gray-300 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed">e-compta-ia-inter/
├── backend/src/main/java/com/edefence/ecompta/
│   ├── controller/     # @RestController
│   ├── service/        # @Service (logique métier)
│   ├── domain/         # @Entity JPA
│   ├── repository/     # Spring Data JPA
│   ├── dto/            # records Java
│   └── security/       # JWT, filtres
├── frontend/src/app/
│   ├── core/guards/    # AuthGuard, LicenceGuard
│   ├── core/services/  # Services Angular
│   ├── features/       # Composants (lazy loaded)
│   └── shared/         # Layout, Toast
├── docs/               # Documentation
└── docker-compose.yml</pre>`
      }
    ]
  },
  {
    id: 'api',
    titre: 'API REST',
    description: 'Endpoints, authentification JWT, formats de requête et réponse.',
    icone: '🔌',
    sections: [
      {
        titre: 'Informations générales',
        contenu: `<div class="space-y-2 text-sm">
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="font-medium w-28 shrink-0 text-gray-500">Base URL</span>
            <code class="font-mono text-emerald-700">https://[DOMAINE]/api</code>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="font-medium w-28 shrink-0 text-gray-500">Auth</span>
            <code class="font-mono text-emerald-700">Authorization: Bearer &lt;token&gt;</code>
          </div>
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="font-medium w-28 shrink-0 text-gray-500">Format</span>
            <code class="font-mono text-emerald-700">application/json · UTF-8</code>
          </div>
        </div>`
      },
      {
        titre: 'Authentification',
        contenu: `<div class="space-y-4">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-mono font-bold rounded">POST</span>
              <code class="text-sm font-mono text-gray-800">/auth/login</code>
            </div>
            <pre class="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg overflow-x-auto">// Corps
{"email":"user@example.com","password":"***"}

// Réponse 200
{"accessToken":"eyJ...","refreshToken":"eyJ...",
 "user":{"id":"uuid","nom":"...","role":"COMPTABLE","plan":"PREMIUM"}}</pre>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-mono font-bold rounded">POST</span>
              <code class="text-sm font-mono text-gray-800">/auth/refresh</code>
              <span class="text-xs text-gray-500">Header: Bearer &lt;refreshToken&gt;</span>
            </div>
            <pre class="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg overflow-x-auto">// Réponse 200
{"accessToken":"eyJ..."}</pre>
          </div>
        </div>`
      },
      {
        titre: 'Écritures comptables',
        contenu: `<div class="space-y-3">
          <div class="flex items-center gap-2"><span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono font-bold rounded">GET</span><code class="text-sm font-mono">/ecritures?journal=VT&page=0&size=20</code></div>
          <div class="flex items-center gap-2"><span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-mono font-bold rounded">POST</span><code class="text-sm font-mono">/ecritures</code><span class="text-xs text-gray-500 ml-1">— Σ débit = Σ crédit obligatoire</span></div>
          <div class="flex items-center gap-2"><span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-mono font-bold rounded">PUT</span><code class="text-sm font-mono">/ecritures/{id}/valider</code><span class="text-xs text-gray-500 ml-1">— irréversible</span></div>
          <div class="flex items-center gap-2"><span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-mono font-bold rounded">DEL</span><code class="text-sm font-mono">/ecritures/{id}</code><span class="text-xs text-gray-500 ml-1">— BROUILLON uniquement</span></div>
        </div>`
      },
      {
        titre: 'Import & Migration',
        contenu: `<div class="space-y-3">
          <div class="flex items-center gap-2"><span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-mono font-bold rounded">POST</span><code class="text-sm font-mono">/migration/preview</code><span class="text-xs text-gray-500 ml-1">multipart: file + format</span></div>
          <div class="flex items-center gap-2"><span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-mono font-bold rounded">POST</span><code class="text-sm font-mono">/migration/importer</code><span class="text-xs text-gray-500 ml-1">multipart: file + format + typeDonnees + mapping</span></div>
          <div class="flex items-center gap-2"><span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono font-bold rounded">GET</span><code class="text-sm font-mono">/migration/historique</code></div>
        </div>`
      },
      {
        titre: 'Codes d\'erreur',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Code</th><th class="border border-gray-200 px-3 py-2 text-left">Signification</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-emerald-700">200/201/204</td><td class="border border-gray-200 px-3 py-2">Succès</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-amber-700">400</td><td class="border border-gray-200 px-3 py-2">Validation échouée</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-amber-700">401</td><td class="border border-gray-200 px-3 py-2">Non authentifié</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-amber-700">403</td><td class="border border-gray-200 px-3 py-2">Non autorisé (rôle insuffisant)</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-amber-700">409</td><td class="border border-gray-200 px-3 py-2">Conflit (doublon, écriture déjà validée)</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-amber-700">422</td><td class="border border-gray-200 px-3 py-2">Règle métier (déséquilibre débit/crédit)</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-red-700">500</td><td class="border border-gray-200 px-3 py-2">Erreur interne</td></tr>
          </tbody>
        </table></div>`
      }
    ]
  },
  {
    id: 'deploiement',
    titre: 'Déploiement',
    description: 'Docker Compose, variables d\'environnement, Nginx, CI/CD.',
    icone: '🚢',
    sections: [
      {
        titre: 'Prérequis',
        contenu: `<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div class="p-3 bg-gray-50 rounded-lg text-center"><div class="font-mono font-bold text-gray-800">Java 17</div><div class="text-xs text-gray-500 mt-1">JDK LTS</div></div>
          <div class="p-3 bg-gray-50 rounded-lg text-center"><div class="font-mono font-bold text-gray-800">Maven 3.9+</div><div class="text-xs text-gray-500 mt-1">Build backend</div></div>
          <div class="p-3 bg-gray-50 rounded-lg text-center"><div class="font-mono font-bold text-gray-800">Node 18 LTS</div><div class="text-xs text-gray-500 mt-1">Build frontend</div></div>
          <div class="p-3 bg-gray-50 rounded-lg text-center"><div class="font-mono font-bold text-gray-800">PostgreSQL 16</div><div class="text-xs text-gray-500 mt-1">Base de données</div></div>
          <div class="p-3 bg-gray-50 rounded-lg text-center"><div class="font-mono font-bold text-gray-800">Redis 7</div><div class="text-xs text-gray-500 mt-1">Cache / Sessions</div></div>
          <div class="p-3 bg-gray-50 rounded-lg text-center"><div class="font-mono font-bold text-gray-800">Docker 24+</div><div class="text-xs text-gray-500 mt-1">Optionnel</div></div>
        </div>`
      },
      {
        titre: 'Docker Compose — Démarrage rapide',
        contenu: `<pre class="bg-gray-900 text-gray-300 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed"># 1. Cloner le dépôt
git clone https://github.com/LnDevAi/e-compta-ia-inter.git
cd e-compta-ia-inter

# 2. Créer le fichier .env (ne jamais committer !)
cat > .env << 'EOF'
DB_USER=ecompta
DB_PASSWORD=changeme
JWT_SECRET=votre_secret_64_octets_minimum
CINETPAY_API_KEY=
STRIPE_SECRET_KEY=
MAIL_HOST=smtp.example.com
EOF

# 3. Lancer
docker-compose up -d

# 4. Vérifier
curl http://localhost:8080/api/actuator/health
# → {"status":"UP"}</pre>`
      },
      {
        titre: 'Variables d\'environnement clés',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Variable</th><th class="border border-gray-200 px-3 py-2 text-left">Description</th><th class="border border-gray-200 px-3 py-2 text-left">Requis</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-xs">DB_USER / DB_PASSWORD</td><td class="border border-gray-200 px-3 py-2">Credentials PostgreSQL</td><td class="border border-gray-200 px-3 py-2 text-red-600 font-medium">Oui</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-xs">JWT_SECRET</td><td class="border border-gray-200 px-3 py-2">Clé HMAC-SHA256 (min 32 octets)</td><td class="border border-gray-200 px-3 py-2 text-red-600 font-medium">Oui</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-xs">CINETPAY_API_KEY</td><td class="border border-gray-200 px-3 py-2">Paiements Mobile Money</td><td class="border border-gray-200 px-3 py-2 text-gray-400">Paiements</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-xs">STRIPE_SECRET_KEY</td><td class="border border-gray-200 px-3 py-2">Paiements carte</td><td class="border border-gray-200 px-3 py-2 text-gray-400">Paiements</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-xs">MAIL_HOST / MAIL_USERNAME</td><td class="border border-gray-200 px-3 py-2">Serveur SMTP</td><td class="border border-gray-200 px-3 py-2 text-gray-400">Emails</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Build de production',
        contenu: `<pre class="bg-gray-900 text-gray-300 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed"># Backend — JAR exécutable
cd backend && mvn clean package -DskipTests
java -jar target/ecompta-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=prod \
  --DB_PASSWORD=secret \
  --JWT_SECRET=votre_secret

# Frontend — Build optimisé
cd frontend && npm run build -- --configuration=production
# Output : dist/frontend/browser/ → servir via Nginx</pre>`
      }
    ]
  },
  {
    id: 'securite',
    titre: 'Sécurité',
    description: 'JWT, RBAC, multi-tenancy, CORS, checklist production.',
    icone: '🔒',
    badge: 'Important',
    sections: [
      {
        titre: 'Modèle de sécurité',
        contenu: `<div class="space-y-2">
          <div class="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span class="text-lg shrink-0">1️⃣</span>
            <div><strong class="text-emerald-900">Transport</strong> <span class="text-emerald-700 text-sm">— HTTPS / TLS 1.3 obligatoire en production</span></div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span class="text-lg shrink-0">2️⃣</span>
            <div><strong class="text-blue-900">Authentification</strong> <span class="text-blue-700 text-sm">— JWT access (15 min) + refresh (7 jours)</span></div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <span class="text-lg shrink-0">3️⃣</span>
            <div><strong class="text-purple-900">Autorisation</strong> <span class="text-purple-700 text-sm">— Spring Security + RBAC (ADMIN / COMPTABLE / LECTEUR)</span></div>
          </div>
          <div class="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <span class="text-lg shrink-0">4️⃣</span>
            <div><strong class="text-amber-900">Isolation</strong> <span class="text-amber-700 text-sm">— Filtre Hibernate multi-tenant par <code class="font-mono">entreprise_id</code></span></div>
          </div>
        </div>`
      },
      {
        titre: 'Payload JWT',
        contenu: `<pre class="bg-gray-900 text-green-400 text-xs p-4 rounded-xl overflow-x-auto">{
  "sub": "user@example.com",
  "entrepriseId": "uuid-entreprise",
  "role": "COMPTABLE",
  "plan": "PREMIUM",
  "iat": 1750000000,
  "exp": 1750000900  // +15 minutes
}</pre>
        <p class="text-sm text-gray-600 mt-2">Algorithme : <strong>HS256</strong>. Clé secrète minimum 32 octets. En production : <code class="bg-gray-100 px-1 rounded font-mono text-xs">openssl rand -base64 64</code>.</p>`
      },
      {
        titre: 'Mots de passe',
        contenu: `<p class="text-sm text-gray-700">Hachage <strong>BCrypt facteur 12</strong> — jamais de mot de passe en clair. Longueur minimale : 8 caractères.</p>
        <pre class="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg mt-3 overflow-x-auto">// Java
PasswordEncoder encoder = new BCryptPasswordEncoder(12);
String hash = encoder.encode(plainPassword);
boolean ok = encoder.matches(plain, hash);</pre>`
      },
      {
        titre: 'Checklist production',
        contenu: `<div class="space-y-2 text-sm">
          <label class="flex items-start gap-2"><input type="checkbox" class="mt-0.5 shrink-0"><span><code class="font-mono text-xs bg-gray-100 px-1 rounded">JWT_SECRET</code> généré aléatoirement (64 octets)</span></label>
          <label class="flex items-start gap-2"><input type="checkbox" class="mt-0.5 shrink-0"><span>HTTPS activé avec certificat TLS valide</span></label>
          <label class="flex items-start gap-2"><input type="checkbox" class="mt-0.5 shrink-0"><span>CORS restreint aux domaines officiels</span></label>
          <label class="flex items-start gap-2"><input type="checkbox" class="mt-0.5 shrink-0"><span>Actuator restreint (<code class="font-mono text-xs">health</code> et <code class="font-mono text-xs">info</code> uniquement)</span></label>
          <label class="flex items-start gap-2"><input type="checkbox" class="mt-0.5 shrink-0"><span>Redis avec <code class="font-mono text-xs">requirepass</code> activé</span></label>
          <label class="flex items-start gap-2"><input type="checkbox" class="mt-0.5 shrink-0"><span>Sauvegardes PostgreSQL automatiques testées</span></label>
          <label class="flex items-start gap-2"><input type="checkbox" class="mt-0.5 shrink-0"><span>Headers HTTP sécurité dans Nginx (<code class="font-mono text-xs">HSTS, X-Frame-Options, CSP</code>)</span></label>
        </div>`
      }
    ]
  },
  {
    id: 'contribution',
    titre: 'Guide de contribution',
    description: 'Workflow Git, conventions commits, checklist PR, tests.',
    icone: '🛠️',
    sections: [
      {
        titre: 'Workflow Git',
        contenu: `<pre class="bg-gray-900 text-gray-300 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed"># 1. Synchroniser main
git checkout main && git pull origin main

# 2. Créer une branche
git checkout -b feature/ma-feature

# 3. Committer
git add &lt;fichiers&gt;
git commit -m "feat: description claire"

# 4. PR
git push -u origin feature/ma-feature
gh pr create --title "feat: ..." --body-file pr_body.md</pre>

        <div class="mt-4 overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Branche</th><th class="border border-gray-200 px-3 py-2 text-left">Usage</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono">main</td><td class="border border-gray-200 px-3 py-2">Production — PR obligatoire, 1 approbation</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono">feature/*</td><td class="border border-gray-200 px-3 py-2">Nouvelles fonctionnalités</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono">fix/*</td><td class="border border-gray-200 px-3 py-2">Corrections de bugs</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono">docs/*</td><td class="border border-gray-200 px-3 py-2">Documentation uniquement</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Conventions de commit',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Type</th><th class="border border-gray-200 px-3 py-2 text-left">Usage</th><th class="border border-gray-200 px-3 py-2 text-left">Exemple</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-emerald-700">feat</td><td class="border border-gray-200 px-3 py-2">Nouvelle fonctionnalité</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">feat: module Consolidation</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-red-700">fix</td><td class="border border-gray-200 px-3 py-2">Correction de bug</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">fix: calcul TVA en devise</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-blue-700">refactor</td><td class="border border-gray-200 px-3 py-2">Refactoring</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">refactor: extraction PaiementHelper</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-purple-700">docs</td><td class="border border-gray-200 px-3 py-2">Documentation</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">docs: guide déploiement</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-gray-700">test</td><td class="border border-gray-200 px-3 py-2">Tests</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">test: couverture MigrationService</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Checklist PR — Backend',
        contenu: `<div class="space-y-1.5 text-sm">
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span><code class="font-mono text-xs">mvn clean compile -q</code> — zéro erreur</span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Nouvelles entités JPA avec <code class="font-mono text-xs">entreprise_id</code></span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Nouvelle table → script Flyway <code class="font-mono text-xs">V{N}__description.sql</code></span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Endpoints REST avec <code class="font-mono text-xs">@PreAuthorize</code></span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Requêtes SQL natives filtrent sur <code class="font-mono text-xs">entreprise_id</code></span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Pas de credentials en dur dans le code</span></label>
        </div>`
      },
      {
        titre: 'Checklist PR — Frontend',
        contenu: `<div class="space-y-1.5 text-sm">
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span><code class="font-mono text-xs">npx tsc --noEmit</code> — zéro erreur TypeScript</span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Composants standalone avec <code class="font-mono text-xs">ChangeDetectionStrategy.OnPush</code></span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Injection via <code class="font-mono text-xs">inject()</code>, pas de constructeur DI</span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Nouvelles routes lazy-loaded dans <code class="font-mono text-xs">app.routes.ts</code></span></label>
          <label class="flex items-center gap-2"><input type="checkbox" class="shrink-0"><span>Pas de <code class="font-mono text-xs">console.log()</code> oublié</span></label>
        </div>`
      }
    ]
  },
  {
    id: 'migrations-db',
    titre: 'Migrations base de données',
    description: 'Flyway, historique V1→V61, schémas des tables clés.',
    icone: '🗄️',
    sections: [
      {
        titre: 'Principes Flyway',
        contenu: `<div class="space-y-3">
          <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <strong>Convention :</strong> <code class="font-mono">V{N}__{description}.sql</code> dans <code class="font-mono">backend/src/main/resources/db/migration/</code>
          </div>
          <div class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            <strong>⚠️ Règle absolue :</strong> Ne jamais modifier un script déjà appliqué en production. En cas d'erreur → créer <code class="font-mono">V{N+1}__correctif.sql</code>.
          </div>
          <div class="space-y-1 text-sm">
            <p>✅ <code class="font-mono text-xs">ddl-auto: none</code> — Hibernate ne touche jamais le schéma</p>
            <p>✅ <code class="font-mono text-xs">flyway.repair</code> si checksum invalide (développement)</p>
            <p>✅ <code class="font-mono text-xs">CREATE TABLE IF NOT EXISTS</code> — opérations idempotentes</p>
          </div>
        </div>`
      },
      {
        titre: 'Migrations récentes (V55–V61)',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Version</th><th class="border border-gray-200 px-3 py-2 text-left">Description</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-xs">V55</td><td class="border border-gray-200 px-3 py-2">Calendrier fiscal et échéances</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-xs">V56</td><td class="border border-gray-200 px-3 py-2">Déclarations sociales</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-xs">V57–V59</td><td class="border border-gray-200 px-3 py-2">Documents RH, réglementaires, pilotage global</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono text-xs font-bold text-amber-700">V60</td><td class="border border-gray-200 px-3 py-2"><strong>Migration ENUM → VARCHAR(20)</strong> — résout l'incompatibilité Hibernate 6 / PostgreSQL ENUM natif sur <code class="font-mono text-xs">plan</code>, <code class="font-mono text-xs">role</code>, <code class="font-mono text-xs">journal</code>, <code class="font-mono text-xs">statut</code></td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono text-xs font-bold text-emerald-700">V61</td><td class="border border-gray-200 px-3 py-2"><strong>Table <code class="font-mono">import_historique</code></strong> — module Import & Migration</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Template de migration',
        contenu: `<pre class="bg-gray-900 text-gray-300 text-xs p-4 rounded-xl overflow-x-auto leading-relaxed">-- V62__description_claire.sql
-- Description : objectif de cette migration
-- Auteur : Prénom NOM
-- Date : YYYY-MM-DD

BEGIN;

CREATE TABLE IF NOT EXISTS nouvelle_table (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entreprise_id   UUID NOT NULL REFERENCES entreprises(id) ON DELETE CASCADE,
    -- colonnes métier
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nouvelle_table_ent
    ON nouvelle_table(entreprise_id, created_at DESC);

COMMIT;</pre>`
      },
      {
        titre: 'Schémas des tables clés',
        contenu: `<div class="space-y-3">
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">ecritures_comptables</p>
            <pre class="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg overflow-x-auto">id             UUID PK
entreprise_id  UUID FK → entreprises
exercice_id    UUID FK → exercices
journal        VARCHAR(20)   ← VARCHAR depuis V60
date_ecriture  DATE
numero_piece   VARCHAR(50)
statut         VARCHAR(20)   ← VARCHAR depuis V60
created_at     TIMESTAMPTZ</pre>
          </div>
          <div>
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">lignes_ecriture</p>
            <pre class="bg-gray-900 text-gray-300 text-xs p-3 rounded-lg overflow-x-auto">id          UUID PK
ecriture_id UUID FK → ecritures_comptables
compte_id   UUID FK → comptes_comptables
debit       NUMERIC(20,4)
credit      NUMERIC(20,4)
lettre      VARCHAR(5)   ← NULL si non lettré</pre>
          </div>
        </div>`
      }
    ]
  }
];

@Component({
  selector: 'app-tech-docs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="min-h-screen bg-gray-950">

  <!-- Header -->
  <div class="bg-gray-900 border-b border-gray-700">
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <a routerLink="/dashboard" class="hover:text-emerald-400 transition-colors">App</a>
        <span>›</span>
        @if (docActif()) {
          <button (click)="retourListe()" class="hover:text-emerald-400 transition-colors text-gray-400">Documentation technique</button>
          <span>›</span>
          <span class="text-gray-200 font-medium">{{ docActif()!.titre }}</span>
        } @else {
          <span class="text-gray-200 font-medium">Documentation technique</span>
        }
      </div>

      @if (!docActif()) {
        <div class="flex items-center gap-3">
          <span class="text-3xl">⚙️</span>
          <div>
            <h1 class="text-2xl font-bold text-white">Documentation technique</h1>
            <p class="text-gray-400 text-sm mt-1">Architecture, API, déploiement, sécurité et contribution.</p>
          </div>
        </div>
      } @else {
        <div class="flex items-center gap-3">
          <span class="text-3xl">{{ docActif()!.icone }}</span>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-white">{{ docActif()!.titre }}</h1>
              @if (docActif()!.badge) {
                <span class="px-2 py-0.5 bg-red-900 text-red-300 text-xs rounded-full font-medium">{{ docActif()!.badge }}</span>
              }
            </div>
            <p class="text-gray-400 text-sm mt-0.5">{{ docActif()!.description }}</p>
          </div>
        </div>
      }
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 py-8">

    @if (!docActif()) {

      <!-- Grille des documents -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        @for (doc of docs; track doc.id) {
          <div class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-emerald-600 cursor-pointer transition-all group"
               (click)="ouvrirDoc(doc.id)">
            <div class="flex items-start justify-between mb-4">
              <span class="text-3xl">{{ doc.icone }}</span>
              <div class="flex items-center gap-2">
                @if (doc.badge) {
                  <span class="px-2 py-0.5 bg-red-900 text-red-300 text-xs rounded-full font-medium">{{ doc.badge }}</span>
                }
                <svg class="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            <h3 class="font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors">{{ doc.titre }}</h3>
            <p class="text-sm text-gray-500 leading-relaxed">{{ doc.description }}</p>
            <div class="mt-3 text-xs text-gray-600">{{ doc.sections.length }} section(s)</div>
          </div>
        }
      </div>

      <!-- Stack résumé -->
      <div class="bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Stack en un coup d'œil</h3>
        <div class="flex flex-wrap gap-2">
          @for (tech of stackBadges; track tech) {
            <span class="px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full font-mono border border-gray-700">{{ tech }}</span>
          }
        </div>
      </div>

    } @else {

      <!-- Vue détail (dark) -->
      <div class="flex flex-col lg:flex-row gap-8">

        <!-- Sommaire -->
        <aside class="lg:w-56 shrink-0">
          <div class="bg-gray-900 border border-gray-700 rounded-xl p-4 sticky top-6">
            <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Sections</h3>
            <nav class="space-y-1">
              @for (s of docActif()!.sections; track s.titre; let i = $index) {
                <button (click)="scrollTo('tsec-' + i)"
                        class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-800 hover:text-emerald-400 transition-colors text-gray-400 truncate">
                  {{ s.titre }}
                </button>
              }
            </nav>
            <div class="mt-5 pt-4 border-t border-gray-700">
              <h3 class="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">Autres docs</h3>
              <nav class="space-y-1">
                @for (doc of docs; track doc.id) {
                  @if (doc.id !== docActif()!.id) {
                    <button (click)="ouvrirDoc(doc.id)"
                            class="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-800 transition-colors text-gray-600 flex items-center gap-2 truncate">
                      <span class="shrink-0">{{ doc.icone }}</span>
                      <span class="truncate">{{ doc.titre }}</span>
                    </button>
                  }
                }
              </nav>
            </div>
          </div>
        </aside>

        <!-- Contenu -->
        <main class="flex-1 min-w-0 space-y-5">
          @for (s of docActif()!.sections; track s.titre; let i = $index) {
            <div [id]="'tsec-' + i" class="bg-gray-900 border border-gray-700 rounded-xl p-6">
              <h2 class="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <span class="w-5 h-5 rounded bg-emerald-900 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">{{ i + 1 }}</span>
                {{ s.titre }}
              </h2>
              <div class="text-sm text-gray-300 leading-relaxed" [innerHTML]="s.contenu"></div>
            </div>
          }

          <div class="flex flex-col sm:flex-row gap-3 justify-between items-center pt-2">
            <button (click)="retourListe()"
                    class="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-400 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Retour
            </button>
            <a href="mailto:[EMAIL_CONTACT]?subject=Question technique e-Compta IA"
               class="text-sm text-emerald-500 hover:text-emerald-300 underline transition-colors">
              Question technique → contacter l'équipe
            </a>
          </div>
        </main>
      </div>
    }
  </div>
</div>
  `
})
export class TechDocsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly docs = TECH_DOCS;
  readonly stackBadges = [
    'Java 17', 'Spring Boot 3.2.5', 'PostgreSQL 16', 'Redis 7',
    'Flyway 9', 'Apache POI 5.2.5', 'Angular 17', 'TypeScript 5',
    'Tailwind CSS 3', 'JWT HS256', 'Docker', 'Nginx', 'GitHub Actions'
  ];

  docActif = signal<TechDoc | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') as TechDocId | null;
      this.docActif.set(id ? (TECH_DOCS.find(d => d.id === id) ?? null) : null);
    });
  }

  ouvrirDoc(id: TechDocId): void {
    this.docActif.set(TECH_DOCS.find(d => d.id === id) ?? null);
    this.router.navigate(['/tech', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retourListe(): void {
    this.docActif.set(null);
    this.router.navigate(['/tech']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
