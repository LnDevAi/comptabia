import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardData, DashboardStats, MoisEvolution, MoisStat } from '../../core/models/dashboard.model';

const JOURNAL_META: Record<string, { label: string; color: string; bg: string }> = {
  AC: { label: 'Achats',         color: '#f97316', bg: 'bg-orange-100 text-orange-700' },
  BQ: { label: 'Banque',         color: '#3b82f6', bg: 'bg-blue-100 text-blue-700'   },
  OD: { label: 'Op. diverses',   color: '#8b5cf6', bg: 'bg-purple-100 text-purple-700'},
  VT: { label: 'Ventes',         color: '#22c55e', bg: 'bg-green-100 text-green-700' },
};

function conicGradient(segments: { pct: number; color: string }[]): string {
  const active = segments.filter(s => s.pct > 0);
  if (!active.length) return 'conic-gradient(#e5e7eb 0% 100%)';
  let pos = 0;
  const parts = active.map(s => {
    const from = pos; pos += s.pct;
    return `${s.color} ${from.toFixed(2)}% ${pos.toFixed(2)}%`;
  });
  return `conic-gradient(${parts.join(', ')})`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">

      <!-- Page title -->
      <div>
        <h2 class="text-xl font-bold text-gray-900">Tableau de bord</h2>
        <p class="text-sm text-gray-500">{{ auth.user()?.nomEntreprise }}</p>
      </div>

      @if (data()) {
        <!-- Alert: brouillons en attente -->
        @if (data()!.brouillons > 0) {
          <div class="flex items-center gap-3 bg-yellow-50 border border-yellow-200
                      rounded-xl px-5 py-3">
            <span class="text-yellow-500 text-lg">⚠</span>
            <span class="text-sm text-yellow-800 font-medium">
              {{ data()!.brouillons }} écriture{{ data()!.brouillons > 1 ? 's' : '' }}
              en brouillon en attente de validation
            </span>
            <a routerLink="/dashboard/ecritures"
               class="ml-auto text-sm text-yellow-700 hover:underline font-medium">
              Valider →
            </a>
          </div>
        }

        <!-- Alertes analytiques -->
        @if (stats()) {
          @if (stats()!.notesFraisEnAttente > 0) {
            <div class="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-5 py-3">
              <span class="text-orange-500 text-lg">📋</span>
              <span class="text-sm text-orange-800 font-medium">
                {{ stats()!.notesFraisEnAttente }} note{{ stats()!.notesFraisEnAttente > 1 ? 's' : '' }} de frais
                en attente d'approbation — {{ fmtXof(stats()!.notesFraisMontantEnAttente) }}
              </span>
              <a routerLink="/dashboard/notes-frais"
                 class="ml-auto text-sm text-orange-700 hover:underline font-medium">Traiter →</a>
            </div>
          }
          @if (stats()!.facturesImpayees > 0) {
            <div class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
              <span class="text-red-500 text-lg">🧾</span>
              <span class="text-sm text-red-800 font-medium">
                {{ stats()!.facturesImpayees }} facture{{ stats()!.facturesImpayees > 1 ? 's' : '' }}
                impayée{{ stats()!.facturesImpayees > 1 ? 's' : '' }} — {{ fmtXof(stats()!.facturesMontantImpayees) }}
              </span>
              <a routerLink="/dashboard/facturation"
                 class="ml-auto text-sm text-red-700 hover:underline font-medium">Voir →</a>
            </div>
          }
          @if (stats()!.soldeTresorerie < 0) {
            <div class="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-3">
              <span class="text-red-500 text-lg">🏦</span>
              <span class="text-sm text-red-800 font-medium">
                Solde trésorerie négatif : {{ fmtXof(stats()!.soldeTresorerie) }}
              </span>
            </div>
          }

          <!-- KPI analytiques -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-white rounded-xl border border-gray-200 p-5">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide">Trésorerie (521)</p>
                  <p class="text-2xl font-bold mt-1"
                     [class]="stats()!.soldeTresorerie >= 0 ? 'text-gray-900' : 'text-red-600'">
                    {{ fmtXof(stats()!.soldeTresorerie) }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">Solde net validé</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🏦</div>
              </div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-5">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide">Charges YTD (cl. 6)</p>
                  <p class="text-2xl font-bold text-orange-600 mt-1">{{ fmtXof(stats()!.totalChargesYtd) }}</p>
                  <p class="text-xs text-gray-400 mt-1">Depuis le 1er jan.</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-xl">📉</div>
              </div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-5">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide">Produits YTD (cl. 7)</p>
                  <p class="text-2xl font-bold text-green-600 mt-1">{{ fmtXof(stats()!.totalProduitsYtd) }}</p>
                  <p class="text-xs text-gray-400 mt-1">Depuis le 1er jan.</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">📈</div>
              </div>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-5">
              <div class="flex items-start justify-between">
                <div>
                  <p class="text-xs text-gray-500 uppercase tracking-wide">Résultat net YTD</p>
                  <p class="text-2xl font-bold mt-1"
                     [class]="stats()!.resultatNet >= 0 ? 'text-green-700' : 'text-red-600'">
                    {{ fmtXof(stats()!.resultatNet) }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">Produits - Charges</p>
                </div>
                <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                     [class]="stats()!.resultatNet >= 0 ? 'bg-green-50' : 'bg-red-50'">
                  {{ stats()!.resultatNet >= 0 ? '✅' : '⚠' }}
                </div>
              </div>
            </div>
          </div>

          <!-- Graphique charges vs produits (6 mois) -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">Charges vs Produits — 6 derniers mois</h3>
            <div class="flex items-end gap-3 h-32">
              @for (m of stats()!.evolution6Mois; track m.mois) {
                <div class="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div class="w-full flex items-end gap-0.5" style="height:100px">
                    <div class="flex-1 rounded-t transition-all duration-500"
                         [style.height]="evoBarHeight(m.charges, stats()!.evolution6Mois, false) + 'px'"
                         style="min-height:2px; background:#f97316; opacity:0.8"></div>
                    <div class="flex-1 rounded-t transition-all duration-500"
                         [style.height]="evoBarHeight(m.produits, stats()!.evolution6Mois, true) + 'px'"
                         style="min-height:2px; background:#22c55e; opacity:0.8"></div>
                  </div>
                  <span class="text-xs text-gray-400 truncate w-full text-center" style="font-size:10px">
                    {{ shortMois(m.mois) }}
                  </span>
                </div>
              }
            </div>
            <div class="flex items-center gap-4 mt-2 justify-center">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-sm" style="background:#f97316"></div>
                <span class="text-xs text-gray-500">Charges</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded-sm" style="background:#22c55e"></div>
                <span class="text-xs text-gray-500">Produits</span>
              </div>
            </div>
          </div>
        }

        <!-- Stats cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Comptes -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Plan de comptes</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ data()!.comptesActifs }}</p>
                <p class="text-xs text-gray-400 mt-1">
                  sur {{ data()!.totalComptes }} au total
                </p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">
                📊
              </div>
            </div>
          </div>
          <!-- Écritures -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Écritures</p>
                <p class="text-3xl font-bold text-gray-900 mt-1">{{ data()!.totalEcritures }}</p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ data()!.cloturees }} clôturée{{ data()!.cloturees > 1 ? 's' : '' }}
                </p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">
                📝
              </div>
            </div>
          </div>
          <!-- Brouillons -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Brouillons</p>
                <p class="text-3xl font-bold mt-1"
                   [class]="data()!.brouillons > 0 ? 'text-yellow-500' : 'text-gray-900'">
                  {{ data()!.brouillons }}
                </p>
                <p class="text-xs text-gray-400 mt-1">à valider</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-xl">
                🕐
              </div>
            </div>
          </div>
          <!-- Validées -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-xs text-gray-500 uppercase tracking-wide">Validées</p>
                <p class="text-3xl font-bold text-green-600 mt-1">{{ data()!.validees }}</p>
                <p class="text-xs text-gray-400 mt-1">écritures définitives</p>
              </div>
              <div class="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-xl">
                ✅
              </div>
            </div>
          </div>
        </div>

        <!-- Solde des validées -->
        @if (data()!.totalDebitValide > 0 || data()!.totalCreditValide > 0) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white rounded-xl border border-gray-200 p-5">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Total débit validé
              </p>
              <p class="text-2xl font-bold text-gray-900 font-mono">
                {{ data()!.totalDebitValide | number:'1.2-2' }}
              </p>
            </div>
            <div class="bg-white rounded-xl border border-gray-200 p-5">
              <p class="text-xs text-gray-500 uppercase tracking-wide mb-1">
                Total crédit validé
              </p>
              <p class="text-2xl font-bold text-gray-900 font-mono">
                {{ data()!.totalCreditValide | number:'1.2-2' }}
              </p>
            </div>
          </div>
        }

        <!-- Charts row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <!-- Répartition par journal (donut) -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">
              Répartition par journal
            </h3>
            @if (totalJournal() > 0) {
              <div class="flex items-center gap-6">
                <!-- Donut -->
                <div class="relative shrink-0" style="width:120px;height:120px">
                  <div class="w-full h-full rounded-full"
                       [style.background]="donutGradient()"></div>
                  <div class="absolute inset-0 flex items-center justify-center">
                    <div class="w-16 h-16 rounded-full bg-white flex flex-col items-center justify-center">
                      <span class="text-sm font-bold text-gray-900 leading-none">
                        {{ totalJournal() }}
                      </span>
                      <span class="text-xs text-gray-400">total</span>
                    </div>
                  </div>
                </div>
                <!-- Legend -->
                <div class="flex-1 space-y-2">
                  @for (j of data()!.parJournal; track j.journal) {
                    @if (j.count > 0) {
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-2">
                          <div class="w-3 h-3 rounded-full shrink-0"
                               [style.background]="journalColor(j.journal)"></div>
                          <span class="text-xs text-gray-700">
                            {{ journalLabel(j.journal) }}
                          </span>
                        </div>
                        <div class="flex items-center gap-3">
                          <div class="h-1.5 rounded-full bg-gray-100 w-16 overflow-hidden">
                            <div class="h-full rounded-full"
                                 [style.width]="pct(j.count) + '%'"
                                 [style.background]="journalColor(j.journal)"></div>
                          </div>
                          <span class="text-xs font-semibold text-gray-600 w-6 text-right">
                            {{ j.count }}
                          </span>
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
            } @else {
              <div class="flex items-center justify-center h-28 text-gray-400 text-sm">
                Aucune écriture
              </div>
            }
          </div>

          <!-- Évolution mensuelle (bar chart) -->
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-4">
              Évolution mensuelle (6 mois)
            </h3>
            <div class="flex items-end gap-2 h-28">
              @for (m of data()!.derniersMois; track m.mois) {
                <div class="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span class="text-xs font-semibold text-gray-600"
                        [class.text-blue-600]="m.count > 0">
                    {{ m.count || '' }}
                  </span>
                  <div class="w-full rounded-t-lg transition-all duration-500"
                       [style.height]="barHeight(m) + 'px'"
                       [style.background]="m.count > 0 ? '#3b82f6' : '#e5e7eb'"
                       [class.opacity-40]="m.count === 0"
                       style="min-height:4px">
                  </div>
                  <span class="text-xs text-gray-400 truncate w-full text-center"
                        style="font-size:10px">
                    {{ shortMois(m.mois) }}
                  </span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Raccourcis rapides -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a routerLink="/dashboard/ecritures"
             class="flex flex-col items-center gap-2 bg-blue-600 hover:bg-blue-700
                    text-white rounded-xl p-4 transition text-center">
            <span class="text-2xl">📝</span>
            <span class="text-sm font-semibold">Nouvelle écriture</span>
          </a>
          <a routerLink="/dashboard/plan-comptes"
             class="flex flex-col items-center gap-2 bg-white hover:bg-gray-50 border
                    border-gray-200 rounded-xl p-4 transition text-center">
            <span class="text-2xl">📊</span>
            <span class="text-sm font-semibold text-gray-800">Plan de comptes</span>
          </a>
          <a routerLink="/dashboard/ecritures"
             [queryParams]="{statut:'BROUILLON'}"
             class="flex flex-col items-center gap-2 bg-white hover:bg-gray-50 border
                    border-gray-200 rounded-xl p-4 transition text-center relative">
            <span class="text-2xl">🕐</span>
            <span class="text-sm font-semibold text-gray-800">Valider écritures</span>
            @if (data()!.brouillons > 0) {
              <span class="absolute -top-1.5 -right-1.5 bg-yellow-400 text-white text-xs
                           font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {{ data()!.brouillons }}
              </span>
            }
          </a>
          <a routerLink="/dashboard/profile"
             class="flex flex-col items-center gap-2 bg-white hover:bg-gray-50 border
                    border-gray-200 rounded-xl p-4 transition text-center">
            <span class="text-2xl">⚙</span>
            <span class="text-sm font-semibold text-gray-800">Mon profil</span>
          </a>
        </div>

        <!-- Dernières écritures -->
        @if (data()!.dernieresEcritures.length > 0) {
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-gray-700">Dernières écritures</h3>
              <a routerLink="/dashboard/ecritures"
                 class="text-xs text-blue-600 hover:underline">
                Voir toutes →
              </a>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th class="px-5 py-2 text-left">Pièce</th>
                  <th class="px-5 py-2 text-left">Date</th>
                  <th class="px-5 py-2 text-left">Libellé</th>
                  <th class="px-5 py-2 text-center">Journal</th>
                  <th class="px-5 py-2 text-right">Débit</th>
                  <th class="px-5 py-2 text-center">Statut</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (e of data()!.dernieresEcritures; track e.id) {
                  <tr class="hover:bg-gray-50">
                    <td class="px-5 py-3 font-mono text-xs text-gray-700">
                      {{ e.numeroPiece }}
                    </td>
                    <td class="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {{ e.dateEcriture }}
                    </td>
                    <td class="px-5 py-3 text-gray-800 max-w-xs truncate">
                      {{ e.libelle }}
                    </td>
                    <td class="px-5 py-3 text-center">
                      <span class="px-2 py-0.5 rounded text-xs font-medium"
                            [class]="journalBg(e.journal)">
                        {{ e.journal }}
                      </span>
                    </td>
                    <td class="px-5 py-3 text-right font-mono text-xs text-gray-800">
                      {{ e.totalDebit | number:'1.2-2' }}
                    </td>
                    <td class="px-5 py-3 text-center">
                      <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                            [class]="statutClass(e.statut)">
                        {{ e.statut }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      } @else {
        <!-- Skeleton loading -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) {
            <div class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div class="h-3 bg-gray-200 rounded w-24 mb-3"></div>
              <div class="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {

  protected readonly auth = inject(AuthService);
  private readonly svc    = inject(DashboardService);

  data  = signal<DashboardData | null>(null);
  stats = signal<DashboardStats | null>(null);

  ngOnInit() {
    this.svc.get().subscribe(d => this.data.set(d));
    this.svc.getStats().subscribe(s => this.stats.set(s));
  }

  totalJournal(): number {
    return this.data()?.parJournal.reduce((s, j) => s + j.count, 0) ?? 0;
  }

  donutGradient(): string {
    const total = this.totalJournal();
    if (!total) return 'conic-gradient(#e5e7eb 0% 100%)';
    const segments = (this.data()?.parJournal ?? []).map(j => ({
      pct: (j.count / total) * 100,
      color: JOURNAL_META[j.journal]?.color ?? '#9ca3af'
    }));
    return conicGradient(segments);
  }

  pct(count: number): number {
    const t = this.totalJournal();
    return t ? Math.round((count / t) * 100) : 0;
  }

  journalLabel(j: string): string { return JOURNAL_META[j]?.label ?? j; }
  journalColor(j: string): string { return JOURNAL_META[j]?.color ?? '#9ca3af'; }
  journalBg(j: string):    string { return JOURNAL_META[j]?.bg ?? 'bg-gray-100 text-gray-600'; }

  barHeight(m: MoisStat): number {
    const max = Math.max(...(this.data()?.derniersMois.map(x => x.count) ?? [1]), 1);
    return Math.max(4, Math.round((m.count / max) * 80));
  }

  shortMois(mois: string): string {
    return mois.split(' ')[0].slice(0, 3);
  }

  statutClass(statut: string): string {
    if (statut === 'VALIDEE')  return 'bg-green-100 text-green-700';
    if (statut === 'CLOTUREE') return 'bg-gray-200 text-gray-600';
    return 'bg-yellow-100 text-yellow-700';
  }

  fmtXof(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  evoBarHeight(val: number, months: MoisEvolution[], isProduit: boolean): number {
    const allVals = months.flatMap(m => [m.charges, m.produits]);
    const max = Math.max(...allVals, 1);
    return Math.max(2, Math.round((val / max) * 100));
  }
}
