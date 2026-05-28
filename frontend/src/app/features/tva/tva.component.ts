import {
  ChangeDetectionStrategy, Component, ElementRef, inject,
  OnDestroy, OnInit, signal, ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TvaService } from '../../core/services/tva.service';
import { DeclarationTva, SimulationTva, StatAnnuelle } from '../../core/models/tva.model';
import {
  Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend,
  BarController, registerables
} from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-tva',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Déclarations TVA</h1>
      <p class="text-sm text-gray-500 mt-0.5">
        Calcul automatique depuis les comptes 443x (TVA collectée) et 445x (TVA déductible)
      </p>
    </div>
    <div class="flex items-center gap-3">
      <select [(ngModel)]="selectedExercice" (ngModelChange)="onExerciceChange($event)"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of exercices; track y) {
          <option [value]="y">{{ y }}</option>
        }
      </select>
      <a [href]="svc.exportCsvUrl(selectedExercice)" download
         class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg border border-gray-300 flex items-center gap-1">
        Export CSV
      </a>
    </div>
  </div>

  <!-- KPI annuels -->
  @if (statAnnuelle()) {
  <div class="grid grid-cols-4 gap-4">
    <div class="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p class="text-xs text-blue-600 uppercase tracking-wide">Collectée {{ selectedExercice }}</p>
      <p class="text-2xl font-bold text-blue-800 mt-1">{{ fmtK(statAnnuelle()!.totalCollectee) }}</p>
      <p class="text-xs text-blue-500 mt-0.5">Comptes 443x</p>
    </div>
    <div class="rounded-xl border border-green-200 bg-green-50 p-4">
      <p class="text-xs text-green-600 uppercase tracking-wide">Déductible {{ selectedExercice }}</p>
      <p class="text-2xl font-bold text-green-800 mt-1">{{ fmtK(statAnnuelle()!.totalDeductible) }}</p>
      <p class="text-xs text-green-500 mt-0.5">Comptes 445x</p>
    </div>
    <div class="rounded-xl border p-4"
         [ngClass]="statAnnuelle()!.totalADecaisser >= 0
           ? 'border-orange-200 bg-orange-50'
           : 'border-purple-200 bg-purple-50'">
      <p class="text-xs uppercase tracking-wide"
         [ngClass]="statAnnuelle()!.totalADecaisser >= 0 ? 'text-orange-600' : 'text-purple-600'">
        {{ statAnnuelle()!.totalADecaisser >= 0 ? 'Net à décaisser' : 'Crédit net' }}
      </p>
      <p class="text-2xl font-bold mt-1"
         [ngClass]="statAnnuelle()!.totalADecaisser >= 0 ? 'text-orange-800' : 'text-purple-800'">
        {{ fmtK(statAnnuelle()!.totalADecaisser) }}
      </p>
    </div>
    <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Déclarations</p>
      <p class="text-2xl font-bold text-gray-800 mt-1">{{ statAnnuelle()!.nbDeclarations }}</p>
      <p class="text-xs text-gray-400 mt-0.5">
        {{ statAnnuelle()!.moisDeclares.length }}/12 mois déclarés
      </p>
    </div>
  </div>

  <!-- Graphique mensuel -->
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h2 class="text-sm font-semibold text-gray-700 mb-4">Évolution mensuelle {{ selectedExercice }}</h2>
    <div class="relative h-64">
      <canvas #barCanvas></canvas>
    </div>
  </div>
  }

  <!-- Simulation panel -->
  <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
    <h2 class="text-sm font-semibold text-gray-700">Simuler / Déclarer une période</h2>

    <div class="flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Début de période</label>
        <input [(ngModel)]="formDebut" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Fin de période</label>
        <input [(ngModel)]="formFin" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="simuler()" [disabled]="simulating() || !formDebut || !formFin"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ simulating() ? 'Calcul…' : 'Simuler' }}
      </button>
      @for (q of quickPeriods; track q.label) {
        <button (click)="setQuickPeriod(q.debut, q.fin)"
                class="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
          {{ q.label }}
        </button>
      }
    </div>

    @if (simError()) {
      <p class="text-sm text-red-600">{{ simError() }}</p>
    }

    @if (simulation()) {
    <div class="space-y-4 pt-2">
      <!-- Summary cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p class="text-xs text-blue-600 uppercase tracking-wide">TVA collectée (443x)</p>
          <p class="text-2xl font-bold text-blue-800 mt-1">{{ simulation()!.tvaCollectee | number:'1.2-2' }}</p>
        </div>
        <div class="rounded-xl border border-green-200 bg-green-50 p-4">
          <p class="text-xs text-green-600 uppercase tracking-wide">TVA déductible (445x)</p>
          <p class="text-2xl font-bold text-green-800 mt-1">{{ simulation()!.tvaDeductible | number:'1.2-2' }}</p>
        </div>
        <div class="rounded-xl border p-4"
             [ngClass]="simulation()!.tvaADecaisser >= 0
               ? 'border-orange-200 bg-orange-50'
               : 'border-purple-200 bg-purple-50'">
          <p class="text-xs uppercase tracking-wide"
             [ngClass]="simulation()!.tvaADecaisser >= 0 ? 'text-orange-600' : 'text-purple-600'">
            {{ simulation()!.tvaADecaisser >= 0 ? 'TVA à décaisser (4441)' : 'Crédit de TVA' }}
          </p>
          <p class="text-2xl font-bold mt-1"
             [ngClass]="simulation()!.tvaADecaisser >= 0 ? 'text-orange-800' : 'text-purple-800'">
            {{ simulation()!.tvaADecaisser | number:'1.2-2' }}
          </p>
        </div>
      </div>

      <!-- Detail by account -->
      @if (simulation()!.detail.length > 0) {
      <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Intitulé</th>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (l of simulation()!.detail; track l.compteNumero) {
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-2 font-mono text-gray-700">{{ l.compteNumero }}</td>
            <td class="px-4 py-2 text-gray-700">{{ l.intitule }}</td>
            <td class="px-4 py-2">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="l.type === 'COLLECTEE'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-green-100 text-green-700'">
                {{ l.type === 'COLLECTEE' ? 'Collectée' : 'Déductible' }}
              </span>
            </td>
            <td class="px-4 py-2 text-right font-mono text-red-600">
              {{ l.debit > 0 ? (l.debit | number:'1.2-2') : '' }}
            </td>
            <td class="px-4 py-2 text-right font-mono text-green-600">
              {{ l.credit > 0 ? (l.credit | number:'1.2-2') : '' }}
            </td>
          </tr>
          }
        </tbody>
      </table>
      } @else {
        <p class="text-sm text-gray-400 text-center py-4">
          Aucun mouvement TVA (443x / 445x) sur cette période.
        </p>
      }

      <!-- Validate button -->
      @if (simulation()!.dejaDeclare) {
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          Une déclaration existe déjà pour cette période.
        </div>
      } @else {
        <div class="flex items-center gap-4">
          <button (click)="valider()" [disabled]="validating()"
                  class="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
            {{ validating() ? 'Validation…' : 'Valider la déclaration' }}
          </button>
          <p class="text-xs text-gray-400">
            Génère une écriture OD brouillon de liquidation TVA (DR 4431 / CR 4455 / CR 4441)
          </p>
        </div>
      }

      @if (validerSuccess()) {
        <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          Déclaration validée.
          @if (validerSuccess()!.ecritureId) {
            Écriture OD <strong>{{ 'TVA-' + simulation()!.periodeDebut.slice(0,7) }}</strong> générée en brouillon.
          }
        </div>
      }
      @if (validerError()) {
        <p class="text-sm text-red-600">{{ validerError() }}</p>
      }
    </div>
    }
  </div>

  <!-- Historique -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <div class="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-700">Historique des déclarations</h2>
      <span class="text-xs text-gray-400">{{ declarations().length }} déclaration(s)</span>
    </div>
    @if (declarations().length === 0) {
      <div class="flex items-center justify-center h-24 text-gray-400 text-sm">
        Aucune déclaration TVA enregistrée.
      </div>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Période</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TVA collectée</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">TVA déductible</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">À décaisser</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OD</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (d of declarations(); track d.id) {
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-gray-700 text-xs">
              {{ d.periodeDebut }} → {{ d.periodeFin }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-blue-700">{{ d.tvaCollectee | number:'1.2-2' }}</td>
            <td class="px-4 py-3 text-right font-mono text-green-700">{{ d.tvaDeductible | number:'1.2-2' }}</td>
            <td class="px-4 py-3 text-right font-mono font-semibold"
                [ngClass]="d.tvaADecaisser >= 0 ? 'text-orange-700' : 'text-purple-700'">
              {{ d.tvaADecaisser | number:'1.2-2' }}
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="d.statut === 'VALIDEE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ d.statut }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs font-mono text-gray-400">
              {{ d.ecritureId ? '✓ OD' : '—' }}
            </td>
          </tr>
          }
        </tbody>
      </table>
    }
  </div>

</div>
  `,
})
export class TvaComponent implements OnInit, OnDestroy {

  @ViewChild('barCanvas') barCanvasRef!: ElementRef<HTMLCanvasElement>;

  svc = inject(TvaService);

  declarations  = signal<DeclarationTva[]>([]);
  simulation    = signal<SimulationTva | null>(null);
  statAnnuelle  = signal<StatAnnuelle | null>(null);
  simulating    = signal(false);
  simError      = signal<string | null>(null);
  validating    = signal(false);
  validerError  = signal<string | null>(null);
  validerSuccess = signal<DeclarationTva | null>(null);

  formDebut = '';
  formFin   = '';

  selectedExercice = new Date().getFullYear();
  exercices = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  quickPeriods = this.buildQuickPeriods();

  private barChart?: Chart;

  ngOnInit() {
    this.loadDeclarations();
    this.loadAnnuel();
  }

  ngOnDestroy() {
    this.barChart?.destroy();
  }

  onExerciceChange(year: number) {
    this.selectedExercice = year;
    this.loadAnnuel();
  }

  loadDeclarations() {
    this.svc.lister().subscribe({ next: list => this.declarations.set(list) });
  }

  loadAnnuel() {
    this.svc.getAnnuel(this.selectedExercice).subscribe({
      next: stat => {
        this.statAnnuelle.set(stat);
        Promise.resolve().then(() => this.buildBarChart());
      },
    });
  }

  simuler() {
    if (!this.formDebut || !this.formFin) return;
    this.simulating.set(true); this.simError.set(null);
    this.simulation.set(null); this.validerSuccess.set(null); this.validerError.set(null);
    this.svc.simuler(this.formDebut, this.formFin).subscribe({
      next: s  => { this.simulation.set(s); this.simulating.set(false); },
      error: e => { this.simError.set(e?.error?.message ?? 'Erreur.'); this.simulating.set(false); },
    });
  }

  valider() {
    if (!this.formDebut || !this.formFin) return;
    this.validating.set(true); this.validerError.set(null); this.validerSuccess.set(null);
    this.svc.valider(this.formDebut, this.formFin).subscribe({
      next: d => {
        this.validating.set(false); this.validerSuccess.set(d);
        this.loadDeclarations(); this.loadAnnuel(); this.simuler();
      },
      error: e => { this.validating.set(false); this.validerError.set(e?.error?.message ?? 'Erreur.'); },
    });
  }

  setQuickPeriod(debut: string, fin: string) {
    this.formDebut = debut; this.formFin = fin;
    this.simuler();
  }

  fmtK(v: number): string {
    const abs = Math.abs(v);
    const sign = v < 0 ? '-' : '';
    if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + ' M';
    if (abs >= 1_000)     return sign + (abs / 1_000).toFixed(1) + ' K';
    return sign + abs.toFixed(0);
  }

  private buildBarChart() {
    const stat = this.statAnnuelle();
    if (!stat || !this.barCanvasRef) return;

    this.barChart?.destroy();

    const labels    = stat.mensuel.map(m => m.label);
    const collectee = stat.mensuel.map(m => m.tvaCollectee);
    const deduct    = stat.mensuel.map(m => m.tvaDeductible);
    const net       = stat.mensuel.map(m => m.tvaADecaisser);

    this.barChart = new Chart(this.barCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'TVA collectée',
            data: collectee,
            backgroundColor: 'rgba(59,130,246,0.7)',
            borderColor: 'rgb(59,130,246)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'TVA déductible',
            data: deduct,
            backgroundColor: 'rgba(34,197,94,0.7)',
            borderColor: 'rgb(34,197,94)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Net à décaisser',
            data: net,
            type: 'line' as const,
            borderColor: 'rgb(234,88,12)',
            backgroundColor: 'rgba(234,88,12,0.1)',
            borderWidth: 2,
            pointRadius: 3,
            tension: 0.3,
            fill: false,
            yAxisID: 'y',
          } as any,
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${this.fmtK(ctx.parsed.y ?? 0)}`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }

  private buildQuickPeriods() {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth(); // 0-based
    const pad   = (n: number) => String(n).padStart(2, '0');

    const moisPrecedent = month === 0
      ? { y: year - 1, m: 12 }
      : { y: year, m: month };

    return [
      {
        label: 'Mois en cours',
        debut: `${year}-${pad(month + 1)}-01`,
        fin:   new Date(year, month + 1, 0).toISOString().slice(0, 10),
      },
      {
        label: 'Mois précédent',
        debut: `${moisPrecedent.y}-${pad(moisPrecedent.m)}-01`,
        fin:   new Date(moisPrecedent.y, moisPrecedent.m, 0).toISOString().slice(0, 10),
      },
      {
        label: 'T1',
        debut: `${year}-01-01`,
        fin:   `${year}-03-31`,
      },
      {
        label: 'Année',
        debut: `${year}-01-01`,
        fin:   `${year}-12-31`,
      },
    ];
  }
}
