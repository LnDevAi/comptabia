import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

type DocId = 'pitch' | 'comparatif-plans' | 'fiches-modules' | 'argumentaire' | 'partenaires';

interface DocSection { titre: string; contenu: string; }
interface CommercialDoc { id: DocId; titre: string; sousTitre: string; icone: string; badge?: string; sections: DocSection[]; }

const DOCS: CommercialDoc[] = [
  {
    id: 'pitch',
    titre: 'Présentation e-Compta IA',
    sousTitre: 'Le problème, la solution et notre proposition de valeur.',
    icone: '🚀',
    sections: [
      {
        titre: 'Le problème',
        contenu: `<p>Les PME et TPE africaines font face à des défis comptables majeurs :</p>
        <ul class="list-disc pl-5 space-y-1 mt-2">
          <li><strong>Logiciels inadaptés</strong> — les outils disponibles sont conçus pour les normes européennes (IFRS, PCG).</li>
          <li><strong>Coût prohibitif</strong> — les ERP classiques (Sage, SAP, Oracle) sont hors de portée des PME locales.</li>
          <li><strong>Compétences rares</strong> — le recours à un expert-comptable à temps plein est inaccessible pour la majorité.</li>
          <li><strong>Mobilité limitée</strong> — les solutions on-premise nécessitent une infrastructure IT coûteuse.</li>
          <li><strong>Conformité OHADA</strong> — la maîtrise du SYSCOHADA Révisé (2017) reste inégale sur le terrain.</li>
        </ul>`
      },
      {
        titre: 'La solution — e-Compta IA',
        contenu: `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <div class="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div class="text-2xl mb-2">📒</div>
            <h4 class="font-semibold text-emerald-900">SYSCOHADA natif</h4>
            <p class="text-sm text-emerald-700 mt-1">Plan comptable, journaux et états préconfigurés. Conforme dès la première utilisation.</p>
          </div>
          <div class="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <div class="text-2xl mb-2">🤖</div>
            <h4 class="font-semibold text-purple-900">Intelligence Artificielle</h4>
            <p class="text-sm text-purple-700 mt-1">Suggestions d'imputation, détection d'anomalies, analyse financière, chat comptable.</p>
          </div>
          <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div class="text-2xl mb-2">📥</div>
            <h4 class="font-semibold text-blue-900">Migration sans friction</h4>
            <p class="text-sm text-blue-700 mt-1">Import depuis Sage, EBP, WaveSoft, FEC, Excel en quelques clics.</p>
          </div>
          <div class="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div class="text-2xl mb-2">📱</div>
            <h4 class="font-semibold text-amber-900">Mobile Money</h4>
            <p class="text-sm text-amber-700 mt-1">100 % web, paiement Orange Money, Moov Money, Coris Money. Accessible partout.</p>
          </div>
        </div>`
      },
      {
        titre: 'Notre marché cible',
        contenu: `<div class="space-y-3">
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-2xl">🏢</span>
            <div><strong class="text-gray-900">Cible principale</strong><p class="text-sm text-gray-600 mt-1">PME et TPE du Burkina Faso et de l'espace OHADA (18 États membres). Commerce, services, industrie légère, BTP, agriculture. 1 à 200 employés.</p></div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-2xl">📋</span>
            <div><strong class="text-gray-900">Cabinets comptables</strong><p class="text-sm text-gray-600 mt-1">Gestion multi-dossiers, portail client, collaboration à distance.</p></div>
          </div>
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-2xl">🌍</span>
            <div><strong class="text-gray-900">ONG & Institutions</strong><p class="text-sm text-gray-600 mt-1">Comptabilité analytique par projet, rapports bailleurs, SFD, assurances.</p></div>
          </div>
        </div>`
      },
      {
        titre: 'Notre proposition de valeur',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-emerald-50"><th class="border border-gray-200 px-4 py-2 text-left">Pour</th><th class="border border-gray-200 px-4 py-2 text-left">Bénéfice</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-4 py-2 font-medium">Le dirigeant</td><td class="border border-gray-200 px-4 py-2">Visibilité en temps réel sur la santé financière</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-4 py-2 font-medium">Le comptable</td><td class="border border-gray-200 px-4 py-2">Automatisation des tâches répétitives, gain de temps significatif</td></tr>
            <tr><td class="border border-gray-200 px-4 py-2 font-medium">Le cabinet</td><td class="border border-gray-200 px-4 py-2">Gestion multi-dossiers centralisée, portail client intégré</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-4 py-2 font-medium">L'investisseur</td><td class="border border-gray-200 px-4 py-2">États financiers fiables et conformes OHADA instantanément</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Chiffres clés',
        contenu: `<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
          <div class="text-center p-4 bg-emerald-50 rounded-xl">
            <div class="text-3xl font-bold text-emerald-700">18</div>
            <div class="text-xs text-emerald-600 mt-1">États OHADA couverts</div>
          </div>
          <div class="text-center p-4 bg-blue-50 rounded-xl">
            <div class="text-3xl font-bold text-blue-700">6</div>
            <div class="text-xs text-blue-600 mt-1">Formats d'import</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-xl">
            <div class="text-3xl font-bold text-purple-700">50+</div>
            <div class="text-xs text-purple-600 mt-1">Modules fonctionnels</div>
          </div>
          <div class="text-center p-4 bg-amber-50 rounded-xl">
            <div class="text-3xl font-bold text-amber-700">4</div>
            <div class="text-xs text-amber-600 mt-1">Plans tarifaires</div>
          </div>
        </div>`
      }
    ]
  },
  {
    id: 'comparatif-plans',
    titre: 'Comparatif des plans',
    sousTitre: 'FREE · STANDARD · PREMIUM · ENTERPRISE — toutes les fonctionnalités comparées.',
    icone: '📊',
    sections: [
      {
        titre: 'Vue d\'ensemble',
        contenu: `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="border-2 border-gray-200 rounded-xl p-5">
            <div class="text-lg font-bold text-gray-700 mb-1">FREE</div>
            <div class="text-2xl font-extrabold text-gray-900 mb-3">Gratuit</div>
            <ul class="text-sm text-gray-600 space-y-1">
              <li>✅ Comptabilité de base</li>
              <li>✅ 100 écritures/mois</li>
              <li>✅ Bilan &amp; Résultat</li>
              <li>✅ 1 utilisateur, 1 entreprise</li>
              <li>❌ Pas d'IA ni de paie</li>
            </ul>
          </div>
          <div class="border-2 border-emerald-300 rounded-xl p-5 bg-emerald-50">
            <div class="text-lg font-bold text-emerald-700 mb-1">STANDARD</div>
            <div class="text-2xl font-extrabold text-emerald-900 mb-3">[TARIF_STANDARD_M] XOF<span class="text-sm font-normal text-emerald-600">/mois</span></div>
            <ul class="text-sm text-emerald-800 space-y-1">
              <li>✅ Écritures illimitées</li>
              <li>✅ Liasse fiscale complète</li>
              <li>✅ Facturation &amp; devis</li>
              <li>✅ Utilisateurs illimités</li>
              <li>✅ Support e-mail 48h</li>
            </ul>
          </div>
          <div class="border-2 border-purple-300 rounded-xl p-5 bg-purple-50">
            <div class="text-lg font-bold text-purple-700 mb-1">PREMIUM</div>
            <div class="text-2xl font-extrabold text-purple-900 mb-3">[TARIF_PREMIUM_M] XOF<span class="text-sm font-normal text-purple-600">/mois</span></div>
            <ul class="text-sm text-purple-800 space-y-1">
              <li>✅ Module IA complet</li>
              <li>✅ Trésorerie avancée</li>
              <li>✅ RH &amp; Paie complète</li>
              <li>✅ GED Documents</li>
              <li>✅ Support prioritaire 24h</li>
            </ul>
          </div>
          <div class="border-2 border-gray-700 rounded-xl p-5 bg-gray-900 text-white">
            <div class="text-lg font-bold text-gray-300 mb-1">ENTERPRISE</div>
            <div class="text-2xl font-extrabold mb-3">Sur devis</div>
            <ul class="text-sm text-gray-300 space-y-1">
              <li>✅ Consolidation groupe</li>
              <li>✅ Modules sectoriels</li>
              <li>✅ Entreprises illimitées</li>
              <li>✅ Support dédié 4h</li>
              <li>✅ Formation incluse</li>
            </ul>
          </div>
        </div>
        <p class="text-center mt-4"><a routerLink="/tarifs" class="text-emerald-600 underline text-sm">Voir les tarifs actuels →</a></p>`
      },
      {
        titre: 'Comptabilité & États financiers',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Fonctionnalité</th><th class="border border-gray-200 px-3 py-2 text-center">FREE</th><th class="border border-gray-200 px-3 py-2 text-center">STD</th><th class="border border-gray-200 px-3 py-2 text-center">PRE</th><th class="border border-gray-200 px-3 py-2 text-center">ENT</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2">Plan comptable SYSCOHADA</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Écritures (volume)</td><td class="border border-gray-200 px-3 py-2 text-center text-xs text-gray-500">100/mois</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">∞</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">∞</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">∞</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Bilan &amp; Compte de résultat</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Tableau des flux de trésorerie</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Liasse fiscale</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Analytique</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Notes annexes fiscales</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-emerald-600 font-bold">✓</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'IA · RH · Multi-entités',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Fonctionnalité</th><th class="border border-gray-200 px-3 py-2 text-center">FREE</th><th class="border border-gray-200 px-3 py-2 text-center">STD</th><th class="border border-gray-200 px-3 py-2 text-center">PRE</th><th class="border border-gray-200 px-3 py-2 text-center">ENT</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2">Module IA (suggestions, anomalies)</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-purple-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-purple-600 font-bold">✓</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Trésorerie avancée &amp; Prévisions</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-purple-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-purple-600 font-bold">✓</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Paie &amp; RH complète</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-purple-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-purple-600 font-bold">✓</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">GED Documents</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-purple-600 font-bold">✓</td><td class="border border-gray-200 px-3 py-2 text-center text-purple-600 font-bold">✓</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2">Consolidation multi-entités</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-900 font-bold">✓</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2">Modules sectoriels (assurance, SFD…)</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-300">—</td><td class="border border-gray-200 px-3 py-2 text-center text-gray-900 font-bold">✓</td></tr>
          </tbody>
        </table></div>`
      }
    ]
  },
  {
    id: 'fiches-modules',
    titre: 'Fiches modules',
    sousTitre: 'Description détaillée de chaque module et de ses bénéfices.',
    icone: '🧩',
    sections: [
      {
        titre: 'Comptabilité générale',
        contenu: `<div class="flex items-center gap-2 mb-3"><span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">Disponible depuis FREE</span></div>
        <p class="text-gray-700">Tenue de comptabilité conforme au SYSCOHADA Révisé avec plan de comptes, journaux, écritures et clôture d'exercice.</p>
        <ul class="list-disc pl-5 space-y-1 mt-3 text-sm text-gray-600">
          <li>Plan comptable SYSCOHADA préconfigurable en 1 clic</li>
          <li>Journaux AC, VT, BQ, CA, OD + journaux personnalisés</li>
          <li>Saisie multi-lignes avec contrôle débit/crédit en temps réel</li>
          <li>Statuts Brouillon / Validé avec verrouillage</li>
          <li>Lettrage des comptes de tiers, analytique</li>
        </ul>
        <div class="mt-3 p-3 bg-emerald-50 rounded-lg text-sm text-emerald-800"><strong>Bénéfice :</strong> Conformité OHADA garantie dès le départ, sans configuration fastidieuse.</div>`
      },
      {
        titre: 'Module IA',
        contenu: `<div class="flex items-center gap-2 mb-3"><span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Disponible depuis PREMIUM</span></div>
        <p class="text-gray-700">Assistant comptable intelligent intégré dans le workflow de saisie.</p>
        <ul class="list-disc pl-5 space-y-1 mt-3 text-sm text-gray-600">
          <li>Suggestion d'imputation : compte, journal et TVA dès la frappe</li>
          <li>Détection d'anomalies : doublons, montants atypiques, TVA incohérente</li>
          <li>Chat comptable en langage naturel avec références SYSCOHADA</li>
          <li>Analyse financière commentée N vs N−1</li>
          <li>Contrôle pré-clôture : 15 points de vérification</li>
        </ul>
        <div class="mt-3 p-3 bg-purple-50 rounded-lg text-sm text-purple-800"><strong>Bénéfice :</strong> Réduction du temps de saisie, détection proactive des erreurs avant clôture.</div>`
      },
      {
        titre: 'Import & Migration',
        contenu: `<div class="flex items-center gap-2 mb-3"><span class="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">FEC+CSV depuis FREE · Tous formats depuis STANDARD</span></div>
        <p class="text-gray-700">Transfert de données depuis n'importe quel logiciel comptable existant.</p>
        <div class="grid grid-cols-3 gap-2 mt-3">
          <div class="p-2 bg-gray-50 rounded text-center text-xs font-medium text-gray-700">FEC</div>
          <div class="p-2 bg-gray-50 rounded text-center text-xs font-medium text-gray-700">Sage 50/100</div>
          <div class="p-2 bg-gray-50 rounded text-center text-xs font-medium text-gray-700">EBP</div>
          <div class="p-2 bg-gray-50 rounded text-center text-xs font-medium text-gray-700">WaveSoft</div>
          <div class="p-2 bg-gray-50 rounded text-center text-xs font-medium text-gray-700">Excel/CSV</div>
          <div class="p-2 bg-gray-50 rounded text-center text-xs font-medium text-gray-700">Soldes</div>
        </div>
        <div class="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800"><strong>Bénéfice :</strong> Migration depuis l'ancien logiciel en quelques minutes, sans ressaisie manuelle.</div>`
      },
      {
        titre: 'RH & Paie',
        contenu: `<div class="flex items-center gap-2 mb-3"><span class="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">Disponible depuis PREMIUM</span></div>
        <p class="text-gray-700">Suite RH complète intégrée à la comptabilité.</p>
        <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
          <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Paie &amp; bulletins</div>
          <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Congés &amp; absences</div>
          <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Notes de frais</div>
          <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Évaluations</div>
          <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Recrutement</div>
          <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Formation</div>
          <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Portail collaborateur</div>
          <div class="flex items-center gap-2"><span class="text-emerald-500">✓</span> Dashboard RH</div>
        </div>
        <div class="mt-3 p-3 bg-purple-50 rounded-lg text-sm text-purple-800"><strong>Bénéfice :</strong> Écritures de paie générées automatiquement — RH et comptabilité unifiés.</div>`
      },
      {
        titre: 'Consolidation (ENTERPRISE)',
        contenu: `<div class="flex items-center gap-2 mb-3"><span class="px-2 py-0.5 bg-gray-800 text-gray-100 text-xs rounded-full font-medium">Disponible depuis ENTERPRISE</span></div>
        <p class="text-gray-700">Consolidation des comptes pour les groupes et holdings.</p>
        <ul class="list-disc pl-5 space-y-1 mt-3 text-sm text-gray-600">
          <li>Consolidation multi-filiales (intégration globale, mise en équivalence)</li>
          <li>Élimination des transactions intra-groupe</li>
          <li>États financiers consolidés (bilan et compte de résultat de groupe)</li>
          <li>Retraitement des différences de référentiel</li>
          <li>Reporting multi-devises</li>
        </ul>
        <div class="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700"><strong>Bénéfice :</strong> Vision financière globale du groupe en temps réel sans ressaisie manuelle.</div>`
      }
    ]
  },
  {
    id: 'argumentaire',
    titre: 'Argumentaire commercial',
    sousTitre: 'Arguments clés, gestion des objections et use cases clients.',
    icone: '💼',
    badge: 'Équipe commerciale',
    sections: [
      {
        titre: 'Accroche selon le profil',
        contenu: `<div class="space-y-4">
          <div class="p-4 border-l-4 border-emerald-400 bg-emerald-50 rounded-r-xl">
            <div class="text-xs font-semibold text-emerald-600 uppercase tracking-wide mb-1">Pour le dirigeant de PME</div>
            <p class="text-sm text-emerald-900 italic">« Avez-vous une visibilité claire sur votre résultat en temps réel ? e-Compta IA vous donne cette réponse en quelques secondes, sans attendre la clôture de fin d'exercice. »</p>
          </div>
          <div class="p-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-xl">
            <div class="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Pour le comptable</div>
            <p class="text-sm text-blue-900 italic">« Combien d'heures par mois consacrez-vous à la ressaisie de données ? e-Compta IA automatise ces tâches pour vous concentrer sur l'analyse et le conseil. »</p>
          </div>
          <div class="p-4 border-l-4 border-purple-400 bg-purple-50 rounded-r-xl">
            <div class="text-xs font-semibold text-purple-600 uppercase tracking-wide mb-1">Pour le cabinet</div>
            <p class="text-sm text-purple-900 italic">« Gérez-vous plusieurs dossiers avec des outils différents ? e-Compta IA centralise tous vos dossiers avec un portail client intégré. »</p>
          </div>
        </div>`
      },
      {
        titre: 'Gestion des objections',
        contenu: `<div class="space-y-4">
          <details class="border border-gray-200 rounded-xl overflow-hidden">
            <summary class="px-4 py-3 bg-gray-50 cursor-pointer font-medium text-gray-800 text-sm">💬 « Mon logiciel actuel (Sage/EBP) me convient. »</summary>
            <div class="px-4 py-3 text-sm text-gray-700">Avez-vous accès à votre comptabilité depuis votre téléphone ? Votre comptable peut-il travailler à distance en temps réel ? Bénéficiez-vous de l'IA pour détecter les erreurs ? e-Compta IA apporte une expérience moderne, cloud et intelligente — à un coût bien inférieur.</div>
          </details>
          <details class="border border-gray-200 rounded-xl overflow-hidden">
            <summary class="px-4 py-3 bg-gray-50 cursor-pointer font-medium text-gray-800 text-sm">💬 « C'est trop cher. »</summary>
            <div class="px-4 py-3 text-sm text-gray-700">Comparons le coût total. Un comptable à temps partiel coûte X FCFA/mois. Avec le Module IA, votre comptable gagne 30 % de temps — rentabilisé dès le premier mois. Et le plan FREE vous permet de commencer gratuitement pour en juger vous-même.</div>
          </details>
          <details class="border border-gray-200 rounded-xl overflow-hidden">
            <summary class="px-4 py-3 bg-gray-50 cursor-pointer font-medium text-gray-800 text-sm">💬 « Je ne fais pas confiance au cloud. »</summary>
            <div class="px-4 py-3 text-sm text-gray-700">Nos données sont chiffrées TLS 1.3 en transit et AES-256 au repos, avec sauvegardes quotidiennes rétention 30 jours. Vos données sont plus sécurisées que sur un ordinateur sans sauvegarde. Et vous pouvez les exporter à tout moment.</div>
          </details>
          <details class="border border-gray-200 rounded-xl overflow-hidden">
            <summary class="px-4 py-3 bg-gray-50 cursor-pointer font-medium text-gray-800 text-sm">💬 « Je n'ai pas le temps de changer. »</summary>
            <div class="px-4 py-3 text-sm text-gray-700">La migration prend en moyenne 2 heures avec notre module Import. Vous pouvez démarrer sur le prochain exercice en important simplement les soldes d'ouverture.</div>
          </details>
        </div>`
      },
      {
        titre: 'Use cases clients types',
        contenu: `<div class="space-y-4">
          <div class="p-4 bg-white border border-gray-200 rounded-xl">
            <div class="flex items-center gap-2 mb-2"><span class="text-lg">🏪</span><span class="font-semibold text-gray-900">Commerçant — Plan STANDARD</span></div>
            <p class="text-sm text-gray-600">Importateur/distributeur, 15 employés. Remplace des fichiers Excel par des états financiers conformes pour la banque. <strong class="text-emerald-700">Résultat : crédit bancaire obtenu grâce aux états produits en 2 jours.</strong></p>
          </div>
          <div class="p-4 bg-white border border-gray-200 rounded-xl">
            <div class="flex items-center gap-2 mb-2"><span class="text-lg">📋</span><span class="font-semibold text-gray-900">Cabinet comptable — Plan ENTERPRISE</span></div>
            <p class="text-sm text-gray-600">30 dossiers clients, 4 collaborateurs. Migration depuis Sage, portail client activé. <strong class="text-emerald-700">Résultat : −40 % de temps de saisie, clients satisfaits de l'accès en temps réel.</strong></p>
          </div>
          <div class="p-4 bg-white border border-gray-200 rounded-xl">
            <div class="flex items-center gap-2 mb-2"><span class="text-lg">🌍</span><span class="font-semibold text-gray-900">ONG — Plan PREMIUM</span></div>
            <p class="text-sm text-gray-600">Financement multi-bailleurs, comptabilité analytique obligatoire. Axes analytiques par projet. <strong class="text-emerald-700">Résultat : rapports bailleurs générés automatiquement en quelques minutes.</strong></p>
          </div>
        </div>`
      }
    ]
  },
  {
    id: 'partenaires',
    titre: 'Programme Partenaires',
    sousTitre: 'Rejoignez le réseau de partenaires certifiés L\'N EXPERTISE.',
    icone: '🤝',
    sections: [
      {
        titre: 'Pourquoi devenir partenaire ?',
        contenu: `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl">
            <span class="text-2xl">💰</span>
            <div><strong class="text-emerald-900">Commission récurrente</strong><p class="text-sm text-emerald-700 mt-1">Sur chaque client apporté, tant qu'il reste abonné.</p></div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
            <span class="text-2xl">🎓</span>
            <div><strong class="text-blue-900">Formation certifiante</strong><p class="text-sm text-blue-700 mt-1">Certification « Partenaire Certifié e-Compta IA » valable 2 ans.</p></div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-purple-50 rounded-xl">
            <span class="text-2xl">📣</span>
            <div><strong class="text-purple-900">Co-marketing</strong><p class="text-sm text-purple-700 mt-1">Apparition dans l'annuaire des partenaires certifiés.</p></div>
          </div>
          <div class="flex items-start gap-3 p-4 bg-amber-50 rounded-xl">
            <span class="text-2xl">🔧</span>
            <div><strong class="text-amber-900">Support prioritaire</strong><p class="text-sm text-amber-700 mt-1">Canal dédié et accès aux versions bêta.</p></div>
          </div>
        </div>`
      },
      {
        titre: 'Niveaux de partenariat',
        contenu: `<div class="overflow-x-auto"><table class="w-full text-sm border-collapse">
          <thead><tr class="bg-gray-50"><th class="border border-gray-200 px-3 py-2 text-left">Niveau</th><th class="border border-gray-200 px-3 py-2 text-left">Conditions</th><th class="border border-gray-200 px-3 py-2 text-left">Commission</th><th class="border border-gray-200 px-3 py-2 text-left">Avantages</th></tr></thead>
          <tbody>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">🥈 Silver</td><td class="border border-gray-200 px-3 py-2">5 clients actifs</td><td class="border border-gray-200 px-3 py-2 font-semibold text-emerald-700">10 %</td><td class="border border-gray-200 px-3 py-2">Formation de base</td></tr>
            <tr class="bg-gray-50"><td class="border border-gray-200 px-3 py-2 font-medium">🥇 Gold</td><td class="border border-gray-200 px-3 py-2">20 clients actifs</td><td class="border border-gray-200 px-3 py-2 font-semibold text-emerald-700">15 %</td><td class="border border-gray-200 px-3 py-2">Support prioritaire, co-marketing</td></tr>
            <tr><td class="border border-gray-200 px-3 py-2 font-medium">💎 Platinum</td><td class="border border-gray-200 px-3 py-2">50 clients actifs</td><td class="border border-gray-200 px-3 py-2 font-semibold text-emerald-700">20 %</td><td class="border border-gray-200 px-3 py-2">Support dédié, accès bêta, personnalisation</td></tr>
          </tbody>
        </table></div>`
      },
      {
        titre: 'Comment rejoindre ?',
        contenu: `<ol class="list-decimal pl-5 space-y-2 text-sm text-gray-700">
          <li>Envoyez votre candidature à <a href="mailto:[EMAIL_CONTACT]" class="text-emerald-600 underline">[EMAIL_CONTACT]</a> — Objet : « Candidature Programme Partenaires »</li>
          <li>Entretien de qualification (30 minutes)</li>
          <li>Signature de la convention de partenariat</li>
          <li>Formation initiale (à distance ou en présentiel à Ouagadougou)</li>
          <li>Accès à l'espace partenaire et aux outils commerciaux</li>
        </ol>
        <div class="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p class="font-semibold text-emerald-900">Prêt à rejoindre le programme ?</p>
            <p class="text-sm text-emerald-700">L'équipe L'N EXPERTISE vous répond sous 48 heures.</p>
          </div>
          <a href="mailto:[EMAIL_CONTACT]?subject=Candidature Programme Partenaires"
             class="shrink-0 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors">
            Candidater →
          </a>
        </div>`
      }
    ]
  }
];

