import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

type GuideId = 'demarrage' | 'comptabilite' | 'etats-financiers' | 'tiers-rapprochement'
             | 'import-migration' | 'module-ia' | 'fiscalite-tva' | 'administration' | 'faq';

interface Guide {
  id: GuideId;
  titre: string;
  description: string;
  icone: string;
  sections: Section[];
}

interface Section {
  titre: string;
  contenu: string; // HTML
}

const GUIDES: Guide[] = [
  {
    id: 'demarrage',
    titre: 'Démarrage rapide',
    description: 'De l\'inscription à votre première écriture en 15 minutes.',
    icone: '🚀',
    sections: [
      {
        titre: 'Créer votre compte',
        contenu: `<ol class="list-decimal pl-5 space-y-1">
          <li>Cliquez sur <strong>« S'inscrire »</strong> sur la page d'accueil.</li>
          <li>Renseignez nom, e-mail et mot de passe (8 caractères minimum).</li>
          <li>Confirmez votre adresse e-mail via le lien reçu.</li>
          <li>Connectez-vous avec vos identifiants.</li>
        </ol>`
      },
      {
        titre: 'Créer votre entreprise',
        contenu: `<p>À la première connexion, l'assistant de configuration s'ouvre automatiquement :</p>
        <ol class="list-decimal pl-5 space-y-1 mt-2">
          <li><strong>Raison sociale</strong> — nom exact de votre entreprise.</li>
          <li><strong>IFU / RCCM</strong> — identifiant fiscal et numéro d'immatriculation.</li>
          <li><strong>Référentiel comptable</strong> — sélectionnez <strong>SYSCOHADA Révisé</strong> (recommandé).</li>
          <li><strong>Exercice courant</strong> — date de début et fin (ex. 01/01/2025 → 31/12/2025).</li>
          <li>Cliquez <strong>« Créer l'entreprise »</strong>.</li>
        </ol>`
      },
      {
        titre: 'Choisir votre plan',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse mt-2">
          <thead><tr class="bg-emerald-50"><th class="border border-gray-200 px-3 py-2 text-left">Plan</th><th class="border border-gray-200 px-3 py-2 text-left">Idéal pour</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2">FREE</td><td class="border border-gray-200 px-3 py-2">Découverte, TPE, associations</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">STANDARD</td><td class="border border-gray-200 px-3 py-2">PME, comptabilité complète</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">PREMIUM</td><td class="border border-gray-200 px-3 py-2">Entreprises avec IA et trésorerie avancée</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">ENTERPRISE</td><td class="border border-gray-200 px-3 py-2">Groupes, cabinets d'expertise comptable</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Configurer le plan comptable',
        contenu: `<p><strong>Option A — Plan standard (recommandé) :</strong> depuis <em>Plan de comptes</em>, cliquez <strong>« Initialiser avec le SYSCOHADA »</strong>.</p>
        <p class="mt-2"><strong>Option B — Import depuis un autre logiciel :</strong> utilisez le module <em>Import &amp; Migration</em> (Sage, EBP, WaveSoft, Excel/CSV).</p>`
      },
      {
        titre: 'Saisir votre première écriture',
        contenu: `<ol class="list-decimal pl-5 space-y-1">
          <li>Allez dans <strong>Écritures comptables</strong>.</li>
          <li>Cliquez <strong>« Nouvelle écriture »</strong>.</li>
          <li>Sélectionnez le journal (ex. VT — Ventes).</li>
          <li>Saisissez date, numéro de pièce et libellé.</li>
          <li>Ajoutez les lignes débit/crédit (Σ Débit = Σ Crédit).</li>
          <li>Cliquez <strong>« Valider »</strong> ou <strong>« Brouillon »</strong>.</li>
        </ol>`
      },
      {
        titre: 'Inviter des collaborateurs',
        contenu: `<p>Depuis <strong>Utilisateurs &amp; Droits</strong> : cliquez <strong>« Inviter un utilisateur »</strong>, saisissez l'e-mail et choisissez un rôle (Administrateur, Comptable, Lecteur). Le lien d'invitation est valide <strong>48 heures</strong>.</p>`
      }
    ]
  },
  {
    id: 'comptabilite',
    titre: 'Comptabilité générale',
    description: 'Plan de comptes, journaux, écritures, exercices, lettrage et analytique.',
    icone: '📒',
    sections: [
      {
        titre: 'Plan de comptes',
        contenu: `<p>Accédez à <strong>Plan de comptes</strong>. Pour créer un compte : numéro (ex. <code>411000</code>), intitulé, classe (1–9 SYSCOHADA), puis <strong>« Enregistrer »</strong>.</p>
        <div class="overflow-x-auto mt-3"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-emerald-50"><th class="border border-gray-200 px-3 py-2">Classe</th><th class="border border-gray-200 px-3 py-2 text-left">Nature</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 text-center font-mono">1</td><td class="border border-gray-200 px-3 py-2">Ressources durables</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 text-center font-mono">2</td><td class="border border-gray-200 px-3 py-2">Actif immobilisé</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 text-center font-mono">3</td><td class="border border-gray-200 px-3 py-2">Stocks</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 text-center font-mono">4</td><td class="border border-gray-200 px-3 py-2">Tiers</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 text-center font-mono">5</td><td class="border border-gray-200 px-3 py-2">Trésorerie</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 text-center font-mono">6</td><td class="border border-gray-200 px-3 py-2">Charges</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 text-center font-mono">7</td><td class="border border-gray-200 px-3 py-2">Produits</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Saisir une écriture',
        contenu: `<p><strong>Règle fondamentale :</strong> toute écriture doit être équilibrée (Σ Débit = Σ Crédit).</p>
        <ol class="list-decimal pl-5 space-y-1 mt-2">
          <li>Choisissez le journal et l'exercice.</li>
          <li>Saisissez date, numéro de pièce et libellé.</li>
          <li>Ajoutez les lignes débit/crédit.</li>
          <li><strong>Brouillon</strong> = modifiable ; <strong>Valider</strong> = définitif.</li>
        </ol>
        <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          ⚠️ Une écriture validée ne peut plus être modifiée. Pour corriger : saisissez une écriture d'extourne.
        </div>`
      },
      {
        titre: 'Exercices comptables',
        contenu: `<p>Depuis <strong>Exercices</strong> : créez un exercice avec ses dates. La <strong>clôture</strong> gèle les écritures, génère les écritures de résultat et crée les soldes d'ouverture du prochain exercice. La clôture est <strong>irréversible</strong>.</p>`
      },
      {
        titre: 'Lettrage',
        contenu: `<p>Depuis <strong>Lettrage</strong> : sélectionnez un compte 4xx, cochez facture + règlement (solde = 0), puis <strong>« Lettrer »</strong>. Une lettre (A, B, C…) est attribuée. Le délettrage est possible à tout moment.</p>`
      },
      {
        titre: 'Analytique',
        contenu: `<p>La comptabilité analytique ventile charges et produits par axe (projet, département). Configurez les axes depuis <strong>Analytique › Axes</strong>, puis affectez un code analytique sur chaque ligne d'écriture.</p>`
      }
    ]
  },
  {
    id: 'etats-financiers',
    titre: 'États financiers',
    description: 'Bilan, compte de résultat, balance, grand livre et ratios SYSCOHADA.',
    icone: '📊',
    sections: [
      {
        titre: 'États disponibles',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-emerald-50"><th class="border border-gray-200 px-3 py-2 text-left">État</th><th class="border border-gray-200 px-3 py-2 text-left">Description</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">Bilan</td><td class="border border-gray-200 px-3 py-2">Situation patrimoniale Actif/Passif</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-medium">Compte de résultat</td><td class="border border-gray-200 px-3 py-2">Charges et produits de la période</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">Tableau des flux</td><td class="border border-gray-200 px-3 py-2">Flux opérationnels, investissement, financement</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-medium">Balance générale</td><td class="border border-gray-200 px-3 py-2">Soldes de tous les comptes</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">Grand livre</td><td class="border border-gray-200 px-3 py-2">Détail des mouvements par compte</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-medium">Balance âgée</td><td class="border border-gray-200 px-3 py-2">Créances/dettes par ancienneté</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Générer un état',
        contenu: `<ol class="list-decimal pl-5 space-y-1">
          <li>Accédez à <strong>États financiers</strong>.</li>
          <li>Sélectionnez l'état et l'exercice (ou période personnalisée).</li>
          <li>Cliquez <strong>« Générer »</strong>.</li>
          <li>Exportez en <strong>PDF</strong> ou <strong>Excel</strong>.</li>
        </ol>`
      },
      {
        titre: 'Ratios financiers',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-emerald-50"><th class="border border-gray-200 px-3 py-2 text-left">Ratio</th><th class="border border-gray-200 px-3 py-2 text-left">Formule</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2">Fonds de Roulement</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">Capitaux permanents − Actif immobilisé</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">BFR</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">Actif circulant − Passif circulant</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Liquidité générale</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">Actif circulant / Passif circulant</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Rentabilité</td><td class="border border-gray-200 px-3 py-2 font-mono text-xs">Résultat net / CA × 100</td></tr>
          </tbody>
        </table></div>`
      }
    ]
  },
  {
    id: 'tiers-rapprochement',
    titre: 'Tiers & Rapprochement',
    description: 'Gestion des clients/fournisseurs, rapprochement bancaire et trésorerie.',
    icone: '🤝',
    sections: [
      {
        titre: 'Créer un tiers',
        contenu: `<p>Depuis <strong>Tiers › Nouveau tiers</strong> : renseignez le code unique (ex. <code>CLI001</code>), raison sociale, type (Client / Fournisseur), e-mail, téléphone et compte comptable lié (411xxx clients, 401xxx fournisseurs).</p>`
      },
      {
        titre: 'Rapprochement bancaire',
        contenu: `<ol class="list-decimal pl-5 space-y-1">
          <li>Accédez à <strong>Rapprochement bancaire</strong>.</li>
          <li>Sélectionnez le compte bancaire (5xx).</li>
          <li>Importez le relevé (OFX, QIF ou CSV bancaire).</li>
          <li>Pointez les mouvements contre les écritures.</li>
          <li>Cliquez <strong>« Valider »</strong> quand Solde relevé = Solde pointé.</li>
        </ol>
        <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          💡 Effectuez le rapprochement mensuellement, dans les 10 premiers jours du mois suivant.
        </div>`
      },
      {
        titre: 'Relances clients',
        contenu: `<p>Depuis <strong>Relances</strong> : configurez les niveaux (1er rappel, 2e rappel, mise en demeure), sélectionnez les clients en retard et cliquez <strong>« Envoyer les relances »</strong>. Les e-mails sont envoyés automatiquement.</p>`
      }
    ]
  },
  {
    id: 'import-migration',
    titre: 'Import & Migration',
    description: 'Transférez vos données depuis Sage, EBP, WaveSoft, FEC ou Excel/CSV.',
    icone: '📥',
    sections: [
      {
        titre: 'Formats supportés',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-emerald-50"><th class="border border-gray-200 px-3 py-2 text-left">Format</th><th class="border border-gray-200 px-3 py-2 text-left">Logiciel</th><th class="border border-gray-200 px-3 py-2 text-left">Types de données</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">FEC</td><td class="border border-gray-200 px-3 py-2">Tout logiciel DGI</td><td class="border border-gray-200 px-3 py-2">Écritures</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-medium">Sage</td><td class="border border-gray-200 px-3 py-2">Sage 50/100</td><td class="border border-gray-200 px-3 py-2">Écritures, Tiers, Plan</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">EBP</td><td class="border border-gray-200 px-3 py-2">EBP Open Line</td><td class="border border-gray-200 px-3 py-2">Écritures, Tiers, Plan</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-medium">WaveSoft</td><td class="border border-gray-200 px-3 py-2">WaveSoft Compta</td><td class="border border-gray-200 px-3 py-2">Écritures, Tiers, Plan</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">Excel / CSV</td><td class="border border-gray-200 px-3 py-2">Tout tableur</td><td class="border border-gray-200 px-3 py-2">Tous types</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-medium">Soldes</td><td class="border border-gray-200 px-3 py-2">Excel / CSV</td><td class="border border-gray-200 px-3 py-2">Soldes d'ouverture</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Processus en 4 étapes',
        contenu: `<ol class="list-decimal pl-5 space-y-2">
          <li><strong>Format & type</strong> : choisissez le logiciel source et ce que vous importez.</li>
          <li><strong>Téléversement</strong> : glissez-déposez votre fichier. La plateforme détecte séparateur et encodage.</li>
          <li><strong>Mapping</strong> : vérifiez la correspondance colonnes source → champs cibles (suggestion automatique).</li>
          <li><strong>Confirmation</strong> : lancez l'import et consultez le rapport (importés / ignorés / erreurs).</li>
        </ol>`
      },
      {
        titre: 'Ordre recommandé',
        contenu: `<ol class="list-decimal pl-5 space-y-1">
          <li>Plan comptable (si nécessaire)</li>
          <li>Tiers (clients et fournisseurs)</li>
          <li>Soldes d'ouverture (migration en cours d'exercice)</li>
          <li>Écritures comptables</li>
        </ol>`
      },
      {
        titre: 'Conseils Excel/CSV',
        contenu: `<ul class="list-disc pl-5 space-y-1 text-sm">
          <li>Première ligne = en-têtes de colonnes</li>
          <li>Dates au format <code>JJ/MM/AAAA</code> ou <code>AAAA-MM-JJ</code></li>
          <li>Montants sans espace ni symbole (ex. <code>1500.00</code>)</li>
          <li>Séparateur décimal : point <code>.</code></li>
          <li>Taille maximale : 50 Mo par fichier</li>
        </ul>`
      }
    ]
  },
  {
    id: 'module-ia',
    titre: 'Module IA',
    description: 'Suggestions automatiques, détection d\'anomalies et analyse financière.',
    icone: '🤖',
    sections: [
      {
        titre: 'Fonctionnalités',
        contenu: `<ul class="space-y-2">
          <li class="flex gap-2"><span class="text-emerald-600 font-bold">✦</span><span><strong>Suggestion d'imputation</strong> : propose comptes et journal lors de la saisie d'un libellé.</span></li>
          <li class="flex gap-2"><span class="text-emerald-600 font-bold">✦</span><span><strong>Détection d'anomalies</strong> : signale doublons, montants atypiques, TVA incohérente…</span></li>
          <li class="flex gap-2"><span class="text-emerald-600 font-bold">✦</span><span><strong>Analyse financière</strong> : rapport commenté N vs N−1 avec recommandations.</span></li>
          <li class="flex gap-2"><span class="text-emerald-600 font-bold">✦</span><span><strong>Chat comptable</strong> : questions en langage naturel avec références SYSCOHADA.</span></li>
          <li class="flex gap-2"><span class="text-emerald-600 font-bold">✦</span><span><strong>Contrôle pré-clôture</strong> : vérification complète avant de clôturer l'exercice.</span></li>
        </ul>
        <div class="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800">
          🔒 Disponible à partir du plan <strong>PREMIUM</strong>.
        </div>`
      },
      {
        titre: 'Exemples de questions chat',
        contenu: `<ul class="list-disc pl-5 space-y-1 text-sm font-mono">
          <li>« Quel est mon résultat net à fin juin ? »</li>
          <li>« Quelles sont mes créances de plus de 60 jours ? »</li>
          <li>« Comment comptabiliser un remboursement de frais ? »</li>
          <li>« Mon bilan est-il équilibré ? »</li>
          <li>« Quel compte utiliser pour les frais de déplacement ? »</li>
        </ul>`
      },
      {
        titre: 'Important',
        contenu: `<div class="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          ⚠️ Les suggestions IA sont des <strong>aides à la décision</strong>. Elles ne se substituent pas au jugement d'un expert-comptable qualifié. Vous restez responsable des écritures validées.
        </div>`
      }
    ]
  },
  {
    id: 'fiscalite-tva',
    titre: 'Fiscalité & TVA',
    description: 'Déclarations TVA, IS, liasse fiscale et gestion des échéances fiscales.',
    icone: '🏛️',
    sections: [
      {
        titre: 'Taux de TVA (Burkina Faso)',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-emerald-50"><th class="border border-gray-200 px-3 py-2 text-left">Taux</th><th class="border border-gray-200 px-3 py-2 text-left">Application</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-mono">18 %</td><td class="border border-gray-200 px-3 py-2">Taux normal</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-mono">0 %</td><td class="border border-gray-200 px-3 py-2">Exonérations et hors champ</td></tr>
          </tbody>
        </table></div>
        <p class="text-sm text-gray-500 mt-2">Les taux sont configurables dans <strong>Paramètres › TVA</strong>.</p>`
      },
      {
        titre: 'Déclaration de TVA',
        contenu: `<ol class="list-decimal pl-5 space-y-1">
          <li>Accédez à <strong>TVA</strong> et sélectionnez la période.</li>
          <li>Vérifiez : TVA collectée (compte 4431) et TVA déductible (compte 4441).</li>
          <li>TVA nette = collectée − déductible.</li>
          <li>Cliquez <strong>« Valider »</strong> puis exportez le PDF pour la DGI.</li>
          <li>Comptabilisez le règlement : débit <code>4449</code> / crédit compte bancaire.</li>
        </ol>`
      },
      {
        titre: 'Déclaration IS',
        contenu: `<p>Depuis <strong>Déclaration IS</strong> : sélectionnez l'exercice, vérifiez les cases préremplies depuis votre compte de résultat, effectuez les réintégrations/déductions extracomptables.</p>
        <p class="mt-2 text-sm text-gray-600">Taux IS Burkina Faso (indicatif) : <strong>27,5 %</strong> — IMF minimum : <strong>0,5 % du CA</strong>. Vérifiez toujours la loi de finances en vigueur.</p>`
      },
      {
        titre: 'Calendrier fiscal',
        contenu: `<p>Le module <strong>Gestion fiscale</strong> affiche le calendrier des obligations déclaratives avec des alertes configurables avant chaque échéance (TVA, IS, patente, CNSS…).</p>`
      }
    ]
  },
  {
    id: 'administration',
    titre: 'Administration',
    description: 'Utilisateurs, droits d\'accès, paramètres, abonnement et sécurité.',
    icone: '⚙️',
    sections: [
      {
        titre: 'Rôles utilisateurs',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-emerald-50"><th class="border border-gray-200 px-3 py-2 text-left">Rôle</th><th class="border border-gray-200 px-3 py-2 text-left">Permissions</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">Administrateur</td><td class="border border-gray-200 px-3 py-2">Accès complet — paramètres, utilisateurs, toutes fonctionnalités</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-medium">Comptable</td><td class="border border-gray-200 px-3 py-2">Saisie, validation, états, import — pas de gestion des utilisateurs</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">Lecteur</td><td class="border border-gray-200 px-3 py-2">Consultation uniquement — aucune modification</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Inviter un collaborateur',
        contenu: `<p>Depuis <strong>Utilisateurs &amp; Droits › Inviter</strong> : saisissez l'e-mail et choisissez le rôle. Lien valide <strong>48 heures</strong>. L'invité crée son compte s'il n'en a pas encore.</p>`
      },
      {
        titre: 'Multi-entreprises',
        contenu: `<p>Un même compte peut gérer plusieurs entreprises (cabinet, groupe). Utilisez le <strong>sélecteur d'entreprise</strong> en haut à gauche pour basculer d'un dossier à l'autre. Les données sont strictement isolées.</p>`
      },
      {
        titre: 'Sécurité du compte',
        contenu: `<ul class="list-disc pl-5 space-y-1">
          <li><strong>Mot de passe</strong> : modifiable depuis Mon profil › Sécurité.</li>
          <li><strong>2FA</strong> : activez la double authentification (Google Authenticator, Authy…).</li>
          <li><strong>Sessions actives</strong> : consultez et fermez à distance les sessions suspectes.</li>
        </ul>`
      },
      {
        titre: 'Audit et traçabilité',
        contenu: `<p>Le module <strong>Audit</strong> enregistre toutes les actions sensibles : connexions, modifications d'écritures, exports, changements de paramètres. Filtrable par utilisateur, action et date.</p>`
      }
    ]
  },
  {
    id: 'faq',
    titre: 'FAQ',
    description: 'Réponses aux questions les plus fréquentes.',
    icone: '❓',
    sections: [
      {
        titre: 'Compte et accès',
        contenu: `<dl class="space-y-4">
          <div><dt class="font-semibold text-gray-800">J'ai oublié mon mot de passe.</dt><dd class="text-gray-600 mt-1">Cliquez <strong>« Mot de passe oublié »</strong> sur la page de connexion. Lien valide 1 heure.</dd></div>
          <div><dt class="font-semibold text-gray-800">Je n'ai pas reçu l'e-mail de confirmation.</dt><dd class="text-gray-600 mt-1">Vérifiez votre dossier Spam. Attendez 5 minutes puis contactez le support.</dd></div>
          <div><dt class="font-semibold text-gray-800">Mon lien d'invitation a expiré.</dt><dd class="text-gray-600 mt-1">Les liens expirent après 48h. Demandez à votre Administrateur de renvoyer l'invitation.</dd></div>
        </dl>`
      },
      {
        titre: 'Abonnement et paiement',
        contenu: `<dl class="space-y-4">
          <div><dt class="font-semibold text-gray-800">Le plan FREE est-il vraiment gratuit ?</dt><dd class="text-gray-600 mt-1">Oui, sans limite de durée. Les fonctionnalités avancées (IA, trésorerie avancée…) nécessitent un plan payant.</dd></div>
          <div><dt class="font-semibold text-gray-800">Puis-je annuler à tout moment ?</dt><dd class="text-gray-600 mt-1">Oui. L'accès reste actif jusqu'à la fin de la période payée. Pas de remboursement prorata (sauf cas CGV).</dd></div>
          <div><dt class="font-semibold text-gray-800">Comment payer avec Orange Money ?</dt><dd class="text-gray-600 mt-1">Sur la page de paiement → Mobile Money → choisissez votre opérateur → entrez votre numéro → confirmez via USSD ou notification push.</dd></div>
        </dl>`
      },
      {
        titre: 'Comptabilité',
        contenu: `<dl class="space-y-4">
          <div><dt class="font-semibold text-gray-800">Puis-je modifier une écriture validée ?</dt><dd class="text-gray-600 mt-1">Non. Saisissez une écriture d'extourne pour corriger une erreur.</dd></div>
          <div><dt class="font-semibold text-gray-800">La balance est déséquilibrée.</dt><dd class="text-gray-600 mt-1">Vérifiez les écritures en statut Brouillon (non comptabilisées) et utilisez le rapport Anomalies IA.</dd></div>
          <div><dt class="font-semibold text-gray-800">Puis-je annuler une clôture d'exercice ?</dt><dd class="text-gray-600 mt-1">Non, la clôture est irréversible. Créez une écriture de correction dans l'exercice suivant.</dd></div>
        </dl>`
      },
      {
        titre: 'Import & Données',
        contenu: `<dl class="space-y-4">
          <div><dt class="font-semibold text-gray-800">Taille maximale d'un fichier d'import ?</dt><dd class="text-gray-600 mt-1">50 Mo. Pour les fichiers plus volumineux, découpez par période (trimestre).</dd></div>
          <div><dt class="font-semibold text-gray-800">Mes données sont-elles sauvegardées ?</dt><dd class="text-gray-600 mt-1">Oui, sauvegardes chiffrées quotidiennes, rétention 30 jours.</dd></div>
          <div><dt class="font-semibold text-gray-800">Comment exporter toutes mes données ?</dt><dd class="text-gray-600 mt-1">Depuis Paramètres › Mes données → « Exporter mes données ».</dd></div>
        </dl>`
      }
    ]
  }
];

