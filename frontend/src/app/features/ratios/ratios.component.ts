import {
  ChangeDetectionStrategy, Component, computed, ElementRef,
  OnDestroy, OnInit, signal, ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { RatiosService } from '../../core/services/ratios.service';
import { RatiosData, RatioItem } from '../../core/models/ratios.model';

Chart.register(...registerables);

@Component({
  selector: 'app-ratios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Ratios Financiers SYSCOHADA</h1>
      <p class="text-xs text-gray-400 mt-0.5">Analyse financière enrichie avec comparaison N-1 — exercice {{ exercice() }}</p>
    </div>
    <select [ngModel]="exercice()" (ngModelChange)="changeExercice($event)"
            class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      @for (y of years(); track y) { <option [value]="y">{{ y }}</option> }
    </select>
  </div>

  @if (loading()) {
    <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Calcul en cours…</div>
  } @else if (error()) {
    <div class="flex items-center justify-center h-48 text-red-500 text-sm">{{ error() }}</div>
  } @else if (data()) {

    <!-- Score Global + scores par groupe -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

      <!-- Score global -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-5">
        <div class="relative w-20 h-20 shrink-0">
          <svg class="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" stroke-width="3"/>
            <circle cx="18" cy="18" r="15.9" fill="none"
                    [attr.stroke]="scoreGlobalStroke()"
                    stroke-width="3" stroke-linecap="round"
                    [attr.stroke-dasharray]="scoreGlobalDash()" stroke-dashoffset="0"/>
          </svg>
          <span class="absolute inset-0 flex items-center justify-center text-lg font-bold"
                [class]="scoreGlobalTextClass()">{{ data()!.scoreGlobal }}</span>
        </div>
        <div>
          <p class="text-xs text-gray-500 uppercase tracking-wide">Score global</p>
          <p class="text-sm font-semibold mt-0.5" [class]="scoreGlobalTextClass()">
            {{ scoreGlobalLabel() }}
          </p>
          <p class="text-xs text-gray-400 mt-1">Pondéré sur 100</p>
        </div>
      </div>

      <!-- Scores par groupe -->
      <div class="md:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide mb-3">Score par groupe</p>
        <div class="grid grid-cols-5 gap-2">
          @for (entry of groupeScores(); track entry.titre) {
            <div class="text-center">
              <div class="text-xl font-bold font-mono" [class]="scoreClass(entry.scoreN)">{{ entry.scoreN }}</div>
              <div class="text-xs text-gray-400 mt-0.5 leading-tight">{{ entry.titre }}</div>
              @if (entry.scoreN1 !== null) {
                <div class="text-xs mt-0.5" [class]="evoClass(entry.scoreN - entry.scoreN1)">
                  {{ entry.scoreN >= entry.scoreN1 ? '↑' : '↓' }} N-1: {{ entry.scoreN1 }}
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Radar chart -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-sm font-semibold text-gray-700 mb-2">Performance par groupe — N vs N-1</p>
      <div class="relative h-72">
        <canvas #radarCanvas></canvas>
      </div>
    </div>

    <!-- Cartes de synthèse -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Total Actif</p>
        <p class="text-lg font-bold text-gray-800 mt-1 font-mono">{{ data()!.totalActif | number:'1.0-0' }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Chiffre d'affaires</p>
        <p class="text-lg font-bold text-blue-700 mt-1 font-mono">{{ data()!.chiffreAffaires | number:'1.0-0' }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Résultat net</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'">
          {{ data()!.resultatNet | number:'1.0-0' }}
        </p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Capitaux propres</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.capitauxPropres >= 0 ? 'text-gray-800' : 'text-red-700'">
          {{ data()!.capitauxPropres | number:'1.0-0' }}
        </p>
      </div>
    </div>

    <!-- FRNG / BFR / TN -->
    <div class="grid grid-cols-3 gap-4">
      <div class="rounded-xl border p-4 text-center"
           [class]="data()!.frng >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">FRNG</p>
        <p class="text-xl font-bold mt-1 font-mono"
           [class]="data()!.frng >= 0 ? 'text-green-700' : 'text-red-700'">
          {{ fmtMoney(data()!.frng) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Fonds de Roulement Net Global</p>
      </div>
      <div class="rounded-xl border p-4 text-center"
           [class]="data()!.bfr <= 0 ? 'bg-green-50 border-green-200' : (data()!.bfr <= data()!.frng ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200')">
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">BFR</p>
        <p class="text-xl font-bold mt-1 font-mono"
           [class]="data()!.bfr <= 0 ? 'text-green-700' : (data()!.bfr <= data()!.frng ? 'text-yellow-700' : 'text-red-700')">
          {{ fmtMoney(data()!.bfr) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Besoin en Fonds de Roulement</p>
      </div>
      <div class="rounded-xl border p-4 text-center"
           [class]="(data()!.frng - data()!.bfr) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'">
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">TN</p>
        <p class="text-xl font-bold mt-1 font-mono"
           [class]="(data()!.frng - data()!.bfr) >= 0 ? 'text-blue-700' : 'text-red-700'">
          {{ fmtMoney(data()!.frng - data()!.bfr) }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Trésorerie Nette</p>
      </div>
    </div>

    <!-- Groupes de ratios -->
    @for (groupe of data()!.groupes; track groupe.titre) {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold">{{ groupe.titre }}</div>
        <div class="divide-y divide-gray-100">
          @for (r of groupe.ratios; track r.code) {
            <div class="px-4 py-3 flex items-center gap-4">
              <span class="shrink-0 w-2 h-8 rounded-full" [class]="niveauColor(r.niveau, 'bg')"></span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ r.libelle }}</p>
                <p class="text-xs text-gray-400 truncate">{{ r.formule }}</p>
              </div>
              <!-- Valeur N + évolution -->
              <div class="text-right shrink-0 w-48">
                <p class="text-base font-bold font-mono" [class]="niveauColor(r.niveau, 'text')">
                  {{ fmt(r.valeur, r.formule) }}
                </p>
                @if (r.valeurN1 != null) {
                  <p class="text-xs text-gray-400">N-1 : {{ fmt(r.valeurN1, r.formule) }}</p>
                  <span class="text-xs font-medium" [class]="evoClass(r.evolutionPct)">
                    {{ evoLabel(r.evolutionPct) }}
                  </span>
                }
                <p class="text-xs" [class]="niveauColor(r.niveau, 'text-light')">{{ r.interpretation }}</p>
              </div>
              <span class="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                    [class]="niveauColor(r.niveau, 'badge')">
                {{ r.niveau }}
              </span>
            </div>
          }
        </div>
      </div>
    }

    <p class="text-xs text-gray-400 text-center">
      Ratios calculés depuis les écritures validées — exercice {{ data()!.exercice }} — SYSCOHADA Système Normal
    </p>
  }
</div>
  `
})
export class RatiosComponent implements OnInit, OnDestroy {

  @ViewChild('radarCanvas') radarCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private svc: RatiosService) {}

  exercice = signal(new Date().getFullYear());
  loading  = signal(false);
  error    = signal<string | null>(null);
  data     = signal<RatiosData | null>(null);

  private radarChart?: Chart;

  years = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3];
  });

  groupeScores = computed(() => {
    const d = this.data();
    if (!d) return [];
    return Object.entries(d.scoresGroupes).map(([titre, scoreN]) => ({
      titre,
      scoreN,
      scoreN1: d.scoresGroupesN1[titre] ?? null
    }));
  });

  ngOnInit() { this.load(); }

  ngOnDestroy() {
    if (this.radarChart) { this.radarChart.destroy(); }
  }

  changeExercice(y: number) {
    this.exercice.set(Number(y));
    this.load();
  }

  private load() {
    if (this.radarChart) { this.radarChart.destroy(); this.radarChart = undefined; }
    this.loading.set(true);
    this.error.set(null);
    this.data.set(null);
    this.svc.calculer(this.exercice()).subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
        Promise.resolve().then(() => this.buildRadar());
      },
      error: (e: any) => {
        this.error.set(e?.error?.message ?? 'Erreur de calcul');
        this.loading.set(false);
      }
    });
  }

  private buildRadar() {
    const d = this.data();
    if (!d || !this.radarCanvas?.nativeElement) return;
    if (this.radarChart) { this.radarChart.destroy(); }
    const ctx = this.radarCanvas.nativeElement.getContext('2d')!;
    const labels = Object.keys(d.scoresGroupes);
    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: `N (${d.exercice})`,
            data: Object.values(d.scoresGroupes),
            backgroundColor: 'rgba(59,130,246,0.15)',
            borderColor: 'rgba(59,130,246,0.8)',
            pointBackgroundColor: 'rgba(59,130,246,1)',
            borderWidth: 2,
          },
          {
            label: `N-1 (${d.exercice - 1})`,
            data: Object.values(d.scoresGroupesN1),
            backgroundColor: 'rgba(156,163,175,0.08)',
            borderColor: 'rgba(156,163,175,0.6)',
            pointBackgroundColor: 'rgba(156,163,175,0.8)',
            borderWidth: 1.5,
            borderDash: [4, 4],
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { stepSize: 25, font: { size: 10 } },
            pointLabels: { font: { size: 11 } }
          }
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } }
        }
      }
    });
  }

  // ── Format helpers ────────────────────────────────────────────────────────

  fmt(v: number, formule: string): string {
    const f = formule ?? '';
    if (f.includes('× 100') || f.includes('×100')) return v.toFixed(1) + ' %';
    if (f.includes('365'))    return v.toFixed(0) + ' j';
    if (f.includes('années')) return v.toFixed(1) + ' ans';
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + ' M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(1) + ' K';
    return v.toFixed(2) + ' ×';
  }

  fmtMoney(v: number): string {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + ' K';
    return v.toFixed(0);
  }

  evoLabel(pct: number): string {
    if (Math.abs(pct) < 0.05) return '→ 0,0%';
    return `${pct > 0 ? '↑' : '↓'} ${Math.abs(pct).toFixed(1)}%`;
  }

  evoClass(pct: number): string {
    if (pct > 0.5)  return 'text-green-600';
    if (pct < -0.5) return 'text-red-600';
    return 'text-gray-400';
  }

  scoreClass(s: number): string {
    if (s >= 70) return 'text-green-700';
    if (s >= 40) return 'text-yellow-700';
    return 'text-red-700';
  }

  scoreGlobalLabel(): string {
    const s = this.data()?.scoreGlobal ?? 0;
    if (s >= 70) return 'Situation saine';
    if (s >= 40) return 'À surveiller';
    return 'Situation fragile';
  }

  scoreGlobalTextClass(): string {
    const s = this.data()?.scoreGlobal ?? 0;
    if (s >= 70) return 'text-green-700';
    if (s >= 40) return 'text-yellow-700';
    return 'text-red-700';
  }

  scoreGlobalStroke(): string {
    const s = this.data()?.scoreGlobal ?? 0;
    if (s >= 70) return '#16a34a';
    if (s >= 40) return '#ca8a04';
    return '#dc2626';
  }

  scoreGlobalDash(): string {
    const s = this.data()?.scoreGlobal ?? 0;
    const pct = (s / 100) * 100;
    return `${pct} ${100 - pct}`;
  }

  niveauColor(niveau: string, variant: 'bg' | 'text' | 'text-light' | 'badge'): string {
    const map: Record<string, Record<string, string>> = {
      BON:    { bg: 'bg-green-500',  text: 'text-green-700',  'text-light': 'text-green-500',  badge: 'bg-green-100 text-green-700'  },
      MOYEN:  { bg: 'bg-yellow-400', text: 'text-yellow-700', 'text-light': 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
      FAIBLE: { bg: 'bg-red-500',    text: 'text-red-700',    'text-light': 'text-red-400',    badge: 'bg-red-100 text-red-700'    },
      INFO:   { bg: 'bg-blue-400',   text: 'text-blue-700',   'text-light': 'text-blue-400',   badge: 'bg-blue-100 text-blue-700'   },
    };
    return (map[niveau] ?? map['INFO'])[variant] ?? '';
  }
}
