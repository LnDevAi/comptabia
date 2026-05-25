import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
  ElementRef, OnDestroy, OnInit, ViewChild, computed, inject, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { PilotageService } from '../../core/services/pilotage.service';
import { PilotageData, RatioCle } from '../../core/models/pilotage.model';

Chart.register(...registerables);

const CHART_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#84cc16','#14b8a6'];

@Component({
  selector: 'app-pilotage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Tableau de bord de pilotage</h1>
      <p class="text-xs text-gray-400 mt-0.5">Indicateurs financiers — exercice {{ exercice() }}</p>
    </div>
    <select [ngModel]="exercice()" (ngModelChange)="changeExercice($event)"
            class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      @for (y of years(); track y) { <option [value]="y">{{ y }}</option> }
    </select>
  </div>

  @if (loading()) {
    <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
  } @else if (error()) {
    <div class="flex items-center justify-center h-48 text-red-500 text-sm">{{ error() }}</div>
  } @else if (data()) {

    <!-- KPI cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Chiffre d'affaires</p>
        <p class="text-lg font-bold text-blue-700 mt-1 font-mono">{{ fmtM(data()!.ca) }}</p>
        <p class="text-xs text-gray-400 mt-0.5">vs N-1 : {{ deltaPct(caEvol()) }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Résultat net</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'">
          {{ fmtM(data()!.resultatNet) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">
          Marge : {{ data()!.evolution[3]?.margeNette | number:'1.1-1' }}%
        </p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Trésorerie nette</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.tresorerieNette >= 0 ? 'text-blue-700' : 'text-red-700'">
          {{ fmtM(data()!.tresorerieNette) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">FRNG − BFR</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">BFR</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.bfr <= data()!.frng ? 'text-yellow-700' : 'text-red-700'">
          {{ fmtM(data()!.bfr) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">FRNG : {{ fmtM(data()!.frng) }}</p>
      </div>
    </div>

    <!-- Charts row 1 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- CA vs Charges (bar) -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Évolution CA / Charges (4 ans)</h3>
        <canvas #caChart style="max-height:220px"></canvas>
      </div>
      <!-- Structure des charges (doughnut) -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Structure des charges N</h3>
        @if (data()!.charges.length > 0) {
          <canvas #chargesChart style="max-height:220px"></canvas>
        } @else {
          <div class="flex items-center justify-center h-40 text-gray-400 text-sm">
            Aucune charge enregistrée
          </div>
        }
      </div>
    </div>

    <!-- FRNG/BFR/TN evolution (line) -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Équilibre financier — évolution sur 4 ans</h3>
      <canvas #equilibreChart style="max-height:200px"></canvas>
    </div>

    <!-- Ratios clés -->
    @if (data()!.ratiosCles.length > 0) {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold">
          Ratios clés — exercice {{ exercice() }}
        </div>
        <div class="divide-y divide-gray-100">
          @for (r of data()!.ratiosCles; track r.code) {
            <div class="px-4 py-3 flex items-center gap-4">
              <span class="shrink-0 w-2 h-8 rounded-full"
                    [class]="niveauBg(r.niveau)"></span>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-800">{{ r.libelle }}</p>
                <div class="mt-1.5 h-2 bg-gray-100 rounded-full overflow-hidden w-full max-w-xs">
                  <div class="h-full rounded-full transition-all duration-700"
                       [class]="niveauBg(r.niveau)"
                       [style.width]="gaugeWidth(r) + '%'"></div>
                </div>
              </div>
              <div class="text-right shrink-0 w-32">
                <p class="text-base font-bold font-mono" [class]="niveauText(r.niveau)">
                  {{ fmtRatio(r) }}
                </p>
                <p class="text-xs" [class]="niveauTextLight(r.niveau)">{{ niveauLabel(r.niveau) }}</p>
              </div>
              <span class="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                    [class]="niveauBadge(r.niveau)">{{ r.niveau }}</span>
            </div>
          }
        </div>
      </div>
    }

    <!-- Tableau évolution annuelle -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold">
        Synthèse pluriannuelle
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-2 text-left">Exercice</th>
              <th class="px-4 py-2 text-right">CA</th>
              <th class="px-4 py-2 text-right">Charges</th>
              <th class="px-4 py-2 text-right">Résultat net</th>
              <th class="px-4 py-2 text-right">Marge %</th>
              <th class="px-4 py-2 text-right">FRNG</th>
              <th class="px-4 py-2 text-right">BFR</th>
              <th class="px-4 py-2 text-right">TN</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (k of data()!.evolution; track k.exercice) {
              <tr [class]="k.exercice === exercice() ? 'bg-blue-50 font-semibold' : 'hover:bg-gray-50'">
                <td class="px-4 py-2.5 text-gray-700">{{ k.exercice }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-blue-700">{{ fmtM(k.ca) }}</td>
                <td class="px-4 py-2.5 text-right font-mono text-red-600">{{ fmtM(k.charges) }}</td>
                <td class="px-4 py-2.5 text-right font-mono"
                    [class]="k.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'">
                  {{ fmtM(k.resultatNet) }}
                </td>
                <td class="px-4 py-2.5 text-right font-mono"
                    [class]="k.margeNette >= 0 ? 'text-gray-700' : 'text-red-600'">
                  {{ k.margeNette | number:'1.1-1' }}%
                </td>
                <td class="px-4 py-2.5 text-right font-mono"
                    [class]="k.frng >= 0 ? 'text-green-700' : 'text-red-600'">
                  {{ fmtM(k.frng) }}
                </td>
                <td class="px-4 py-2.5 text-right font-mono text-gray-700">{{ fmtM(k.bfr) }}</td>
                <td class="px-4 py-2.5 text-right font-mono"
                    [class]="k.tn >= 0 ? 'text-blue-700' : 'text-red-600'">
                  {{ fmtM(k.tn) }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <p class="text-xs text-gray-400 text-center">
      Indicateurs calculés depuis les écritures validées — SYSCOHADA Système Normal
    </p>
  }
</div>
  `
})
export class PilotageComponent implements OnInit, OnDestroy {

  @ViewChild('caChart')       caChartRef!:       ElementRef<HTMLCanvasElement>;
  @ViewChild('chargesChart')  chargesChartRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('equilibreChart') equilibreChartRef!: ElementRef<HTMLCanvasElement>;

  private cdr = inject(ChangeDetectorRef);
  private svc = inject(PilotageService);

  exercice = signal(new Date().getFullYear());
  loading  = signal(false);
  error    = signal<string | null>(null);
  data     = signal<PilotageData | null>(null);

  years = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3];
  });

  caEvol = computed(() => this.data()?.evolution ?? []);

  private caChart?:       Chart;
  private chargesChart?:  Chart;
  private equilibreChart?: Chart;

  ngOnInit() { this.load(); }

  ngOnDestroy() {
    this.caChart?.destroy();
    this.chargesChart?.destroy();
    this.equilibreChart?.destroy();
  }

  changeExercice(y: number) {
    this.exercice.set(+y);
    this.destroyCharts();
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.svc.get(this.exercice()).subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
        this.cdr.detectChanges();
        Promise.resolve().then(() => this.renderCharts());
      },
      error: (e: any) => {
        this.error.set(e?.error?.message ?? 'Erreur de chargement');
        this.loading.set(false);
      }
    });
  }

  private destroyCharts() {
    this.caChart?.destroy();       this.caChart = undefined;
    this.chargesChart?.destroy();  this.chargesChart = undefined;
    this.equilibreChart?.destroy(); this.equilibreChart = undefined;
  }

  private renderCharts() {
    const d = this.data();
    if (!d) return;
    this.renderCaChart(d);
    if (d.charges.length > 0) this.renderChargesChart(d);
    this.renderEquilibreChart(d);
  }

  private renderCaChart(d: PilotageData) {
    const canvas = this.caChartRef?.nativeElement;
    if (!canvas) return;
    this.caChart?.destroy();
    this.caChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: d.evolution.map(e => String(e.exercice)),
        datasets: [
          {
            label: "Chiffre d'affaires",
            data: d.evolution.map(e => e.ca),
            backgroundColor: 'rgba(59,130,246,0.75)',
            borderColor: '#3b82f6', borderWidth: 1,
          },
          {
            label: 'Charges totales',
            data: d.evolution.map(e => e.charges),
            backgroundColor: 'rgba(239,68,68,0.55)',
            borderColor: '#ef4444', borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: { y: { beginAtZero: true, ticks: { font: { size: 10 } } } }
      }
    });
  }

  private renderChargesChart(d: PilotageData) {
    const canvas = this.chargesChartRef?.nativeElement;
    if (!canvas) return;
    this.chargesChart?.destroy();
    this.chargesChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: d.charges.map(c => `${c.libelle} (${c.pourcentage.toFixed(1)}%)`),
        datasets: [{
          data: d.charges.map(c => c.montant),
          backgroundColor: CHART_COLORS,
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { font: { size: 10 }, boxWidth: 12 } }
        }
      }
    });
  }

  private renderEquilibreChart(d: PilotageData) {
    const canvas = this.equilibreChartRef?.nativeElement;
    if (!canvas) return;
    this.equilibreChart?.destroy();
    this.equilibreChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: d.evolution.map(e => String(e.exercice)),
        datasets: [
          {
            label: 'FRNG', data: d.evolution.map(e => e.frng),
            borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)',
            fill: true, tension: 0.3, pointRadius: 4,
          },
          {
            label: 'BFR', data: d.evolution.map(e => e.bfr),
            borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)',
            fill: true, tension: 0.3, pointRadius: 4,
          },
          {
            label: 'TN', data: d.evolution.map(e => e.tn),
            borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)',
            fill: true, tension: 0.3, pointRadius: 4,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: { y: { ticks: { font: { size: 10 } } } }
      }
    });
  }

  fmtM(v: number): string {
    if (!isFinite(v)) return '—';
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + ' M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(1) + ' K';
    return v.toFixed(0);
  }

  deltaPct(evol: { ca: number }[]): string {
    if (evol.length < 2) return '—';
    const cur = evol[evol.length - 1].ca;
    const prev = evol[evol.length - 2].ca;
    if (!prev) return '—';
    const d = ((cur - prev) / Math.abs(prev)) * 100;
    return (d >= 0 ? '+' : '') + d.toFixed(1) + '%';
  }

  fmtRatio(r: RatioCle): string {
    const isPercent = r.code === 'AUT_FIN' || r.code === 'MARGE_NET' || r.code === 'TX_CHARGES';
    return isPercent ? r.valeur.toFixed(1) + '%' : r.valeur.toFixed(2) + ' ×';
  }

  gaugeWidth(r: RatioCle): number {
    if (r.code === 'LIQ_GEN')   return Math.min(100, (r.valeur / 3) * 100);
    if (r.code === 'AUT_FIN')   return Math.min(100, r.valeur);
    if (r.code === 'MARGE_NET') return Math.min(100, Math.max(0, r.valeur));
    if (r.code === 'TX_CHARGES')return Math.min(100, r.valeur);
    return 50;
  }

  niveauBg(n: string):        string { return n === 'BON' ? 'bg-green-500' : n === 'MOYEN' ? 'bg-yellow-400' : 'bg-red-500'; }
  niveauText(n: string):      string { return n === 'BON' ? 'text-green-700' : n === 'MOYEN' ? 'text-yellow-700' : 'text-red-700'; }
  niveauTextLight(n: string): string { return n === 'BON' ? 'text-green-500' : n === 'MOYEN' ? 'text-yellow-500' : 'text-red-400'; }
  niveauBadge(n: string):     string { return n === 'BON' ? 'bg-green-100 text-green-700' : n === 'MOYEN' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'; }
  niveauLabel(n: string):     string { return n === 'BON' ? 'Satisfaisant' : n === 'MOYEN' ? 'À surveiller' : 'Insuffisant'; }
}
