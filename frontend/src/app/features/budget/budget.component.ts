import {
  ChangeDetectionStrategy, Component, computed, ElementRef,
  OnDestroy, OnInit, signal, ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { BudgetService } from '../../core/services/budget.service';
import { BudgetComparatif, BudgetUpsertRequest, LigneComparatif, SensBudget } from '../../core/models/budget.model';

Chart.register(...registerables);

interface AddForm {
  compteNumero: string;
  montant: string;
  sens: SensBudget;
}

type FiltreStatut = 'ALL' | 'DEPASSE' | 'ALERTE' | 'OK';

@Component({
  selector: 'app-budget',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Budget et prévisions</h1>
      <p class="text-sm text-gray-500 mt-0.5">Comparatif budget prévisionnel vs réalisé — exercice {{ selectedExercice }}</p>
    </div>
    <div class="flex items-center gap-3">
      <select [(ngModel)]="selectedExercice" (ngModelChange)="onExerciceChange($event)"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of exercices(); track y) { <option [value]="y">{{ y }}</option> }
      </select>
      @if (data()) {
        <a [href]="svc.exportCsvUrl(selectedExercice)" download
           class="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
          ↓ CSV
        </a>
      }
    </div>
  </div>

  @if (loading()) {
    <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
  } @else if (error()) {
    <div class="flex items-center justify-center h-40 text-red-500 text-sm">{{ error() }}</div>
  } @else if (data()) {

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Budget total</p>
        <p class="text-lg font-bold text-gray-900 mt-1 font-mono">{{ fmtK(data()!.totalBudget) }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Réalisé</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.totalRealise > data()!.totalBudget ? 'text-red-600' : 'text-blue-700'">
          {{ fmtK(data()!.totalRealise) }}
        </p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Écart</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.totalEcart >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ fmtK(data()!.totalEcart) }}
        </p>
      </div>
      <div class="rounded-xl border p-4"
           [class]="data()!.tauxConsommation > 100 ? 'bg-red-50 border-red-200' : data()!.tauxConsommation > 80 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Consommation</p>
        <p class="text-lg font-bold mt-1"
           [class]="data()!.tauxConsommation > 100 ? 'text-red-700' : data()!.tauxConsommation > 80 ? 'text-yellow-700' : 'text-green-700'">
          {{ data()!.tauxConsommation | number:'1.1-1' }} %
        </p>
        <div class="mt-1.5 h-1.5 bg-white/60 rounded-full overflow-hidden">
          <div class="h-1.5 rounded-full"
               [class]="data()!.tauxConsommation > 100 ? 'bg-red-500' : data()!.tauxConsommation > 80 ? 'bg-yellow-400' : 'bg-green-500'"
               [style.width.%]="data()!.tauxConsommation > 100 ? 100 : data()!.tauxConsommation">
          </div>
        </div>
      </div>
      <div class="rounded-xl border p-4"
           [class]="data()!.nbDepassements > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Dépassements</p>
        <p class="text-2xl font-bold mt-1"
           [class]="data()!.nbDepassements > 0 ? 'text-red-700' : 'text-green-700'">
          {{ data()!.nbDepassements }}
        </p>
        <p class="text-xs mt-0.5" [class]="data()!.nbDepassements > 0 ? 'text-red-500' : 'text-green-500'">
          ligne{{ data()!.nbDepassements > 1 ? 's' : '' }} dépassée{{ data()!.nbDepassements > 1 ? 's' : '' }}
        </p>
      </div>
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

      <!-- Graphique barres horizontales : Budget vs Réalisé -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-2">Budget vs Réalisé par compte (top 15)</p>
        <div class="relative h-80">
          <canvas #barCanvas></canvas>
        </div>
      </div>

      <!-- Graphique tendance mensuelle -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-sm font-semibold text-gray-700 mb-2">Réalisé mensuel vs cible linéaire</p>
        <div class="relative h-80">
          <canvas #lineCanvas></canvas>
        </div>
      </div>
    </div>

    <!-- Alertes dépassements -->
    @if (depassements().length > 0) {
      <div class="bg-red-50 border border-red-200 rounded-xl p-4">
        <p class="text-sm font-semibold text-red-700 mb-2">
          ⚠ {{ depassements().length }} ligne{{ depassements().length > 1 ? 's' : '' }} dépassée{{ depassements().length > 1 ? 's' : '' }}
        </p>
        <div class="space-y-1">
          @for (l of depassements(); track l.budgetId) {
            <div class="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2 border border-red-100">
              <span class="font-mono text-gray-700 font-medium">{{ l.compteNumero }}</span>
              <span class="text-gray-500 flex-1 mx-3 truncate">{{ l.intitule }}</span>
              <span class="font-bold text-red-700">{{ l.pctConsomme | number:'1.0-1' }}%</span>
              <span class="ml-2 text-red-500">+{{ fmtK(l.realise - l.budget) }} dépassé</span>
            </div>
          }
        </div>
      </div>
    }

    <!-- Filtres + formulaire -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <h2 class="text-sm font-semibold text-gray-700">Filtres & ajout de ligne budgétaire</h2>

      <!-- Filtres -->
      <div class="flex flex-wrap gap-3 items-center">
        <input [(ngModel)]="recherche" placeholder="Rechercher compte ou intitulé…"
               class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select [(ngModel)]="filtreSens"
                class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Tous les sens</option>
          <option value="DEBIT">Débit</option>
          <option value="CREDIT">Crédit</option>
        </select>
        <select [(ngModel)]="filtreStatut"
                class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="ALL">Tous statuts</option>
          <option value="DEPASSE">Dépassés (&gt;100%)</option>
          <option value="ALERTE">Alerte (80-100%)</option>
          <option value="OK">OK (&lt;80%)</option>
        </select>
      </div>

      <!-- Formulaire -->
      <div class="flex flex-wrap gap-3 items-end border-t border-gray-100 pt-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Compte <span class="text-red-500">*</span></label>
          <input [(ngModel)]="addForm.compteNumero" maxlength="20" placeholder="601000"
                 class="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Sens</label>
          <select [(ngModel)]="addForm.sens"
                  class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="DEBIT">Débit</option>
            <option value="CREDIT">Crédit</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Montant <span class="text-red-500">*</span></label>
          <input [(ngModel)]="addForm.montant" type="number" min="0" step="0.01" placeholder="0.00"
                 class="w-36 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button (click)="saveLine()" [disabled]="saving()"
                class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        @if (addError()) { <p class="text-xs text-red-600">{{ addError() }}</p> }
        @if (addSuccess()) { <p class="text-xs text-green-600">Ligne enregistrée.</p> }
      </div>
    </div>

    <!-- Tableau filtré -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <span class="text-sm font-medium text-gray-700">
          {{ lignesFiltrees().length }} ligne{{ lignesFiltrees().length > 1 ? 's' : '' }}
        </span>
        <span class="text-xs text-gray-400">Cliquez sur "Modifier" pour pré-remplir le formulaire</span>
      </div>
      @if (lignesFiltrees().length === 0) {
        <div class="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-2">
          <span>Aucune ligne budgétaire pour ce filtre.</span>
        </div>
      } @else {
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intitulé</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sens</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Réalisé</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Écart</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-44">Avancement</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (l of lignesFiltrees(); track l.budgetId) {
                <tr class="hover:bg-gray-50 transition-colors"
                    [class]="l.pctConsomme > 100 ? 'bg-red-50/40' : ''">
                  <td class="px-4 py-3 font-mono text-gray-700 font-medium">{{ l.compteNumero }}</td>
                  <td class="px-4 py-3 text-gray-700 max-w-xs truncate">{{ l.intitule }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          [class]="l.sens === 'DEBIT' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'">
                      {{ l.sens === 'DEBIT' ? 'Débit' : 'Crédit' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-mono text-gray-700">{{ l.budget | number:'1.0-0' }}</td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="l.realise > l.budget ? 'text-red-600 font-semibold' : 'text-gray-700'">
                    {{ l.realise | number:'1.0-0' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono font-semibold"
                      [class]="l.ecart >= 0 ? 'text-green-600' : 'text-red-600'">
                    {{ l.ecart | number:'1.0-0' }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div class="h-2 rounded-full"
                             [class]="barColor(l.pctConsomme)"
                             [style.width.%]="l.pctConsomme > 100 ? 100 : l.pctConsomme">
                        </div>
                      </div>
                      <span class="text-xs font-medium w-12 text-right"
                            [class]="l.pctConsomme > 100 ? 'text-red-600' : l.pctConsomme > 80 ? 'text-yellow-600' : 'text-gray-500'">
                        {{ l.pctConsomme | number:'1.0-1' }}%
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="prefillEdit(l)"
                            class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 mr-1">
                      Modifier
                    </button>
                    <button (click)="deleteLine(l)"
                            class="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600">
                      Suppr.
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

  } @else {
    <!-- No data yet -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <h2 class="text-sm font-semibold text-gray-700 mb-3">Ajouter une première ligne budgétaire</h2>
      <div class="flex flex-wrap gap-3 items-end">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Compte <span class="text-red-500">*</span></label>
          <input [(ngModel)]="addForm.compteNumero" maxlength="20" placeholder="601000"
                 class="w-32 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Sens</label>
          <select [(ngModel)]="addForm.sens"
                  class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="DEBIT">Débit</option>
            <option value="CREDIT">Crédit</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Montant <span class="text-red-500">*</span></label>
          <input [(ngModel)]="addForm.montant" type="number" min="0" step="0.01" placeholder="0.00"
                 class="w-36 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button (click)="saveLine()" [disabled]="saving()"
                class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
          {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        @if (addError()) { <p class="text-xs text-red-600">{{ addError() }}</p> }
      </div>
    </div>
  }

</div>
  `
})
export class BudgetComponent implements OnInit, OnDestroy {

  @ViewChild('barCanvas')  barCanvas!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('lineCanvas') lineCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(readonly svc: BudgetService) {}

  exercices       = signal<number[]>([]);
  selectedExercice = new Date().getFullYear();

  data    = signal<BudgetComparatif | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  recherche    = '';
  filtreSens: 'ALL' | 'DEBIT' | 'CREDIT' = 'ALL';
  filtreStatut: FiltreStatut = 'ALL';

  addForm: AddForm = { compteNumero: '', montant: '', sens: 'DEBIT' };
  saving     = signal(false);
  addError   = signal<string | null>(null);
  addSuccess = signal(false);

  private barChart?: Chart;
  private lineChart?: Chart;

  lignesFiltrees = computed(() => {
    const d = this.data();
    if (!d) return [];
    return d.lignes.filter(l => {
      const q = this.recherche.toLowerCase();
      if (q && !l.compteNumero.includes(q) && !l.intitule.toLowerCase().includes(q)) return false;
      if (this.filtreSens !== 'ALL' && l.sens !== this.filtreSens) return false;
      if (this.filtreStatut === 'DEPASSE' && l.pctConsomme <= 100) return false;
      if (this.filtreStatut === 'ALERTE'  && (l.pctConsomme <= 80 || l.pctConsomme > 100)) return false;
      if (this.filtreStatut === 'OK'      && l.pctConsomme >= 80) return false;
      return true;
    });
  });

  depassements = computed(() =>
    (this.data()?.lignes ?? []).filter(l => l.pctConsomme > 100)
  );

  ngOnInit() {
    this.svc.exercices().subscribe({ next: list => {
      this.exercices.set(list);
      if (list.length > 0 && !list.includes(this.selectedExercice)) {
        this.selectedExercice = list[0];
      }
      this.loadData();
    }});
  }

  ngOnDestroy() {
    this.barChart?.destroy();
    this.lineChart?.destroy();
  }

  onExerciceChange(y: number) {
    this.selectedExercice = +y;
    this.loadData();
  }

  loadData() {
    this.barChart?.destroy();
    this.lineChart?.destroy();
    this.barChart = undefined;
    this.lineChart = undefined;
    this.loading.set(true);
    this.error.set(null);
    this.data.set(null);
    this.svc.getComparatif(this.selectedExercice).subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
        Promise.resolve().then(() => this.buildCharts());
      },
      error: () => { this.error.set('Erreur de chargement.'); this.loading.set(false); },
    });
  }

  private buildCharts() {
    this.buildBarChart();
    this.buildLineChart();
  }

  private buildBarChart() {
    const d = this.data();
    if (!d || !this.barCanvas?.nativeElement) return;
    if (this.barChart) this.barChart.destroy();

    const top15 = [...d.lignes]
      .sort((a, b) => b.budget - a.budget)
      .slice(0, 15);

    const labels   = top15.map(l => `${l.compteNumero}`);
    const budgets  = top15.map(l => l.budget);
    const realises = top15.map(l => l.realise);
    const colors   = top15.map(l =>
      l.pctConsomme > 100 ? 'rgba(239,68,68,0.75)'
      : l.pctConsomme > 80 ? 'rgba(245,158,11,0.75)'
      : 'rgba(59,130,246,0.75)'
    );

    this.barChart = new Chart(this.barCanvas.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Budget',
            data: budgets,
            backgroundColor: 'rgba(209,213,219,0.6)',
            borderColor: 'rgba(156,163,175,0.8)',
            borderWidth: 1,
          },
          {
            label: 'Réalisé',
            data: realises,
            backgroundColor: colors,
            borderColor: colors.map(c => c.replace('0.75', '1')),
            borderWidth: 1,
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { font: { size: 10 }, callback: (v) => this.fmtK(Number(v)) } },
          y: { ticks: { font: { size: 10 } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${this.fmtK(ctx.parsed.x ?? 0)}`
            }
          }
        }
      }
    });
  }

  private buildLineChart() {
    const d = this.data();
    if (!d || !this.lineCanvas?.nativeElement) return;
    if (this.lineChart) this.lineChart.destroy();

    const labels   = d.tendanceMensuelle.map(m => m.label);
    const realises = d.tendanceMensuelle.map(m => m.realise);
    const cibles   = d.tendanceMensuelle.map(m => m.cibleMois);

    this.lineChart = new Chart(this.lineCanvas.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Réalisé',
            data: realises,
            backgroundColor: 'rgba(59,130,246,0.65)',
            borderColor: 'rgba(59,130,246,0.9)',
            borderWidth: 1,
            order: 2,
          },
          {
            type: 'line' as const,
            label: 'Cible mensuelle',
            data: cibles,
            borderColor: 'rgba(239,68,68,0.75)',
            borderWidth: 2,
            borderDash: [5, 5],
            pointRadius: 0,
            fill: false,
            order: 1,
          } as any
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { ticks: { font: { size: 10 }, callback: (v) => this.fmtK(Number(v)) } },
          x: { ticks: { font: { size: 10 } } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${this.fmtK(ctx.parsed.y ?? 0)}`
            }
          }
        }
      }
    });
  }

  saveLine() {
    const { compteNumero, montant, sens } = this.addForm;
    if (!compteNumero.trim() || !montant) {
      this.addError.set('Le compte et le montant sont obligatoires.'); return;
    }
    this.saving.set(true); this.addError.set(null); this.addSuccess.set(false);
    const payload: BudgetUpsertRequest = {
      compteNumero: compteNumero.trim(),
      montant: parseFloat(montant),
      sens,
    };
    this.svc.upsert(this.selectedExercice, payload).subscribe({
      next: () => {
        this.saving.set(false); this.addSuccess.set(true);
        this.addForm = { compteNumero: '', montant: '', sens: 'DEBIT' };
        setTimeout(() => this.addSuccess.set(false), 3000);
        this.loadData();
      },
      error: e => { this.saving.set(false); this.addError.set(e?.error?.message ?? 'Erreur.'); },
    });
  }

  prefillEdit(l: LigneComparatif) {
    this.addForm = { compteNumero: l.compteNumero, montant: String(l.budget), sens: l.sens };
    this.addError.set(null); this.addSuccess.set(false);
  }

  deleteLine(l: LigneComparatif) {
    if (!confirm(`Supprimer la ligne budget pour ${l.compteNumero} ?`)) return;
    this.svc.delete(l.budgetId).subscribe({ next: () => this.loadData() });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  fmtK(v: number): string {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + ' K';
    return v.toFixed(0);
  }

  barColor(pct: number): string {
    if (pct > 100) return 'bg-red-500';
    if (pct > 80)  return 'bg-yellow-400';
    return 'bg-green-500';
  }
}
