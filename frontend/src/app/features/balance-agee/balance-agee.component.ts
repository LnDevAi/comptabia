import {
  ChangeDetectionStrategy, Component, OnInit, OnDestroy,
  ViewChild, ElementRef, inject, signal, computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { BalanceAgeeService } from '../../core/services/balance-agee.service';
import { BalanceAgeeResponse, LigneTiers } from '../../core/models/balance-agee.model';

Chart.register(...registerables);

@Component({
  selector: 'app-balance-agee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Balance âgée</h1>
      @if (data()) {
        <p class="text-xs text-gray-400 mt-0.5">Arrêtée au {{ data()!.dateArrete | date:'dd/MM/yyyy' }}</p>
      }
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <button (click)="charger('CLIENT')"
              [class]="type() === 'CLIENT'
                ? 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium'">
        Clients (41x)
      </button>
      <button (click)="charger('FOURNISSEUR')"
              [class]="type() === 'FOURNISSEUR'
                ? 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium'">
        Fournisseurs (40x)
      </button>
      @if (data()) {
        <a [href]="svc.exportCsvUrl(type())" download
           class="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
          ↓ CSV
        </a>
      }
    </div>
  </div>

  <!-- Filtres -->
  @if (data()) {
    <div class="flex flex-wrap items-center gap-3">
      <input type="text" [(ngModel)]="searchQuery"
             placeholder="Rechercher un tiers…"
             class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:ring-2 focus:ring-blue-500">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-500">Montant min :</label>
        <input type="number" [(ngModel)]="montantMin" min="0" step="1000"
               class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-500">Risque :</label>
        <select [(ngModel)]="niveauFilter"
                class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous</option>
          <option value="FAIBLE">Faible</option>
          <option value="MOYEN">Moyen</option>
          <option value="ELEVE">Élevé</option>
          <option value="CRITIQUE">Critique</option>
        </select>
      </div>
      @if (lignesFiltrees().length !== data()!.lignes.length) {
        <span class="text-xs text-gray-400">{{ lignesFiltrees().length }} / {{ data()!.lignes.length }} tiers</span>
      }
    </div>
  }

  <!-- Loading -->
  @if (loading()) {
    <div class="flex items-center justify-center py-20 text-gray-400 text-sm">
      <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
      Calcul en cours…
    </div>
  }

  @if (error()) {
    <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">{{ error() }}</div>
  }

  @if (!loading() && data()) {

    <!-- KPI summary cards -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="bg-blue-50 rounded-xl p-3 text-center">
        <div class="text-xs text-blue-500 mb-1">0-30 jours</div>
        <div class="font-bold text-blue-700 font-mono text-sm">{{ fmt(data()!.totaux.j0) }}</div>
      </div>
      <div class="bg-yellow-50 rounded-xl p-3 text-center">
        <div class="text-xs text-yellow-600 mb-1">31-60 jours</div>
        <div class="font-bold text-yellow-700 font-mono text-sm">{{ fmt(data()!.totaux.j30) }}</div>
      </div>
      <div class="bg-orange-50 rounded-xl p-3 text-center">
        <div class="text-xs text-orange-600 mb-1">61-90 jours</div>
        <div class="font-bold text-orange-700 font-mono text-sm">{{ fmt(data()!.totaux.j60) }}</div>
      </div>
      <div class="bg-red-50 rounded-xl p-3 text-center">
        <div class="text-xs text-red-500 mb-1">&gt; 90 jours</div>
        <div class="font-bold text-red-700 font-mono text-sm">{{ fmt(data()!.totaux.j90) }}</div>
      </div>
      <div class="bg-gray-800 rounded-xl p-3 text-center">
        <div class="text-xs text-gray-300 mb-1">Total</div>
        <div class="font-bold text-white font-mono text-sm">{{ fmt(data()!.totaux.total) }}</div>
      </div>
    </div>

    @if (data()!.lignes.length === 0) {
      <div class="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 text-sm">
        Aucune créance / dette non lettrée pour les comptes {{ data()!.type === 'CLIENT' ? '41x' : '40x' }}.
      </div>
    } @else {

      <!-- Chart: top 10 barres empilées -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">
          Top {{ chartLignes().length }} tiers — répartition par ancienneté
        </h2>
        <canvas #chartCanvas style="height:240px"></canvas>
      </div>

      <!-- Risk distribution -->
      <div class="grid grid-cols-4 gap-3">
        @for (n of niveaux; track n.key) {
          <div class="rounded-xl border p-3 text-center" [ngClass]="n.bg">
            <div class="text-xs font-medium mb-1" [ngClass]="n.text">{{ n.label }}</div>
            <div class="text-2xl font-bold" [ngClass]="n.text">{{ countByNiveau(n.key) }}</div>
            <div class="text-xs mt-0.5" [ngClass]="n.text">tiers</div>
          </div>
        }
      </div>

      <!-- Detail table -->
      <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left">Tiers</th>
                <th class="px-4 py-3 text-left">Code</th>
                <th class="px-4 py-3 text-left">Compte</th>
                <th class="px-4 py-3 text-right w-28">0-30j</th>
                <th class="px-4 py-3 text-right w-28">31-60j</th>
                <th class="px-4 py-3 text-right w-28">61-90j</th>
                <th class="px-4 py-3 text-right w-28">&gt;90j</th>
                <th class="px-4 py-3 text-right w-32 font-bold">Total</th>
                <th class="px-4 py-3 text-center w-28">Risque</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (ligne of lignesFiltrees(); track ligne.compteNumero) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ ligne.nom }}</td>
                  <td class="px-4 py-3 text-gray-500 text-xs">{{ ligne.code }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ ligne.compteNumero }}</td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="ligne.buckets.j0 > 0 ? 'text-blue-700' : 'text-gray-300'">
                    {{ ligne.buckets.j0 > 0 ? fmt(ligne.buckets.j0) : '–' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="ligne.buckets.j30 > 0 ? 'text-yellow-700' : 'text-gray-300'">
                    {{ ligne.buckets.j30 > 0 ? fmt(ligne.buckets.j30) : '–' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="ligne.buckets.j60 > 0 ? 'text-orange-700' : 'text-gray-300'">
                    {{ ligne.buckets.j60 > 0 ? fmt(ligne.buckets.j60) : '–' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="ligne.buckets.j90 > 0 ? 'text-red-700 font-semibold' : 'text-gray-300'">
                    {{ ligne.buckets.j90 > 0 ? fmt(ligne.buckets.j90) : '–' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono font-bold text-gray-800">
                    {{ fmt(ligne.buckets.total) }}
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                          [ngClass]="niveauClass(ligne.risqueNiveau)">
                      {{ niveauLabel(ligne.risqueNiveau) }}
                      <span class="opacity-70">({{ ligne.scoreRisque }})</span>
                    </span>
                  </td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-gray-800 text-white text-xs font-bold">
              <tr>
                <td class="px-4 py-3" colspan="3">TOTAL ({{ lignesFiltrees().length }} tiers)</td>
                <td class="px-4 py-3 text-right font-mono">{{ fmt(totauxFiltres().j0) }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ fmt(totauxFiltres().j30) }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ fmt(totauxFiltres().j60) }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ fmt(totauxFiltres().j90) }}</td>
                <td class="px-4 py-3 text-right font-mono">{{ fmt(totauxFiltres().total) }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    }
  }
</div>
  `
})
export class BalanceAgeeComponent implements OnInit, OnDestroy {

  readonly svc = inject(BalanceAgeeService);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  type    = signal<'CLIENT' | 'FOURNISSEUR'>('CLIENT');
  loading = signal(false);
  error   = signal<string | null>(null);
  data    = signal<BalanceAgeeResponse | null>(null);

  searchQuery  = '';
  montantMin   = 0;
  niveauFilter = '';

  readonly niveaux = [
    { key: 'FAIBLE',   label: 'Faible',   bg: 'bg-green-50  border-green-200',  text: 'text-green-700'  },
    { key: 'MOYEN',    label: 'Moyen',    bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
    { key: 'ELEVE',    label: 'Élevé',    bg: 'bg-orange-50 border-orange-200', text: 'text-orange-700' },
    { key: 'CRITIQUE', label: 'Critique', bg: 'bg-red-50    border-red-200',    text: 'text-red-700'    },
  ];

  lignesFiltrees = computed(() => {
    const d = this.data();
    if (!d) return [];
    const q = this.searchQuery.toLowerCase();
    return d.lignes.filter(l => {
      if (q && !l.nom.toLowerCase().includes(q) && !l.code.toLowerCase().includes(q)) return false;
      if (this.montantMin > 0 && l.buckets.total < this.montantMin) return false;
      if (this.niveauFilter && l.risqueNiveau !== this.niveauFilter) return false;
      return true;
    });
  });

  totauxFiltres = computed(() =>
    this.lignesFiltrees().reduce(
      (acc, l) => ({
        j0:    acc.j0    + l.buckets.j0,
        j30:   acc.j30   + l.buckets.j30,
        j60:   acc.j60   + l.buckets.j60,
        j90:   acc.j90   + l.buckets.j90,
        total: acc.total + l.buckets.total,
      }),
      { j0: 0, j30: 0, j60: 0, j90: 0, total: 0 }
    )
  );

  chartLignes = computed(() => {
    const d = this.data();
    if (!d) return [];
    return [...d.lignes]
      .sort((a, b) => b.buckets.total - a.buckets.total)
      .slice(0, 10);
  });

  ngOnInit() { this.charger('CLIENT'); }

  ngOnDestroy() { this.chart?.destroy(); }

  charger(t: 'CLIENT' | 'FOURNISSEUR') {
    this.type.set(t);
    this.loading.set(true);
    this.error.set(null);
    this.data.set(null);
    this.chart?.destroy();

    this.svc.calculer(t).subscribe({
      next: res => {
        this.data.set(res);
        this.loading.set(false);
        setTimeout(() => this.buildChart(), 0);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message ?? 'Erreur lors du calcul.');
        this.loading.set(false);
      }
    });
  }

  private buildChart() {
    if (!this.chartCanvas || this.chartLignes().length === 0) return;
    this.chart?.destroy();
    const lignes = this.chartLignes();
    const labels = lignes.map(l => l.nom.length > 18 ? l.nom.slice(0, 16) + '…' : l.nom);
    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: '0-30j',  data: lignes.map(l => l.buckets.j0),  backgroundColor: 'rgba(59,130,246,0.7)'  },
          { label: '31-60j', data: lignes.map(l => l.buckets.j30), backgroundColor: 'rgba(234,179,8,0.7)'   },
          { label: '61-90j', data: lignes.map(l => l.buckets.j60), backgroundColor: 'rgba(249,115,22,0.7)'  },
          { label: '>90j',   data: lignes.map(l => l.buckets.j90), backgroundColor: 'rgba(239,68,68,0.75)'  },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: { label: ctx => `${ctx.dataset.label}: ${this.fmt(ctx.parsed.y ?? 0)}` }
          }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, ticks: { callback: (v: string | number) => this.fmtK(Number(v)) } }
        }
      }
    });
  }

  countByNiveau(niveau: string): number {
    return this.data()?.lignes.filter(l => l.risqueNiveau === niveau).length ?? 0;
  }

  niveauClass(n: string): string {
    const map: Record<string, string> = {
      FAIBLE:   'bg-green-100 text-green-700',
      MOYEN:    'bg-yellow-100 text-yellow-700',
      ELEVE:    'bg-orange-100 text-orange-700',
      CRITIQUE: 'bg-red-100 text-red-700',
    };
    return map[n] ?? 'bg-gray-100 text-gray-600';
  }

  niveauLabel(n: string): string {
    const map: Record<string, string> = {
      FAIBLE: 'Faible', MOYEN: 'Moyen', ELEVE: 'Élevé', CRITIQUE: 'Critique'
    };
    return map[n] ?? n;
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  private fmtK(n: number): string {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(0) + 'k';
    return String(n);
  }
}
