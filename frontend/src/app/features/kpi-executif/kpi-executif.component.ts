import {
  Component, OnInit, OnDestroy,
  ChangeDetectionStrategy, ChangeDetectorRef,
  ViewChild, ElementRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { KpiExecutifService } from '../../core/services/kpi-executif.service';
import { KpiExecutifResponse, KpiCard, BudgetSynthese } from '../../core/models/kpi-executif.model';

Chart.register(...registerables);

@Component({
  selector: 'app-kpi-executif',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Tableau de bord KPI exécutif</h1>
      <p class="text-sm text-gray-500 mt-0.5">Synthèse financière comparée N vs N−1</p>
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

  @if (data) {
    <!-- KPI Cards Row -->
    <div class="grid grid-cols-5 gap-4">
      <div *ngFor="let card of kpiCards()" class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition">
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
    </div>

    <!-- Budget card -->
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
            <!-- Progress bar -->
            <div>
              <div class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Consommation</span>
                <span class="font-bold"
                      [ngClass]="data.budget.tauxConsommation > 90 ? 'text-red-600' :
                                  data.budget.tauxConsommation > 70 ? 'text-orange-500' : 'text-green-600'">
                  {{ data.budget.tauxConsommation | number:'1.0-0' }}%
                </span>
              </div>
              <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-500"
                     [ngClass]="data.budget.tauxConsommation > 100 ? 'bg-red-500' :
                                  data.budget.tauxConsommation > 90  ? 'bg-orange-400' :
                                  data.budget.tauxConsommation > 70  ? 'bg-yellow-400' : 'bg-green-500'"
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

      <!-- Résultat card -->
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

    <!-- Monthly trend chart -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">
        Évolution mensuelle — CA, Charges &amp; Résultat {{ exercice }}
      </h2>
      <canvas #chartCanvas style="height:240px"></canvas>
    </div>

    <!-- Monthly table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th class="px-4 py-2 text-left">Mois</th>
            <th class="px-4 py-2 text-right">CA</th>
            <th class="px-4 py-2 text-right">Charges</th>
            <th class="px-4 py-2 text-right">Résultat</th>
            <th class="px-4 py-2 text-center">Marge</th>
          </tr>
        </thead>
        <tbody>
          @for (m of data.tendanceMensuelle; track m.mois) {
            <tr class="border-t border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-2 font-medium text-gray-700 capitalize">{{ m.label }}</td>
              <td class="px-4 py-2 text-right text-green-600">{{ fmt(m.ca) }}</td>
              <td class="px-4 py-2 text-right text-red-500">{{ fmt(m.charges) }}</td>
              <td class="px-4 py-2 text-right font-semibold"
                  [ngClass]="m.resultat >= 0 ? 'text-green-700' : 'text-red-600'">
                {{ fmt(m.resultat) }}
              </td>
              <td class="px-4 py-2 text-center text-xs"
                  [ngClass]="marge(m) >= 0 ? 'text-green-600' : 'text-red-500'">
                {{ m.ca !== 0 ? (marge(m) | number:'1.1-1') + '%' : '—' }}
              </td>
            </tr>
          }
        </tbody>
        <tfoot class="bg-gray-100 font-bold text-sm">
          <tr>
            <td class="px-4 py-2 text-gray-700">TOTAL</td>
            <td class="px-4 py-2 text-right text-green-700">{{ fmt(data.ca.valeur) }}</td>
            <td class="px-4 py-2 text-right text-red-600">{{ fmt(data.charges.valeur) }}</td>
            <td class="px-4 py-2 text-right"
                [ngClass]="data.resultatNet.valeur >= 0 ? 'text-green-700' : 'text-red-700'">
              {{ fmt(data.resultatNet.valeur) }}
            </td>
            <td class="px-4 py-2 text-center text-xs"
                [ngClass]="data.ca.valeur !== 0 && (data.resultatNet.valeur / data.ca.valeur * 100) >= 0 ? 'text-green-600' : 'text-red-500'">
              {{ data.ca.valeur !== 0 ? (data.resultatNet.valeur / data.ca.valeur * 100 | number:'1.1-1') + '%' : '—' }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  }

</div>
  `
})
export class KpiExecutifComponent implements OnInit, OnDestroy {

  private svc = inject(KpiExecutifService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  data: KpiExecutifResponse | null = null;
  exercice = new Date().getFullYear();
  exercices = Array.from({ length: 5 }, (_, i) => this.exercice - i);

  ngOnInit() { this.charger(); }
  ngOnDestroy() { this.chart?.destroy(); }

  charger() {
    this.svc.get(this.exercice).subscribe(d => {
      this.data = d;
      this.cdr.detectChanges();
      Promise.resolve().then(() => this.renderChart());
    });
  }

  kpiCards(): KpiCard[] {
    if (!this.data) return [];
    return [this.data.ca, this.data.charges, this.data.resultatNet,
            this.data.tresorerie, this.data.encoursClients];
  }

  private renderChart() {
    if (!this.chartCanvas || !this.data) return;
    this.chart?.destroy();

    const labels   = this.data.tendanceMensuelle.map(m => m.label);
    const ca       = this.data.tendanceMensuelle.map(m => m.ca);
    const charges  = this.data.tendanceMensuelle.map(m => m.charges);
    const resultat = this.data.tendanceMensuelle.map(m => m.resultat);

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line', label: 'Résultat',
            data: resultat, borderColor: '#7c3aed',
            backgroundColor: 'rgba(124,58,237,0.08)',
            tension: 0.3, fill: true, yAxisID: 'y', order: 0,
            pointBackgroundColor: resultat.map(v => v >= 0 ? '#7c3aed' : '#ef4444')
          },
          {
            type: 'bar', label: 'CA',
            data: ca, backgroundColor: 'rgba(22,163,74,0.65)',
            yAxisID: 'y', order: 1
          },
          {
            type: 'bar', label: 'Charges',
            data: charges.map(v => -v), backgroundColor: 'rgba(220,38,38,0.5)',
            yAxisID: 'y', order: 1
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top' } },
        scales: { y: { ticks: { callback: (v) => this.fmtNum(Number(v)) } } }
      }
    });
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

  private fmtNum(n: number): string {
    return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(n);
  }
}
