import {
  ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit,
  signal, computed, ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { PayeService } from '../../core/services/paie.service';
import { PayeResponse, SauvegarderPayeRequest, MOIS_LABELS } from '../../core/models/paie.model';

Chart.register(...registerables);

@Component({
  selector: 'app-paie',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-6xl mx-auto space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Gestion de la paie</h1>
      <p class="text-xs text-gray-400 mt-0.5">OD automatique SYSCOHADA — 661 · 664 · 431 · 447 · 4221</p>
    </div>
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600">Exercice</label>
      <select [(ngModel)]="exercice" (ngModelChange)="charger()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of years; track y) { <option [value]="y">{{ y }}</option> }
      </select>
      <button (click)="ouvrirFormulaire()"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
        + Nouvelle paie
      </button>
    </div>
  </div>

  <!-- Récapitulatif annuel -->
  @if (feuilles().length > 0) {
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div class="bg-blue-50 rounded-xl p-3 text-center">
        <div class="text-xs text-blue-500 mb-1">Masse salariale brute</div>
        <div class="font-bold text-blue-700 font-mono text-sm">{{ totalBrut() | number:'1.2-2' }}</div>
      </div>
      <div class="bg-orange-50 rounded-xl p-3 text-center">
        <div class="text-xs text-orange-500 mb-1">Charges patronales</div>
        <div class="font-bold text-orange-700 font-mono text-sm">{{ totalPatronal() | number:'1.2-2' }}</div>
      </div>
      <div class="bg-red-50 rounded-xl p-3 text-center">
        <div class="text-xs text-red-500 mb-1">Retenues (CNSS + IPTS)</div>
        <div class="font-bold text-red-700 font-mono text-sm">{{ totalRetenues() | number:'1.2-2' }}</div>
      </div>
      <div class="bg-green-50 rounded-xl p-3 text-center">
        <div class="text-xs text-green-500 mb-1">Net à payer total</div>
        <div class="font-bold text-green-700 font-mono text-sm">{{ totalNet() | number:'1.2-2' }}</div>
      </div>
    </div>
  }

  <!-- Charts -->
  @if (feuilles().length > 0) {
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Évolution mensuelle — {{ exercice }}</h3>
        <div class="relative h-56">
          <canvas #barCanvas></canvas>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Décomposition annuelle</h3>
        <canvas #donutCanvas height="160"></canvas>
      </div>
    </div>
  }

  <!-- Formulaire -->
  @if (formOpen()) {
    <div class="bg-white border border-blue-200 rounded-2xl p-5 space-y-4">
      <h2 class="font-semibold text-gray-700">
        {{ editId() ? 'Modifier la paie' : 'Nouvelle feuille de paie' }} — {{ exercice }}
      </h2>

      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Mois *</label>
          <select [(ngModel)]="form.mois"
                  class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            @for (m of moisOptions; track m.v) {
              <option [value]="m.v">{{ m.l }}</option>
            }
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Nombre de salariés</label>
          <input type="number" min="0" [(ngModel)]="form.nbSalaries"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Masse salariale brute *</label>
          <input type="number" min="0" step="0.01" [(ngModel)]="form.masseSalarialeBrute"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Cotisations salariales (CNSS salarié)</label>
          <input type="number" min="0" step="0.01" [(ngModel)]="form.cotisationsSalariales"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">Cotisations patronales (CNSS employeur)</label>
          <input type="number" min="0" step="0.01" [(ngModel)]="form.cotisationsPatronales"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
        <div>
          <label class="text-xs text-gray-500 mb-1 block">IPTS retenu</label>
          <input type="number" min="0" step="0.01" [(ngModel)]="form.impotRetenu"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"/>
        </div>
      </div>

      <!-- Récap calculé -->
      <div class="bg-gray-50 rounded-xl p-3 grid grid-cols-3 gap-3 text-sm">
        <div>
          <span class="text-gray-500 text-xs">Net à payer</span>
          <div class="font-bold font-mono text-green-700">
            {{ netCalcule() | number:'1.2-2' }}
          </div>
        </div>
        <div>
          <span class="text-gray-500 text-xs">Coût total employeur</span>
          <div class="font-bold font-mono text-orange-700">
            {{ coutCalcule() | number:'1.2-2' }}
          </div>
        </div>
        <div>
          <span class="text-gray-500 text-xs">Total retenues</span>
          <div class="font-bold font-mono text-red-700">
            {{ (form.cotisationsSalariales + form.impotRetenu) | number:'1.2-2' }}
          </div>
        </div>
      </div>

      @if (formError()) {
        <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{{ formError() }}</div>
      }

      <div class="flex gap-3">
        <button (click)="sauvegarder()" [disabled]="saving()"
                class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition">
          {{ saving() ? 'Enregistrement…' : 'Enregistrer (brouillon)' }}
        </button>
        <button (click)="annuler()"
                class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl">
          Annuler
        </button>
      </div>
    </div>
  }

  <!-- Loading -->
  @if (loading()) {
    <div class="flex items-center justify-center py-16 text-gray-400 text-sm">
      <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
      Chargement…
    </div>
  }

  <!-- Tableau -->
  @if (!loading() && feuilles().length > 0) {
    <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left">Mois</th>
            <th class="px-4 py-3 text-center">Salariés</th>
            <th class="px-4 py-3 text-right">Brut</th>
            <th class="px-4 py-3 text-right">Ch. patronales</th>
            <th class="px-4 py-3 text-right">CNSS + IPTS</th>
            <th class="px-4 py-3 text-right">Net à payer</th>
            <th class="px-4 py-3 text-right">Coût total</th>
            <th class="px-4 py-3 text-center">Statut</th>
            <th class="px-4 py-3 text-center w-28">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (fp of feuilles(); track fp.id) {
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 font-medium text-gray-800">{{ fp.moisLibelle }}</td>
              <td class="px-4 py-3 text-center text-gray-600">{{ fp.nbSalaries }}</td>
              <td class="px-4 py-3 text-right font-mono">{{ fp.masseSalarialeBrute | number:'1.2-2' }}</td>
              <td class="px-4 py-3 text-right font-mono text-orange-700">{{ fp.cotisationsPatronales | number:'1.2-2' }}</td>
              <td class="px-4 py-3 text-right font-mono text-red-700">
                {{ (fp.cotisationsSalariales + fp.impotRetenu) | number:'1.2-2' }}
              </td>
              <td class="px-4 py-3 text-right font-mono font-semibold text-green-700">{{ fp.netAPayer | number:'1.2-2' }}</td>
              <td class="px-4 py-3 text-right font-mono text-gray-700">{{ fp.coutTotal | number:'1.2-2' }}</td>
              <td class="px-4 py-3 text-center">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      [class]="fp.statut === 'COMPTABILISEE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'">
                  {{ fp.statut === 'COMPTABILISEE' ? 'Comptabilisée' : 'Brouillon' }}
                </span>
              </td>
              <td class="px-4 py-3 text-center">
                <div class="flex items-center justify-center gap-1">
                  @if (fp.statut === 'BROUILLON') {
                    <button (click)="comptabiliser(fp)"
                            class="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                      Comptabiliser
                    </button>
                    <button (click)="modifier(fp)"
                            class="text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-50">
                      Modifier
                    </button>
                    <button (click)="supprimer(fp)"
                            class="text-xs text-red-500 hover:text-red-700 px-1">✕</button>
                  } @else {
                    <span class="text-xs text-gray-400 font-mono">{{ fp.ecritureId ? 'OD générée' : '–' }}</span>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  }

  @if (!loading() && feuilles().length === 0 && !formOpen()) {
    <div class="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 text-sm">
      Aucune feuille de paie pour l'exercice {{ exercice }}. Cliquez sur « + Nouvelle paie » pour commencer.
    </div>
  }
</div>
  `
})
export class PayeComponent implements OnInit, OnDestroy {

  constructor(private payeSvc: PayeService) {}

  @ViewChild('barCanvas')   barCanvasRef!:   ElementRef<HTMLCanvasElement>;
  @ViewChild('donutCanvas') donutCanvasRef!: ElementRef<HTMLCanvasElement>;

  private barChart?:   Chart;
  private donutChart?: Chart;

  exercice  = new Date().getFullYear();
  years     = [this.exercice, this.exercice - 1, this.exercice - 2];

  feuilles  = signal<PayeResponse[]>([]);
  loading   = signal(false);
  saving    = signal(false);
  formOpen  = signal(false);
  formError = signal<string | null>(null);
  editId    = signal<string | null>(null);

  form: SauvegarderPayeRequest = this.emptyForm();

  readonly moisOptions = Object.entries(MOIS_LABELS).map(([v, l]) => ({ v: Number(v), l }));

  totalBrut    = computed(() => this.feuilles().reduce((s, f) => s + f.masseSalarialeBrute, 0));
  totalPatronal = computed(() => this.feuilles().reduce((s, f) => s + f.cotisationsPatronales, 0));
  totalRetenues = computed(() => this.feuilles().reduce((s, f) => s + f.cotisationsSalariales + f.impotRetenu, 0));
  totalNet      = computed(() => this.feuilles().reduce((s, f) => s + f.netAPayer, 0));

  netCalcule()  { return Math.max(0, this.form.masseSalarialeBrute - this.form.cotisationsSalariales - this.form.impotRetenu); }
  coutCalcule() { return this.form.masseSalarialeBrute + this.form.cotisationsPatronales; }

  ngOnInit() { this.charger(); }

  ngOnDestroy() {
    this.barChart?.destroy();
    this.donutChart?.destroy();
  }

  charger() {
    this.barChart?.destroy();   this.barChart   = undefined;
    this.donutChart?.destroy(); this.donutChart = undefined;
    this.loading.set(true);
    this.feuilles.set([]);
    this.payeSvc.lister(this.exercice).subscribe({
      next: data => {
        this.feuilles.set(data);
        this.loading.set(false);
        Promise.resolve().then(() => this.buildCharts());
      },
      error: () => this.loading.set(false)
    });
  }

  private buildCharts() {
    this.buildBarChart();
    this.buildDonutChart();
  }

  private buildBarChart() {
    const data = this.feuilles();
    if (!data.length || !this.barCanvasRef) return;
    this.barChart?.destroy();
    const moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    const bruts  = Array(12).fill(0);
    const nets   = Array(12).fill(0);
    const patron = Array(12).fill(0);
    for (const f of data) {
      const i = f.mois - 1;
      bruts[i]  = f.masseSalarialeBrute;
      nets[i]   = f.netAPayer;
      patron[i] = f.cotisationsPatronales;
    }
    this.barChart = new Chart(this.barCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: moisLabels,
        datasets: [
          { label: 'Masse brute',       data: bruts,  backgroundColor: 'rgba(59,130,246,0.7)',  borderWidth: 0 },
          { label: 'Net à payer',        data: nets,   backgroundColor: 'rgba(34,197,94,0.75)', borderWidth: 0 },
          { label: 'Ch. patronales',     data: patron, backgroundColor: 'rgba(251,146,60,0.7)', borderWidth: 0 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: v => this.fmtK(Number(v)) } },
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${this.fmtK(ctx.parsed.y ?? 0)}` } },
        }
      }
    });
  }

  private buildDonutChart() {
    if (!this.feuilles().length || !this.donutCanvasRef) return;
    this.donutChart?.destroy();
    const net     = this.totalNet();
    const salarie = this.feuilles().reduce((s, f) => s + f.cotisationsSalariales, 0);
    const patron  = this.totalPatronal();
    const impot   = this.feuilles().reduce((s, f) => s + f.impotRetenu, 0);
    this.donutChart = new Chart(this.donutCanvasRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: ['Net à payer', 'Cotis. salariales', 'Ch. patronales', 'IPTS retenu'],
        datasets: [{
          data: [net, salarie, patron, impot],
          backgroundColor: ['#22c55e', '#ef4444', '#f97316', '#8b5cf6'],
          borderWidth: 0,
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } } },
        cutout: '62%',
      }
    });
  }

  private fmtK(v: number): string {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + ' K';
    return v.toFixed(0);
  }

  ouvrirFormulaire() {
    this.form = this.emptyForm();
    this.editId.set(null);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  modifier(fp: PayeResponse) {
    this.form = {
      mois: fp.mois, nbSalaries: fp.nbSalaries,
      masseSalarialeBrute: fp.masseSalarialeBrute,
      cotisationsSalariales: fp.cotisationsSalariales,
      cotisationsPatronales: fp.cotisationsPatronales,
      impotRetenu: fp.impotRetenu
    };
    this.editId.set(fp.id);
    this.formError.set(null);
    this.formOpen.set(true);
  }

  sauvegarder() {
    if (this.form.masseSalarialeBrute <= 0) {
      this.formError.set('La masse salariale brute doit être > 0.');
      return;
    }
    this.saving.set(true);
    this.formError.set(null);
    this.payeSvc.sauvegarder(this.exercice, this.form).subscribe({
      next: fp => {
        this.feuilles.update(list => {
          const idx = list.findIndex(f => f.id === fp.id || f.mois === fp.mois);
          return idx >= 0
            ? [...list.slice(0, idx), fp, ...list.slice(idx + 1)]
            : [...list, fp].sort((a, b) => a.mois - b.mois);
        });
        this.saving.set(false);
        this.formOpen.set(false);
      },
      error: (err: any) => {
        this.formError.set(err?.error?.message ?? 'Erreur lors de l\'enregistrement.');
        this.saving.set(false);
      }
    });
  }

  comptabiliser(fp: PayeResponse) {
    if (!confirm(`Comptabiliser la paie de ${fp.moisLibelle} ${fp.exercice} ? L'OD sera générée et la feuille verrouillée.`)) return;
    this.payeSvc.comptabiliser(fp.id).subscribe({
      next: updated => this.feuilles.update(list =>
        list.map(f => f.id === updated.id ? updated : f)),
      error: (err: any) => alert(err?.error?.message ?? 'Erreur lors de la comptabilisation.')
    });
  }

  supprimer(fp: PayeResponse) {
    if (!confirm(`Supprimer la paie de ${fp.moisLibelle} ${fp.exercice} ?`)) return;
    this.payeSvc.supprimer(fp.id).subscribe({
      next: () => this.feuilles.update(list => list.filter(f => f.id !== fp.id)),
      error: (err: any) => alert(err?.error?.message ?? 'Erreur lors de la suppression.')
    });
  }

  annuler() { this.formOpen.set(false); this.formError.set(null); }

  private emptyForm(): SauvegarderPayeRequest {
    return {
      mois: new Date().getMonth() + 1,
      nbSalaries: 0,
      masseSalarialeBrute: 0,
      cotisationsSalariales: 0,
      cotisationsPatronales: 0,
      impotRetenu: 0
    };
  }
}