@Component({
  selector: 'app-aide',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
<div class="min-h-screen bg-gray-50 flex flex-col">

  <!-- Header -->
  <div class="bg-white border-b border-gray-200">
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <a routerLink="/dashboard" class="hover:text-emerald-600 transition-colors">Accueil</a>
        <span>›</span>
        @if (guideActif()) {
          <button (click)="retourListe()" class="hover:text-emerald-600 transition-colors">Centre d'aide</button>
          <span>›</span>
          <span class="text-gray-900 font-medium">{{ guideActif()!.titre }}</span>
        } @else {
          <span class="text-gray-900 font-medium">Centre d'aide</span>
        }
      </div>

      <div class="flex flex-col md:flex-row md:items-center gap-4">
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-900">
            @if (guideActif()) {
              {{ guideActif()!.icone }} {{ guideActif()!.titre }}
            } @else {
              Centre d'aide e-Compta IA
            }
          </h1>
          @if (!guideActif()) {
            <p class="text-gray-500 mt-1">Documentation, guides et FAQ pour vous accompagner.</p>
          }
        </div>

        <!-- Recherche -->
        @if (!guideActif()) {
          <div class="relative w-full md:w-80">
            <input [(ngModel)]="recherche"
                   (ngModelChange)="onRecherche()"
                   placeholder="Rechercher dans l'aide…"
                   class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
            <svg class="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        }
      </div>
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">

    @if (!guideActif()) {

      <!-- Résultats de recherche -->
      @if (recherche().trim().length > 1) {
        <div class="mb-6">
          <p class="text-sm text-gray-500 mb-4">
            {{ resultatsRecherche().length }} résultat(s) pour « {{ recherche() }} »
          </p>
          @if (resultatsRecherche().length === 0) {
            <div class="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              Aucun résultat. Essayez d'autres mots-clés ou
              <a href="mailto:[EMAIL_CONTACT]" class="text-emerald-600 underline">contactez le support</a>.
            </div>
          } @else {
            <div class="space-y-3">
              @for (res of resultatsRecherche(); track res.guideId + res.sectionTitre) {
                <div class="bg-white rounded-xl border border-gray-100 p-4 hover:border-emerald-200 cursor-pointer transition-colors"
                     (click)="ouvrirGuide(res.guideId)">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-lg">{{ getGuide(res.guideId)?.icone }}</span>
                    <span class="text-xs text-gray-400 uppercase tracking-wide">{{ getGuide(res.guideId)?.titre }}</span>
                  </div>
                  <p class="font-medium text-gray-900 text-sm">{{ res.sectionTitre }}</p>
                  <p class="text-xs text-gray-500 mt-1 line-clamp-2" [innerHTML]="res.extrait"></p>
                </div>
              }
            </div>
          }
        </div>
      } @else {

        <!-- Grille des guides -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for (guide of guides; track guide.id) {
            <div class="bg-white rounded-xl border border-gray-100 p-6 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group"
                 (click)="ouvrirGuide(guide.id)">
              <div class="flex items-start justify-between mb-4">
                <span class="text-3xl">{{ guide.icone }}</span>
                <svg class="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
              <h3 class="font-semibold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">{{ guide.titre }}</h3>
              <p class="text-sm text-gray-500 leading-relaxed">{{ guide.description }}</p>
              <div class="mt-3 text-xs text-gray-400">{{ guide.sections.length }} section(s)</div>
            </div>
          }
        </div>

        <!-- Contact support -->
        <div class="mt-10 bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 class="font-semibold text-emerald-900">Vous ne trouvez pas votre réponse ?</h3>
            <p class="text-sm text-emerald-700 mt-1">L'équipe L'N EXPERTISE vous répond sous 48 heures (plan STANDARD) ou 24 heures (PREMIUM).</p>
          </div>
          <a href="mailto:[EMAIL_CONTACT]"
             class="shrink-0 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            Contacter le support
          </a>
        </div>

      }

    } @else {

      <!-- Détail d'un guide -->
      <div class="flex flex-col lg:flex-row gap-8">

        <!-- Sommaire latéral -->
        <aside class="lg:w-64 shrink-0">
          <div class="bg-white rounded-xl border border-gray-100 p-4 sticky top-24">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sommaire</h3>
            <nav class="space-y-1">
              @for (section of guideActif()!.sections; track section.titre; let i = $index) {
                <button (click)="scrollTo('section-' + i)"
                        class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-gray-600">
                  {{ section.titre }}
                </button>
              }
            </nav>

            <!-- Navigation entre guides -->
            <div class="mt-6 pt-4 border-t border-gray-100">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Autres guides</h3>
              <nav class="space-y-1">
                @for (guide of guides; track guide.id) {
                  @if (guide.id !== guideActif()!.id) {
                    <button (click)="ouvrirGuide(guide.id)"
                            class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors text-gray-500 flex items-center gap-2">
                      <span>{{ guide.icone }}</span>
                      <span class="truncate">{{ guide.titre }}</span>
                    </button>
                  }
                }
              </nav>
            </div>
          </div>
        </aside>

        <!-- Contenu du guide -->
        <main class="flex-1 min-w-0">
          <div class="space-y-6">
            @for (section of guideActif()!.sections; track section.titre; let i = $index) {
              <div [id]="'section-' + i" class="bg-white rounded-xl border border-gray-100 p-6">
                <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center shrink-0">
                    {{ i + 1 }}
                  </span>
                  {{ section.titre }}
                </h2>
                <div class="text-sm text-gray-700 leading-relaxed prose-tables" [innerHTML]="section.contenu"></div>
              </div>
            }
          </div>

          <!-- Actions bas de page -->
          <div class="mt-8 flex flex-col sm:flex-row gap-3 justify-between items-center">
            <button (click)="retourListe()"
                    class="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Retour au centre d'aide
            </button>
            <a href="mailto:[EMAIL_CONTACT]"
               class="text-sm text-emerald-600 hover:text-emerald-800 underline transition-colors">
              Cette page ne répond pas à ma question →
            </a>
          </div>
        </main>

      </div>
    }
  </div>

</div>
  `
})
export class AideComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly guides = GUIDES;

  guideActif = signal<Guide | null>(null);
  recherche = signal('');

  resultatsRecherche = computed(() => {
    const q = this.recherche().trim().toLowerCase();
    if (q.length < 2) return [];
    const results: { guideId: GuideId; sectionTitre: string; extrait: string }[] = [];
    for (const guide of GUIDES) {
      if (guide.titre.toLowerCase().includes(q) || guide.description.toLowerCase().includes(q)) {
        results.push({ guideId: guide.id, sectionTitre: guide.titre, extrait: guide.description });
      }
      for (const section of guide.sections) {
        const texte = section.titre.toLowerCase() + ' ' + section.contenu.replace(/<[^>]*>/g, ' ').toLowerCase();
        if (texte.includes(q)) {
          const plain = section.contenu.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const idx = plain.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 60);
          const extrait = (start > 0 ? '…' : '') + plain.substring(start, idx + 120) + '…';
          results.push({ guideId: guide.id, sectionTitre: section.titre, extrait });
        }
      }
    }
    return results.slice(0, 10);
  });

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') as GuideId | null;
      if (id) {
        const found = GUIDES.find(g => g.id === id);
        this.guideActif.set(found ?? null);
      } else {
        this.guideActif.set(null);
      }
    });
  }

  ouvrirGuide(id: GuideId): void {
    this.recherche.set('');
    this.guideActif.set(GUIDES.find(g => g.id === id) ?? null);
    this.router.navigate(['/aide', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retourListe(): void {
    this.guideActif.set(null);
    this.router.navigate(['/aide']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onRecherche(): void {
    if (this.guideActif()) {
      this.guideActif.set(null);
      this.router.navigate(['/aide']);
    }
  }

  getGuide(id: GuideId): Guide | undefined {
    return GUIDES.find(g => g.id === id);
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
