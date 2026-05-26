import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ViewChild, ElementRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { KpiExecutifService } from '../../core/services/kpi-executif.service';
import {
  KpiExecutifResponse, KpiCard, Alerte
} from '../../core/models/kpi-executif.model';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-executif',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Tableau de bord KPI exécutif</h1>
      <p class="text-sm text-gray-500 mt-0.5">Synthèse financière — ratios · alertes · comparaison N−1</p>
    </div>
    <div class="flex items-center gap-3">
      <select [(ngModel)]="exercice" (change)="charger()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        @for (y of exercices; track y) {
          <option [value]="y">{{ y }}</option>
        }
      </select>
      <button (click)="print()"
              class="px-3 py-1.5 border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50">
        🖨 Imprimer
      </button>
    </div>
  </div>

  @if (!data) {
    <div class="flex items-center justify-center py-20 text-gray-400 text-sm">
      <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
      Chargement…
    </div>
  }

  @if (data) {

    <!-- Alertes banner -->
    @if (data.alertes.length > 0) {
      <div class="space-y-2">
        @for (a of data.alertes; track a.message) {
          <div class="flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium"
               [ngClass]="alerteClass(a)">
            <span class="flex-shrink-0 text-base">{{ alerteIcon(a) }}</span>
            <span>{{ a.message }}</span>
          </div>
        }
      </div>
    }

    <!-- KPI Cards Row -->
    <div class="grid grid-cols-5 gap-4">
      @for (card of kpiCards(); track card.label) {
        <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition">
          <p class="text-xs text-gray-500 uppercase tracking-wide truncate">{{ card.label }}</p>
          <p class="text-xl font-bold mt-1 text-gray-900">{{ fmt(card.valeur) }}</p>
          @if (card.precedent !== null) {
            <div class="flex items-center gap-1 mt-1.5">
              <span class="text-sm font-semibold" [ngClass]="tendanceClass(card)">
                {{ trendArrow(card) }} {{ card.evolutionPct | number:'1.1-1' }}%
              </span>
              <span class="text-xs text-gray-400">vs N−1</span>
            </div>
            <p class="text-xs text-gray-400 mt-0.5">N−1 : {{ fmt(card.precedent) }}</p>
          }
        </div>
      }
    </div>

    <!-- Ratios row -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Marge nette</p>
        <p class="text-2xl font-bold mt-1"
           [ngClass]="data.ratios.margeNettePct >= 10 ? 'text-green-600'
                    : data.ratios.margeNettePct >= 0  ? 'text-yellow-600' : 'text-red-600'">
          {{ data.ratios.margeNettePct | number:'1.1-1' }}%
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Résultat / CA</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Taux de charges</p>
        <p class="text-2xl font-bold mt-1"
           [ngClass]="data.ratios.tauxChargesPct <= 70 ? 'text-green-600'
                    : data.ratios.tauxChargesPct <= 90 ? 'text-yellow-600' : 'text-red-600'">
          {{ data.ratios.tauxChargesPct | number:'1.1-1' }}%
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Charges / CA</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">DSO</p>
        <p class="text-2xl font-bold mt-1"
           [ngClass]="data.ratios.dso <= 30 ? 'text-green-600'
                    : data.ratios.dso <= 60 ? 'text-yellow-600' : 'text-red-600'">
          {{ data.ratios.dso | number:'1.0-0' }} j
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Délai moyen recouvrement</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Variation CA vs N−1</p>
        <p class="text-2xl font-bold mt-1"
           [ngClass]="data.ratios.tauxVariationCa >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ data.ratios.tauxVariationCa >= 0 ? '+' : '' }}{{ data.ratios.tauxVariationCa | number:'1.1-1' }}%
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Croissance du chiffre d'affaires</p>
      </div>
    </div>

    <!-- Budget + Résultat net -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Budget {{ exercice }}</h2>
        @if (data.budget.totalBudget === 0) {
          <p class="text-sm text-gray-400">Aucun budget défini pour cet exercice</p>
        } @else {
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Budget total</span>
              <span class="font-semibold">{{ fmt(data.budget.totalBudget) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Réel cumulé</span>
              <span class="font-semibold">{{ fmt(data.budget.totalReel) }}</span>
            </div>
            <div>
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Consommation</span>
                <span class="font-bold"
                      [ngClass]="data.budget.tauxConsommation > 90 ? 'text-red-600'
                                : data.budget.tauxConsommation > 70 ? 'text-orange-500' : 'text-green-600'">
                  {{ data.budget.tauxConsommation | number:'1.0-0' }}%
                </span>
              </div>
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                     [ngClass]="data.budget.tauxConsommation > 100 ? 'bg-red-500'
                               : data.budget.tauxConsommation > 90  ? 'bg-orange-400'
                               : data.budget.tauxConsommation > 70  ? 'bg-yellow-400' : 'bg-green-500'"
                     [style.width.%]="min(data.budget.tauxConsommation, 100)">
                </div>
              </div>
            </div>
            @if (data.budget.nbDepassements > 0) {
              <p class="text-xs text-red-600 font-medium">
                ⚠ {{ data.budget.nbDepassements }} ligne(s) budgétaire(s) dépassée(s)
              </p>
            }
          </div>
        }
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Résultat net {{ exercice }}</h2>
        <div class="flex items-center justify-center h-24">
          <div class="text-center">
            <p class="text-4xl font-extrabold"
               [ngClass]="data.resultatNet.valeur >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ fmt(data.resultatNet.valeur) }}
            </p>
            @if (data.resultatNet.precedent !== null) {
              <p class="text-sm text-gray-500 mt-1">
                N−1 : {{ fmt(data.resultatNet.precedent) }}
                <span class="ml-2 font-semibold" [ngClass]="tendanceClass(data.resultatNet)">
                  {{ trendArrow(data.resultatNet) }}{{ data.resultatNet.evolutionPct | number:'1.1-1' }}%
                </span>
              </p>
            }
          </div>
        </div>
      </div>
    </div>

    <!-- Graphique N vs N-1 -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">
        CA mensuel — {{ exercice }} vs {{ exercice - 1 }}
      </h2>
      <canvas #chartN1Canvas style="height:220px"></canvas>
    </div>

    <!-- Graphique CA / Charges / Résultat -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">
        Évolution mensuelle — CA, Charges &amp; Résultat {{ exercice }}
      </h2>
      <canvas #chartCanvas style="height:220px"></canvas>
    </div>

    <!-- Top charges + table mensuelle -->
    <div class="grid grid-cols-2 gap-4">

      @if (data.topCharges.length > 0) {
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Top 5 comptes de charges</h2>
          <div class="space-y-3">
            @for (c of data.topCharges; track c.numero) {
              <div>
                <div class="flex items-center justify-between text-sm mb-1">
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="font-mono text-xs text-gray-400 shrink-0">{{ c.numero }}</span>
                    <span class="text-gray-700 truncate">{{ c.libelle }}</span>
                  </div>
                  <div class="text-right shrink-0 ml-2">
                    <span class="font-semibold text-gray-800">{{ fmt(c.montant) }}</span>
                    <span class="text-xs text-gray-400 ml-1">{{ c.partPct | number:'1.1-1' }}%</span>
                  </div>
                </div>
                <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-orange-400 rounded-full"
                       [style.width.%]="c.partPct"></div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-3 py-2 text-left">Mois</th>
              <th class="px-3 py-2 text-right">CA</th>
              <th class="px-3 py-2 text-right">Charges</th>
              <th class="px-3 py-2 text-right">Résultat</th>
              <th class="px-3 py-2 text-center">Marge</th>
            </tr>
          </thead>
          <tbody>
            @for (m of data.tendanceMensuelle; track m.mois) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-3 py-2 font-medium text-gray-700 capitalize">{{ m.label }}</td>
                <td class="px-3 py-2 text-right text-green-600 text-xs">{{ fmt(m.ca) }}</td>
                <td class="px-3 py-2 text-right text-red-500 text-xs">{{ fmt(m.charges) }}</td>
                <td class="px-3 py-2 text-right font-semibold text-xs"
                    [ngClass]="m.resultat >= 0 ? 'text-green-700' : 'text-red-600'">
                  {{ fmt(m.resultat) }}
                </td>
                <td class="px-3 py-2 text-center text-xs"
                    [ngClass]="marge(m) >= 0 ? 'text-green-600' : 'text-red-500'">
                  {{ m.ca !== 0 ? (marge(m) | number:'1.1-1') + '%' : '—' }}
                </td>
              </tr>
            }
          </tbody>
          <tfoot class="bg-gray-100 font-bold text-xs">
            <tr>
              <td class="px-3 py-2 text-gray-700">TOTAL</td>
              <td class="px-3 py-2 text-right text-green-700">{{ fmt(data.ca.valeur) }}</td>
              <td class="px-3 py-2 text-right text-red-600">{{ fmt(data.charges.valeur) }}</td>
              <td class="px-3 py-2 text-right"
                  [ngClass]="data.resultatNet.valeur >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ fmt(data.resultatNet.valeur) }}
              </td>
              <td class="px-3 py-2 text-center"
                  [ngClass]="data.ca.valeur !== 0 && (data.resultatNet.valeur / data.ca.valeur * 100) >= 0
                    ? 'text-green-600' : 'text-red-500'">
                {{ data.ca.valeur !== 0
                  ? (data.resultatNet.valeur / data.ca.valeur * 100 | number:'1.1-1') + '%'
                  : '—' }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  }

</div>
  `
})
export class KpiExecutifComponent implements OnInit, OnDestroy {

  private svc = inject(KpiExecutifService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chartCanvas')   chartCanvas!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('chartN1Canvas') chartN1Canvas!: ElementRef<HTMLCanvasElement>;
  private charts: Chart[] = [];

  data: KpiExecutifResponse | null = null;
  exercice = new Date().getFullYear();
  exercices = Array.from({ length: 5 }, (_, i) => this.exercice - i);

  ngOnInit() { this.charger(); }

  ngOnDestroy() { this.charts.forEach(c => c.destroy()); }

  charger() {
    this.data = null;
    this.charts.forEach(c => c.destroy());
    this.charts = [];
    this.svc.get(this.exercice).subscribe(d => {
      this.data = d;
      this.cdr.detectChanges();
      Promise.resolve().then(() => this.buildCharts());
    });
  }

  kpiCards(): KpiCard[] {
    if (!this.data) return [];
    return [this.data.ca, this.data.charges, this.data.resultatNet,
            this.data.tresorerie, this.data.encoursClients];
  }

  private buildCharts() {
    if (!this.data) return;
    this.charts.forEach(c => c.destroy());
    this.charts = [];

    const labels   = this.data.tendanceMensuelle.map(m => m.label);
    const ca       = this.data.tendanceMensuelle.map(m => m.ca);
    const charges  = this.data.tendanceMensuelle.map(m => m.charges);
    const resultat = this.data.tendanceMensuelle.map(m => m.resultat);
    const caN1     = this.data.tendanceMensuelle.map(m => m.caN1);

    if (this.chartN1Canvas) {
      this.charts.push(new Chart(this.chartN1Canvas.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: `CA ${this.exercice}`,     data: ca,   backgroundColor: 'rgba(22,163,74,0.7)'   },
            { label: `CA ${this.exercice - 1}`, data: caN1, backgroundColor: 'rgba(148,163,184,0.6)' },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { ticks: { callback: (v: string | number) => this.fmtK(Number(v)) } } }
        }
      }));
    }

    if (this.chartCanvas) {
      this.charts.push(new Chart(this.chartCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              type: 'line', label: 'Résultat',
              data: resultat, borderColor: '#7c3aed',
              backgroundColor: 'rgba(124,58,237,0.08)',
              tension: 0.3, fill: true, order: 0,
              pointBackgroundColor: resultat.map(v => v >= 0 ? '#7c3aed' : '#ef4444')
            },
            { type: 'bar', label: 'CA',      data: ca,                   backgroundColor: 'rgba(22,163,74,0.65)', order: 1 },
            { type: 'bar', label: 'Charges', data: charges.map(v => -v), backgroundColor: 'rgba(220,38,38,0.5)',  order: 1 },
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'top' } },
          scales: { y: { ticks: { callback: (v: string | number) => this.fmtK(Number(v)) } } }
        }
      }));
    }
  }

  alerteClass(a: Alerte): string {
    if (a.niveau === 'DANGER')  return 'bg-red-50 border border-red-200 text-red-700';
    if (a.niveau === 'WARNING') return 'bg-amber-50 border border-amber-200 text-amber-700';
    return 'bg-blue-50 border border-blue-200 text-blue-700';
  }

  alerteIcon(a: Alerte): string {
    if (a.niveau === 'DANGER')  return '🔴';
    if (a.niveau === 'WARNING') return '⚠️';
    return 'ℹ️';
  }

  tendanceClass(card: KpiCard): string {
    if (card.tendance === 'UP')   return 'text-green-600';
    if (card.tendance === 'DOWN') return 'text-red-500';
    return 'text-gray-400';
  }

  trendArrow(card: KpiCard): string {
    if (card.tendance === 'UP')   return '▲ ';
    if (card.tendance === 'DOWN') return '▼ ';
    return '— ';
  }

  marge(m: { ca: number; resultat: number }): number {
    return m.ca !== 0 ? (m.resultat / m.ca) * 100 : 0;
  }

  min(a: number, b: number): number { return Math.min(a, b); }

  print() { window.print(); }

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
