import {
  ChangeDetectionStrategy, Component, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { inject } from '@angular/core';
import { GouvernanceService } from '../../core/services/gouvernance.service';
import { PortailAssocieResponse, AssembleeResponse, StatutResolution, StatutAssemblee, TypeAssemblee } from '../../core/models/gouvernance.model';

type Tab = 'dashboard' | 'assemblees';

@Component({
  selector: 'app-portail-associe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe],
  template: `
<div class="min-h-screen bg-gray-50">

  <!-- Header portail -->
  <header class="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
    <div class="max-w-5xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-3">
        <span class="font-bold text-blue-700 text-lg">e-Compta</span>
        <span class="text-gray-300">|</span>
        <span class="text-sm text-gray-500">Espace associé</span>
      </div>
      @if (data()) {
        <div class="text-right">
          <p class="text-sm font-semibold text-gray-900">{{ data()!.nomAssocie }}</p>
          <p class="text-xs text-gray-500">{{ data()!.typeAssocie }} — {{ data()!.pourcentage | number:'1.2-2' }}% du capital</p>
        </div>
      }
    </div>
  </header>

  <div class="max-w-5xl mx-auto px-6 py-8">

    @if (erreur()) {
      <div class="text-center py-24">
        <div class="text-6xl mb-4">🔒</div>
        <h2 class="text-xl font-semibold text-gray-700 mb-2">Accès invalide ou révoqué</h2>
        <p class="text-sm text-gray-400">Ce lien n'est plus actif. Contactez l'administrateur de la société.</p>
      </div>
    } @else if (!data()) {
      <div class="text-center py-24 text-gray-400 text-sm">Chargement...</div>
    } @else {

      <!-- Titre société -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ data()!.nomEntreprise }}</h1>
        <p class="text-sm text-gray-500 mt-1">Portail réservé aux associés — accès en consultation</p>
      </div>

      <!-- Onglets -->
      <div class="flex gap-1 border-b border-gray-200 mb-6">
        <button (click)="tab.set('dashboard')"
                class="px-4 py-2 text-sm font-medium border-b-2 transition"
                [class.border-blue-600]="tab() === 'dashboard'"
                [class.text-blue-700]="tab() === 'dashboard'"
                [class.border-transparent]="tab() !== 'dashboard'"
                [class.text-gray-500]="tab() !== 'dashboard'">
          Tableau de bord financier
        </button>
        <button (click)="tab.set('assemblees')"
                class="px-4 py-2 text-sm font-medium border-b-2 transition"
                [class.border-blue-600]="tab() === 'assemblees'"
                [class.text-blue-700]="tab() === 'assemblees'"
                [class.border-transparent]="tab() !== 'assemblees'"
                [class.text-gray-500]="tab() !== 'assemblees'">
          Assemblées & Décisions ({{ data()!.assemblees.length }})
        </button>
      </div>

      <!-- ═══ DASHBOARD FINANCIER ═══ -->
      @if (tab() === 'dashboard') {
        <div class="space-y-6">

          <!-- KPIs exercice courant -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-white rounded-xl p-5 shadow-sm border">
              <p class="text-xs text-gray-500 mb-1">Total Actif</p>
              <p class="text-2xl font-bold text-gray-900">{{ data()!.dashboard.totalActif | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400 mt-1">Exercice {{ data()!.dashboard.exercice }}</p>
            </div>
            <div class="bg-white rounded-xl p-5 shadow-sm border">
              <p class="text-xs text-gray-500 mb-1">Fonds Propres</p>
              <p class="text-2xl font-bold text-blue-700">{{ data()!.dashboard.fondsPropres | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400 mt-1">Capitaux propres</p>
            </div>
            <div class="bg-white rounded-xl p-5 shadow-sm border">
              <p class="text-xs text-gray-500 mb-1">Résultat Net</p>
              <p class="text-2xl font-bold"
                 [class.text-green-700]="data()!.dashboard.resultatNet >= 0"
                 [class.text-red-600]="data()!.dashboard.resultatNet < 0">
                {{ data()!.dashboard.resultatNet | number:'1.0-0' }}
              </p>
              <p class="text-xs text-gray-400 mt-1">Bénéfice / Perte</p>
            </div>
            <div class="bg-white rounded-xl p-5 shadow-sm border">
              <p class="text-xs text-gray-500 mb-1">Chiffre d'Affaires</p>
              <p class="text-2xl font-bold text-gray-900">{{ data()!.dashboard.chiffreAffaires | number:'1.0-0' }}</p>
              <p class="text-xs text-gray-400 mt-1">Produits d'exploitation</p>
            </div>
          </div>

          <!-- Évolution 3 ans -->
          @if (data()!.dashboard.evolution.length > 0) {
            <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div class="px-5 py-3 border-b bg-gray-50">
                <h2 class="text-sm font-semibold text-gray-700">Évolution sur 3 exercices</h2>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-50 text-xs text-gray-500 uppercase">
                      <th class="px-5 py-2 text-left">Exercice</th>
                      <th class="px-5 py-2 text-right">Total Actif</th>
                      <th class="px-5 py-2 text-right">Fonds Propres</th>
                      <th class="px-5 py-2 text-right">Chiffre d'Affaires</th>
                      <th class="px-5 py-2 text-right">Résultat Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (ev of data()!.dashboard.evolution; track ev.exercice) {
                      <tr class="border-t hover:bg-gray-50"
                          [class.font-semibold]="ev.exercice === data()!.dashboard.exercice">
                        <td class="px-5 py-3">
                          {{ ev.exercice }}
                          @if (ev.exercice === data()!.dashboard.exercice) {
                            <span class="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Courant</span>
                          }
                        </td>
                        <td class="px-5 py-3 text-right">{{ ev.totalActif | number:'1.0-0' }}</td>
                        <td class="px-5 py-3 text-right text-blue-700">{{ ev.fondsPropres | number:'1.0-0' }}</td>
                        <td class="px-5 py-3 text-right">{{ ev.chiffreAffaires | number:'1.0-0' }}</td>
                        <td class="px-5 py-3 text-right"
                            [class.text-green-700]="ev.resultatNet >= 0"
                            [class.text-red-600]="ev.resultatNet < 0">
                          {{ ev.resultatNet | number:'1.0-0' }}
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Note légale -->
          <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p class="text-xs text-blue-700">
              <strong>Information :</strong> Ces données sont issues de la comptabilité officielle de la société.
              Les états financiers complets (bilan détaillé, compte de résultat, annexes) sont disponibles
              lors des Assemblées Générales ordinaires annuelles.
            </p>
          </div>

        </div>
      }

      <!-- ═══ ASSEMBLÉES & DÉCISIONS ═══ -->
      @if (tab() === 'assemblees') {
        <div class="space-y-4">
          @if (data()!.assemblees.length === 0) {
            <div class="text-center text-gray-400 py-16 text-sm">
              Aucune assemblée enregistrée à ce jour.
            </div>
          } @else {
            @for (ag of data()!.assemblees; track ag.id) {
              <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
                <!-- En-tête AG -->
                <div class="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <span class="px-2 py-0.5 rounded text-xs font-medium" [class]="typeAGBadge(ag.typeAssemblee)">
                      {{ ag.typeAssembleeLabel }}
                    </span>
                    <div>
                      <p class="font-semibold text-gray-900">{{ ag.titre }}</p>
                      <p class="text-xs text-gray-500">
                        {{ ag.dateAssemblee }}
                        @if (ag.lieu) { — {{ ag.lieu }} }
                        @if (ag.exerciceConcerne) { — Exercice {{ ag.exerciceConcerne }} }
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center gap-3">
                    @if (ag.quorumAtteint) {
                      <span class="text-xs text-gray-500">Quorum : {{ ag.quorumAtteint | number:'1.1-1' }}%</span>
                    }
                    <span class="px-2 py-1 rounded-full text-xs font-medium" [class]="statutAGBadge(ag.statut)">
                      {{ ag.statutLabel }}
                    </span>
                  </div>
                </div>

                <!-- Résolutions -->
                @if (ag.resolutions.length > 0) {
                  <div class="px-5 py-4 space-y-2">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      {{ ag.resolutions.length }} résolution(s)
                    </p>
                    @for (r of ag.resolutions; track r.id) {
                      <div class="flex items-start gap-3 p-3 rounded-lg border"
                           [class.bg-green-50]="r.statut === 'ADOPTEE'"
                           [class.border-green-200]="r.statut === 'ADOPTEE'"
                           [class.bg-red-50]="r.statut === 'REJETEE'"
                           [class.border-red-200]="r.statut === 'REJETEE'"
                           [class.bg-gray-50]="r.statut === 'EN_ATTENTE'"
                           [class.border-gray-200]="r.statut === 'EN_ATTENTE'">
                        <span class="text-sm font-bold text-gray-400 mt-0.5 w-5 shrink-0">{{ r.numeroOrdre }}.</span>
                        <div class="flex-1">
                          <p class="text-sm font-medium text-gray-900">{{ r.titre }}</p>
                          @if (r.texte) {
                            <p class="text-xs text-gray-600 mt-1">{{ r.texte }}</p>
                          }
                          <p class="text-xs text-gray-400 mt-1">{{ r.typeResolutionLabel }}</p>
                          @if (r.statut !== 'EN_ATTENTE') {
                            <div class="flex gap-4 mt-2 text-xs">
                              <span class="text-green-600 font-medium">Pour : {{ r.votesPour }}</span>
                              <span class="text-red-500">Contre : {{ r.votesContre }}</span>
                              <span class="text-gray-400">Abst. : {{ r.votesAbstention }}</span>
                            </div>
                          }
                        </div>
                        <span class="px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
                              [class]="statutResolutionBadge(r.statut)">
                          {{ r.statutLabel }}
                        </span>
                      </div>
                    }
                  </div>
                } @else {
                  <p class="px-5 py-3 text-xs text-gray-400">Aucune résolution enregistrée pour cette assemblée.</p>
                }

                <!-- PV si disponible -->
                @if (ag.procesVerbal) {
                  <div class="px-5 py-3 border-t bg-amber-50">
                    <p class="text-xs font-semibold text-amber-700 mb-1">Extrait du procès-verbal</p>
                    <p class="text-xs text-gray-700 whitespace-pre-line">{{ ag.procesVerbal }}</p>
                  </div>
                }
              </div>
            }
          }
        </div>
      }

    }
  </div>

  <!-- Footer -->
  <footer class="border-t bg-white mt-12 py-6 text-center text-xs text-gray-400">
    Portail sécurisé — e-Compta · Accès réservé aux associés de {{ data()?.nomEntreprise }}
  </footer>

</div>
`,
})
export class PortailAssocieComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = new GouvernanceService();

  data = signal<PortailAssocieResponse | null>(null);
  erreur = signal(false);
  tab = signal<Tab>('dashboard');

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) { this.erreur.set(true); return; }
    this.svc.getPortail(token).subscribe({
      next: d => this.data.set(d),
      error: () => this.erreur.set(true),
    });
  }

  typeAGBadge(type: TypeAssemblee): string {
    const map: Record<TypeAssemblee, string> = {
      AG_ORDINAIRE:           'bg-blue-100 text-blue-800',
      AG_EXTRAORDINAIRE:      'bg-purple-100 text-purple-800',
      CONSEIL_ADMINISTRATION: 'bg-indigo-100 text-indigo-800',
      AUTRE:                  'bg-gray-100 text-gray-700',
    };
    return map[type] ?? 'bg-gray-100 text-gray-700';
  }

  statutAGBadge(statut: StatutAssemblee): string {
    const map: Record<StatutAssemblee, string> = {
      PLANIFIEE: 'bg-yellow-100 text-yellow-800',
      TENUE:     'bg-blue-100 text-blue-800',
      CLOTUREE:  'bg-green-100 text-green-800',
      ANNULEE:   'bg-red-100 text-red-800',
    };
    return map[statut] ?? 'bg-gray-100 text-gray-700';
  }

  statutResolutionBadge(statut: StatutResolution): string {
    const map: Record<StatutResolution, string> = {
      EN_ATTENTE: 'bg-yellow-100 text-yellow-700',
      ADOPTEE:    'bg-green-100 text-green-800',
      REJETEE:    'bg-red-100 text-red-700',
    };
    return map[statut] ?? 'bg-gray-100 text-gray-700';
  }
}
