import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

type LegalDoc = 'mentions-legales' | 'cgu' | 'cgv' | 'confidentialite';

interface DocTab {
  id: LegalDoc;
  label: string;
  shortLabel: string;
}

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="min-h-screen bg-gray-50">

  <!-- Header -->
  <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-4xl mx-auto px-4">
      <div class="flex items-center gap-2 py-3 text-sm text-gray-500">
        <a routerLink="/tarifs" class="hover:text-emerald-600 transition-colors">Accueil</a>
        <span>›</span>
        <span class="text-gray-900 font-medium">{{ activeTab().label }}</span>
      </div>
      <nav class="flex gap-1 overflow-x-auto pb-0 -mb-px">
        @for (tab of tabs; track tab.id) {
          <button (click)="navigateTo(tab.id)"
                  class="px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors"
                  [class]="doc() === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'">
            {{ tab.shortLabel }}
          </button>
        }
      </nav>
    </div>
  </div>

  <!-- Content -->
  <div class="max-w-4xl mx-auto px-4 py-10">
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-12 prose prose-slate max-w-none">

      @switch (doc()) {

        @case ('mentions-legales') {
          <h1>Mentions Légales</h1>
          <p class="text-sm text-gray-400">Date d'entrée en vigueur : [DATE_ENTREE_EN_VIGUEUR]</p>

          <h2>1. Éditeur de la plateforme</h2>
          <p>La plateforme <strong>e-Compta IA</strong> est éditée par :</p>
          <p>
            <strong>L'N EXPERTISE</strong><br>
            Entreprise individuelle / Cabinet d'expertise comptable<br>
            Propriétaire : <strong>Lassané NACOULMA</strong><br><br>
            Siège social : [ADRESSE_SIEGE], Ouagadougou, Burkina Faso<br>
            RCCM : [RCCM]<br>
            IFU : [IFU]<br>
            Téléphone : [TELEPHONE]<br>
            E-mail : [EMAIL_CONTACT]
          </p>

          <h2>2. Directeur de la publication</h2>
          <p>Le directeur de la publication est <strong>Lassané NACOULMA</strong>, en sa qualité de propriétaire de L'N EXPERTISE.</p>

          <h2>3. Hébergement</h2>
          <p>La plateforme est hébergée par :<br>
          <strong>[HEBERGEUR_NOM]</strong><br>
          [HEBERGEUR_ADRESSE] — [HEBERGEUR_PAYS]</p>

          <h2>4. Propriété intellectuelle</h2>
          <p>Tous les contenus présents sur la plateforme e-Compta IA (textes, graphiques, logotypes, icônes, images, éléments sonores, logiciels, code source, bases de données, etc.) sont la propriété exclusive de L'N EXPERTISE ou font l'objet d'une autorisation d'utilisation accordée à L'N EXPERTISE.</p>
          <p>Toute reproduction, représentation, modification, publication, transmission ou dénaturation, totale ou partielle, de ces contenus, par quelque procédé que ce soit, est interdite sans l'autorisation préalable et écrite de L'N EXPERTISE.</p>

          <h2>5. Données personnelles</h2>
          <p>Le traitement des données à caractère personnel collectées via la plateforme est réalisé conformément à la législation en vigueur au Burkina Faso, notamment la loi n°010-2004/AN du 20 avril 2004 et les lignes directrices de la <strong>CNDP</strong> (Commission Nationale de l'Informatique et des Libertés).</p>
          <p>Pour toute question relative à vos données personnelles, contactez notre DPD : [EMAIL_DPO]</p>
          <p>Pour plus d'informations, consultez notre <button (click)="navigateTo('confidentialite')" class="text-emerald-600 underline cursor-pointer bg-transparent border-none p-0">Politique de Confidentialité</button>.</p>

          <h2>6. Cookies</h2>
          <p>La plateforme e-Compta IA utilise des cookies techniques nécessaires à son bon fonctionnement. Aucun cookie publicitaire ou de traçage tiers n'est déposé sans votre consentement explicite.</p>

          <h2>7. Responsabilité</h2>
          <p>L'N EXPERTISE s'efforce de maintenir la plateforme accessible et à jour. Toutefois, elle ne saurait être tenue responsable des dommages directs ou indirects résultant de l'utilisation de la plateforme, d'interruptions de service ou d'erreurs dans les informations présentées.</p>

          <h2>8. Droit applicable</h2>
          <p>Les présentes mentions légales sont soumises au droit burkinabè et aux dispositions applicables de l'<strong>OHADA</strong>. Tout litige sera soumis aux tribunaux compétents d'Ouagadougou, Burkina Faso.</p>
        }

        @case ('cgu') {
          <h1>Conditions Générales d'Utilisation (CGU)</h1>
          <p class="text-sm text-gray-400">Version 1.0 — Date d'entrée en vigueur : [DATE_ENTREE_EN_VIGUEUR]</p>

          <h2>Préambule</h2>
          <p>Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme <strong>e-Compta IA</strong>. En créant un compte, l'Utilisateur accepte sans réserve les présentes CGU.</p>

          <h2>Article 1 — Définitions</h2>
          <ul>
            <li><strong>Plateforme</strong> : L'application web e-Compta IA</li>
            <li><strong>Éditeur</strong> : L'N EXPERTISE, représentée par Lassané NACOULMA</li>
            <li><strong>Utilisateur</strong> : Toute personne ayant créé un compte sur la Plateforme</li>
            <li><strong>Données Comptables</strong> : Toutes informations financières et écritures saisies</li>
            <li><strong>Module IA</strong> : Fonctionnalité d'assistance par intelligence artificielle</li>
          </ul>

          <h2>Article 2 — Accès à la Plateforme</h2>
          <p>L'accès nécessite la création d'un compte avec des informations exactes. L'Utilisateur est seul responsable de la confidentialité de ses identifiants. L'utilisation est réservée aux personnes majeures (18 ans ou plus) ayant la pleine capacité juridique.</p>

          <h2>Article 3 — Description des Services</h2>
          <p>La Plateforme offre notamment : tenue de comptabilité générale (SYSCOHADA Révisé), gestion du plan comptable, journaux, écritures, rapprochement bancaire, TVA, états financiers, import depuis d'autres logiciels, assistance IA, gestion des tiers, immobilisations, budget, trésorerie, et fonctionnalités RH et consolidation selon Plan.</p>

          <h2>Article 4 — Obligations de l'Utilisateur</h2>
          <p>L'Utilisateur s'engage à utiliser la Plateforme conformément à sa destination et aux lois en vigueur, à ne pas tenter de contourner les mécanismes de sécurité, à ne pas introduire de logiciels malveillants, à ne pas partager son accès avec des tiers non autorisés, et à respecter les droits de propriété intellectuelle de L'N EXPERTISE.</p>

          <h2>Article 5 — Données et Responsabilité comptable</h2>
          <p>Les Données Comptables restent la propriété exclusive de l'Utilisateur. L'Utilisateur est seul responsable de leur exactitude. Les suggestions du Module IA sont fournies à titre indicatif et ne constituent pas un avis professionnel certifié.</p>

          <h2>Article 6 — Plans et Limitations</h2>
          <p>L'accès à certaines fonctionnalités est conditionné au Plan souscrit. Pour les conditions financières, consultez les <button (click)="navigateTo('cgv')" class="text-emerald-600 underline cursor-pointer bg-transparent border-none p-0">Conditions Générales de Vente</button>.</p>

          <h2>Article 7 — Propriété intellectuelle</h2>
          <p>La Plateforme, son code source, ses algorithmes et ses interfaces constituent des œuvres protégées. Toute reproduction non autorisée constitue une contrefaçon passible de sanctions.</p>

          <h2>Article 8 — Résiliation et Suspension</h2>
          <p>L'Utilisateur peut résilier son compte à tout moment. Les données sont conservées 30 jours puis supprimées. L'Éditeur peut suspendre l'accès en cas de violation des CGU.</p>

          <h2>Article 9 — Limitation de responsabilité</h2>
          <p>L'N EXPERTISE ne pourra être tenue responsable des pertes de données résultant d'une faute de l'Utilisateur, des dommages indirects, des conséquences d'une mauvaise utilisation, ou des erreurs générées par le Module IA.</p>

          <h2>Article 10 — Modifications des CGU</h2>
          <p>Les Utilisateurs seront informés par e-mail au moins 15 jours avant l'entrée en vigueur de nouvelles conditions. La poursuite de l'utilisation vaut acceptation.</p>

          <h2>Article 11 — Droit applicable</h2>
          <p>Les présentes CGU sont régies par le droit du Burkina Faso et les textes uniformes de l'<strong>OHADA</strong>. Les litiges non résolus à l'amiable seront soumis aux <strong>tribunaux compétents d'Ouagadougou</strong>.</p>

          <h2>Article 12 — Contact</h2>
          <p><strong>L'N EXPERTISE</strong> — [ADRESSE_SIEGE], Ouagadougou, Burkina Faso<br>
          E-mail : [EMAIL_CONTACT] — Téléphone : [TELEPHONE]</p>
        }

        @case ('cgv') {
          <h1>Conditions Générales de Vente (CGV)</h1>
          <p class="text-sm text-gray-400">Version 1.0 — Date d'entrée en vigueur : [DATE_ENTREE_EN_VIGUEUR]</p>

          <h2>Préambule</h2>
          <p>Les présentes CGV s'appliquent à toute souscription à un abonnement payant de la plateforme <strong>e-Compta IA</strong>. Elles complètent les <button (click)="navigateTo('cgu')" class="text-emerald-600 underline cursor-pointer bg-transparent border-none p-0">CGU</button>.</p>

          <h2>Article 1 — Plans et Tarifs</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border border-gray-200 px-4 py-2 text-left">Plan</th>
                  <th class="border border-gray-200 px-4 py-2 text-left">Description</th>
                  <th class="border border-gray-200 px-4 py-2 text-left">Facturation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border border-gray-200 px-4 py-2 font-medium">FREE</td>
                  <td class="border border-gray-200 px-4 py-2">Accès gratuit limité</td>
                  <td class="border border-gray-200 px-4 py-2 text-emerald-600 font-medium">Gratuit</td>
                </tr>
                <tr class="bg-gray-50">
                  <td class="border border-gray-200 px-4 py-2 font-medium">STANDARD</td>
                  <td class="border border-gray-200 px-4 py-2">Comptabilité complète, utilisateurs illimités</td>
                  <td class="border border-gray-200 px-4 py-2">Mensuel / Annuel</td>
                </tr>
                <tr>
                  <td class="border border-gray-200 px-4 py-2 font-medium">PREMIUM</td>
                  <td class="border border-gray-200 px-4 py-2">STANDARD + IA, trésorerie avancée, consolidation</td>
                  <td class="border border-gray-200 px-4 py-2">Mensuel / Annuel</td>
                </tr>
                <tr class="bg-gray-50">
                  <td class="border border-gray-200 px-4 py-2 font-medium">ENTERPRISE</td>
                  <td class="border border-gray-200 px-4 py-2">Solution sur mesure pour groupes et cabinets</td>
                  <td class="border border-gray-200 px-4 py-2">Sur devis</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>Les tarifs en vigueur sont exprimés en <strong>Francs CFA (XOF)</strong>, TTC. Consultez la page <a routerLink="/tarifs" class="text-emerald-600 underline">Tarifs</a> pour les montants actuels.</p>

          <h2>Article 2 — Souscription</h2>
          <p>Le contrat est formé à la confirmation de paiement. Le Client dispose d'un délai de <strong>7 jours calendaires</strong> pour se rétracter (sans accès aux fonctionnalités payantes). Demande à adresser à [EMAIL_CONTACT].</p>

          <h2>Article 3 — Paiement</h2>
          <p>Moyens acceptés : <strong>Mobile Money</strong> (Orange Money, Moov Money, Coris Money) via CinetPay ; <strong>Carte bancaire</strong> (Visa, Mastercard) via CinetPay/Stripe ; <strong>Virement bancaire</strong> (Enterprise uniquement).</p>
          <p>L'N EXPERTISE ne stocke à aucun moment vos données bancaires ou de Mobile Money.</p>

          <h2>Article 4 — Renouvellement et Résiliation</h2>
          <p>L'Abonnement se renouvelle automatiquement. Un rappel est envoyé 7 jours avant l'échéance. La résiliation prend effet à la fin de la Période en cours (pas de remboursement prorata, sauf cas prévus à l'Article 5).</p>

          <h2>Article 5 — Remboursements</h2>
          <ul>
            <li>Rétractation dans les 7 jours (sans accès payant) : remboursement total</li>
            <li>Interruption de service &gt; 72h imputable à L'N EXPERTISE : prorata de l'interruption</li>
            <li>Fermeture définitive de la Plateforme : prorata du temps restant</li>
          </ul>

          <h2>Article 6 — Garantie de service (SLA)</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="bg-gray-50">
                  <th class="border border-gray-200 px-4 py-2 text-left">Plan</th>
                  <th class="border border-gray-200 px-4 py-2 text-left">Disponibilité</th>
                  <th class="border border-gray-200 px-4 py-2 text-left">Support</th>
                </tr>
              </thead>
              <tbody>
                <tr><td class="border border-gray-200 px-4 py-2">FREE</td><td class="border border-gray-200 px-4 py-2">Best-effort</td><td class="border border-gray-200 px-4 py-2">Documentation</td></tr>
                <tr class="bg-gray-50"><td class="border border-gray-200 px-4 py-2">STANDARD</td><td class="border border-gray-200 px-4 py-2">99,0 % / mois</td><td class="border border-gray-200 px-4 py-2">E-mail (48h)</td></tr>
                <tr><td class="border border-gray-200 px-4 py-2">PREMIUM</td><td class="border border-gray-200 px-4 py-2">99,5 % / mois</td><td class="border border-gray-200 px-4 py-2">E-mail prioritaire (24h)</td></tr>
                <tr class="bg-gray-50"><td class="border border-gray-200 px-4 py-2">ENTERPRISE</td><td class="border border-gray-200 px-4 py-2">99,9 % / mois</td><td class="border border-gray-200 px-4 py-2">Dédié (4h)</td></tr>
              </tbody>
            </table>
          </div>

          <h2>Article 7 — Droit applicable</h2>
          <p>Les présentes CGV sont soumises au droit burkinabè et aux Actes uniformes de l'<strong>OHADA</strong>. Les litiges non résolus à l'amiable seront soumis au <strong>Tribunal de Commerce de Ouagadougou</strong>.</p>

          <h2>Article 8 — Contact commercial</h2>
          <p><strong>L'N EXPERTISE</strong> — [ADRESSE_SIEGE], Ouagadougou, Burkina Faso<br>
          E-mail : [EMAIL_CONTACT] — Téléphone : [TELEPHONE]</p>
        }

        @case ('confidentialite') {
          <h1>Politique de Confidentialité</h1>
          <p class="text-sm text-gray-400">Version 1.0 — Date d'entrée en vigueur : [DATE_ENTREE_EN_VIGUEUR]</p>

          <h2>Préambule</h2>
          <p>L'N EXPERTISE accorde une importance primordiale à la protection de vos données. Cette politique est conforme à la <strong>loi n°010-2004/AN</strong> du Burkina Faso, aux lignes directrices de la <strong>CNDP</strong> et, par analogie, au <strong>RGPD</strong> pour les utilisateurs européens.</p>

          <h2>Article 1 — Responsable du Traitement</h2>
          <p>
            <strong>L'N EXPERTISE</strong> — Lassané NACOULMA<br>
            [ADRESSE_SIEGE], Ouagadougou, Burkina Faso<br>
            DPD : <a href="mailto:[EMAIL_DPO]" class="text-emerald-600">[EMAIL_DPO]</a>
          </p>

          <h2>Article 2 — Données collectées</h2>
          <p><strong>Données de compte :</strong> nom, prénom, e-mail, mot de passe (hashé), téléphone (si 2FA activée).</p>
          <p><strong>Données de l'entreprise :</strong> raison sociale, RCCM, IFU, exercices comptables, RIB masqué.</p>
          <p><strong>Données comptables et financières :</strong> appartenant à l'Utilisateur — L'N EXPERTISE agit en qualité de <em>sous-traitant</em> sur instruction de l'Utilisateur.</p>
          <p><strong>Données techniques :</strong> adresse IP, journaux d'accès, type de navigateur (intérêt légitime).</p>
          <p><strong>Données de paiement :</strong> non stockées par L'N EXPERTISE — traitées par CinetPay et Stripe.</p>

          <h2>Article 3 — Finalités</h2>
          <ul>
            <li>Fourniture du service de comptabilité et d'états financiers</li>
            <li>Gestion des abonnements et de la facturation</li>
            <li>Support technique et assistance</li>
            <li>Sécurité et prévention des accès frauduleux</li>
            <li>Module IA : traitement de vos données comptables pour générer des suggestions</li>
            <li>Communications de service (notifications, alertes)</li>
            <li>Obligations légales (conservation fiscale et comptable)</li>
          </ul>

          <h2>Article 4 — Durée de conservation</h2>
          <ul>
            <li>Données de compte actif : pendant toute la durée de l'abonnement</li>
            <li>Données de compte résilié : 30 jours, puis suppression</li>
            <li>Données comptables : 10 ans (obligation légale OHADA/fiscale)</li>
            <li>Journaux de connexion : 12 mois glissants</li>
            <li>Données de facturation : 10 ans (obligation fiscale)</li>
          </ul>

          <h2>Article 5 — Destinataires et sous-traitants</h2>
          <p>Nos sous-traitants techniques incluent [HEBERGEUR_NOM] (hébergement), CinetPay (paiements Mobile Money), et Stripe (paiements par carte). Tous sont liés par un contrat de traitement des données (DPA).</p>
          <p><strong>L'N EXPERTISE ne vend jamais vos données à des tiers à des fins commerciales.</strong></p>

          <h2>Article 6 — Sécurité</h2>
          <p>Mesures mises en œuvre : chiffrement HTTPS/TLS 1.3, mots de passe hachés (bcrypt), isolation des données multi-tenant, piste d'audit complète, sauvegardes chiffrées quotidiennes (rétention 30 jours).</p>

          <h2>Article 7 — Vos droits</h2>
          <p>Conformément à la loi n°010-2004/AN et au RGPD, vous disposez des droits d'accès, rectification, effacement, portabilité, opposition, limitation et retrait du consentement.</p>
          <p>Pour exercer vos droits, contactez notre DPD : <a href="mailto:[EMAIL_DPO]" class="text-emerald-600">[EMAIL_DPO]</a> (réponse sous 30 jours).</p>
          <p>En cas de réclamation non résolue, vous pouvez saisir la <strong>CNDP</strong> (Burkina Faso).</p>

          <h2>Article 8 — Cookies</h2>
          <p><strong>Cookies nécessaires</strong> (sans consentement) : token d'authentification JWT, refresh token (7 jours), contexte multi-entreprise.</p>
          <p><strong>Cookies analytiques</strong> (avec consentement) : analyse d'audience anonymisée.</p>
          <p>Aucun cookie publicitaire ou de traçage comportemental tiers n'est utilisé.</p>

          <h2>Article 9 — Modifications</h2>
          <p>Toute modification substantielle sera notifiée par e-mail au moins 15 jours avant son entrée en vigueur.</p>

          <h2>Article 10 — Contact DPD</h2>
          <p>
            <strong>L'N EXPERTISE — DPD</strong><br>
            [ADRESSE_SIEGE], Ouagadougou, Burkina Faso<br>
            DPD : <a href="mailto:[EMAIL_DPO]" class="text-emerald-600">[EMAIL_DPO]</a><br>
            E-mail : [EMAIL_CONTACT] — Téléphone : [TELEPHONE]
          </p>
        }

      }

    </div>

    <!-- Footer navigation -->
    <div class="mt-8 flex flex-wrap gap-3 justify-center">
      @for (tab of tabs; track tab.id) {
        @if (tab.id !== doc()) {
          <button (click)="navigateTo(tab.id)"
                  class="text-sm text-emerald-600 hover:text-emerald-800 underline transition-colors">
            {{ tab.label }}
          </button>
        }
      }
    </div>

    <p class="text-center text-xs text-gray-400 mt-6">
      L'N EXPERTISE — Ouagadougou, Burkina Faso
    </p>
  </div>

</div>
  `
})
export class LegalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly tabs: DocTab[] = [
    { id: 'mentions-legales',  label: 'Mentions légales',              shortLabel: 'Mentions légales' },
    { id: 'cgu',               label: 'Conditions Générales d\'Utilisation', shortLabel: 'CGU' },
    { id: 'cgv',               label: 'Conditions Générales de Vente', shortLabel: 'CGV' },
    { id: 'confidentialite',   label: 'Politique de Confidentialité',  shortLabel: 'Confidentialité' },
  ];

  doc = signal<LegalDoc>('mentions-legales');

  activeTab = computed(() => this.tabs.find(t => t.id === this.doc()) ?? this.tabs[0]);

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['doc']) {
        this.doc.set(data['doc'] as LegalDoc);
      }
    });
    this.route.url.subscribe(segments => {
      const last = segments[segments.length - 1]?.path as LegalDoc;
      if (last && this.tabs.some(t => t.id === last)) {
        this.doc.set(last);
      }
    });
  }

  navigateTo(id: LegalDoc): void {
    this.doc.set(id);
    this.router.navigate(['/legal', id]);
  }
}