@Component({
  selector: 'app-commercial-docs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="min-h-screen bg-gray-50">

  <!-- Header -->
  <div class="bg-white border-b border-gray-200">
    <div class="max-w-6xl mx-auto px-4 py-6">
      <div class="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <a routerLink="/tarifs" class="hover:text-emerald-600 transition-colors">Accueil</a>
        <span>›</span>
        @if (docActif()) {
          <button (click)="retourListe()" class="hover:text-emerald-600 transition-colors">e-Compta IA</button>
          <span>›</span>
          <span class="text-gray-900 font-medium">{{ docActif()!.titre }}</span>
        } @else {
          <span class="text-gray-900 font-medium">e-Compta IA — Documentation commerciale</span>
        }
      </div>

      @if (!docActif()) {
        <h1 class="text-3xl font-bold text-gray-900">e-Compta IA</h1>
        <p class="text-gray-500 mt-2 max-w-2xl">La plateforme de gestion comptable et financière conçue pour les entreprises africaines sous SYSCOHADA Révisé.</p>
      } @else {
        <div class="flex items-center gap-3">
          <span class="text-3xl">{{ docActif()!.icone }}</span>
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-gray-900">{{ docActif()!.titre }}</h1>
              @if (docActif()!.badge) {
                <span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">{{ docActif()!.badge }}</span>
              }
            </div>
            <p class="text-gray-500 text-sm mt-0.5">{{ docActif()!.sousTitre }}</p>
          </div>
        </div>
      }
    </div>
  </div>

  <div class="max-w-6xl mx-auto px-4 py-8">

    @if (!docActif()) {

      <!-- Grille des documents -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
        @for (doc of docs; track doc.id) {
          <div class="bg-white rounded-xl border border-gray-100 p-6 hover:border-emerald-300 hover:shadow-md cursor-pointer transition-all group"
               (click)="ouvrirDoc(doc.id)">
            <div class="flex items-start justify-between mb-4">
              <span class="text-3xl">{{ doc.icone }}</span>
              <div class="flex items-center gap-2">
                @if (doc.badge) {
                  <span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">{{ doc.badge }}</span>
                }
                <svg class="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1 group-hover:text-emerald-700 transition-colors">{{ doc.titre }}</h3>
            <p class="text-sm text-gray-500 leading-relaxed">{{ doc.sousTitre }}</p>
          </div>
        }
      </div>

      <!-- CTA contact -->
      <div class="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white text-center">
        <h2 class="text-2xl font-bold mb-2">Intéressé par e-Compta IA ?</h2>
        <p class="text-emerald-100 mb-6">Démarrez gratuitement avec le plan FREE ou contactez notre équipe pour une démo personnalisée.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a routerLink="/auth/register"
             class="bg-white text-emerald-700 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition-colors">
            Commencer gratuitement
          </a>
          <a href="mailto:[EMAIL_CONTACT]?subject=Demande de démo e-Compta IA"
             class="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
            Demander une démo
          </a>
        </div>
      </div>

    } @else {

      <!-- Vue détail -->
      <div class="flex flex-col lg:flex-row gap-8">

        <!-- Sommaire latéral -->
        <aside class="lg:w-60 shrink-0">
          <div class="bg-white rounded-xl border border-gray-100 p-4 sticky top-6">
            <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Sections</h3>
            <nav class="space-y-1">
              @for (s of docActif()!.sections; track s.titre; let i = $index) {
                <button (click)="scrollTo('csec-' + i)"
                        class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-gray-600 truncate">
                  {{ s.titre }}
                </button>
              }
            </nav>
            <div class="mt-6 pt-4 border-t border-gray-100">
              <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Autres documents</h3>
              <nav class="space-y-1">
                @for (doc of docs; track doc.id) {
                  @if (doc.id !== docActif()!.id) {
                    <button (click)="ouvrirDoc(doc.id)"
                            class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-50 transition-colors text-gray-500 flex items-center gap-2 truncate">
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
            <div [id]="'csec-' + i" class="bg-white rounded-xl border border-gray-100 p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">{{ s.titre }}</h2>
              <div class="text-sm text-gray-700 leading-relaxed" [innerHTML]="s.contenu"></div>
            </div>
          }

          <div class="flex flex-col sm:flex-row gap-3 justify-between items-center pt-2">
            <button (click)="retourListe()"
                    class="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
              Retour
            </button>
            <a href="mailto:[EMAIL_CONTACT]?subject=Informations e-Compta IA"
               class="text-sm text-emerald-600 hover:text-emerald-800 underline transition-colors">
              Contacter l'équipe commerciale →
            </a>
          </div>
        </main>
      </div>
    }
  </div>
</div>
  `
})
export class CommercialDocsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly docs = DOCS;
  docActif = signal<CommercialDoc | null>(null);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') as DocId | null;
      this.docActif.set(id ? (DOCS.find(d => d.id === id) ?? null) : null);
    });
  }

  ouvrirDoc(id: DocId): void {
    this.docActif.set(DOCS.find(d => d.id === id) ?? null);
    this.router.navigate(['/produit', id]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retourListe(): void {
    this.docActif.set(null);
    this.router.navigate(['/produit']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  scrollTo(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
