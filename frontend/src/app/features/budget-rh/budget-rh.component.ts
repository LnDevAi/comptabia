import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BudgetRhService } from '../../core/services/budget-rh.service';
import {
  ComparatifRh, LigneBudgetRh, CategorieRh,
  CATEGORIES_RH, MOIS_LABELS, BudgetRhUpsertRequest
} from '../../core/models/budget-rh.model';

interface AddForm {
  categorie: CategorieRh;
  mois: number;
  montant: string;
}

@Component({
  selector: 'app-budget-rh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-6xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Budget RH</h1>
      <p class="text-sm text-gray-500 mt-0.5">Prévisionnel de masse salariale et charges sociales vs réalisé (fiches de paie)</p>
    </div>
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600">Exercice</label>
      <select [(ngModel)]="selectedExercice" (ngModelChange)="onExerciceChange($event)"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of exercices(); track y) {
          <option [value]="y">{{ y }}</option>
        }
      </select>
    </div>
  </div>

  <!-- KPI cards -->
  @if (data()) {
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Budget total</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ data()!.totalBudget | number:'1.0-0' }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Réalisé (fiches de paie)</p>
      <p class="text-2xl font-bold mt-1"
         [ngClass]="data()!.totalRealise > data()!.totalBudget ? 'text-red-600' : 'text-blue-700'">
        {{ data()!.totalRealise | number:'1.0-0' }}
      </p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Marge budgétaire</p>
      <p class="text-2xl font-bold mt-1"
         [ngClass]="data()!.totalEcart >= 0 ? 'text-green-600' : 'text-red-600'">
        {{ data()!.totalEcart | number:'1.0-0' }}
      </p>
    </div>
  </div>

  <!-- Barre globale -->
  @if (data()!.totalBudget > 0) {
  <div class="bg-white rounded-xl border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-2">
      <span class="text-sm font-medium text-gray-700">Taux d'exécution global</span>
      <span class="text-sm font-bold"
            [ngClass]="globalPct() > 100 ? 'text-red-600' : globalPct() > 80 ? 'text-orange-500' : 'text-green-600'">
        {{ globalPct() | number:'1.1-1' }} %
      </span>
    </div>
    <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
      <div class="h-3 rounded-full transition-all duration-500"
           [ngClass]="globalPct() > 100 ? 'bg-red-500' : globalPct() > 80 ? 'bg-orange-400' : 'bg-green-500'"
           [style.width.%]="globalPct() > 100 ? 100 : globalPct()"></div>
    </div>
  </div>
  }
  }

  <!-- Formulaire ajout / modification -->
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h2 class="text-sm font-semibold text-gray-700 mb-3">Ajouter / modifier une ligne</h2>
    <div class="flex flex-wrap gap-3 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Catégorie <span class="text-red-500">*</span></label>
        <select [(ngModel)]="addForm.categorie"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          @for (c of categoriesRh; track c.value) {
            <option [value]="c.value">{{ c.label }}</option>
          }
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Période</label>
        <select [(ngModel)]="addForm.mois"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          @for (m of moisOptions; track m.v) {
            <option [value]="m.v">{{ m.l }}</option>
          }
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Montant <span class="text-red-500">*</span></label>
        <input [(ngModel)]="addForm.montant" type="number" min="0" step="0.01" placeholder="0.00"
               class="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="saveLine()" [disabled]="saving()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg">
        {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
      @if (addError()) {
        <p class="text-xs text-red-600">{{ addError() }}</p>
      }
      @if (addSuccess()) {
        <p class="text-xs text-green-600">Ligne enregistrée.</p>
      }
    </div>
    <p class="text-xs text-gray-400 mt-2">
      Période "Annuel" (mois=0) compare le budget à la somme de toutes les fiches de paie de l'exercice.
    </p>
  </div>

  <!-- Tableau comparatif -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (loading()) {
      <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
    } @else if (error()) {
      <div class="flex items-center justify-center h-40 text-red-500 text-sm">{{ error() }}</div>
    } @else if (!data() || data()!.lignes.length === 0) {
      <div class="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
        <span class="text-3xl">💼</span>
        <span>Aucune ligne budgétaire RH pour {{ selectedExercice }}.</span>
      </div>
    } @else {
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Catégorie</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Période</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Budget</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Réalisé</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Écart</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide w-48">Avancement</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        @for (l of data()!.lignes; track l.id) {
        <tr class="hover:bg-gray-50 transition-colors">
          <td class="px-4 py-3 text-gray-800 font-medium">{{ l.libelleCategorie }}</td>
          <td class="px-4 py-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  [ngClass]="l.mois === 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'">
              {{ moisLabel(l.mois) }}
            </span>
          </td>
          <td class="px-4 py-3 text-right font-mono text-gray-700">{{ l.budget | number:'1.0-0' }}</td>
          <td class="px-4 py-3 text-right font-mono"
              [ngClass]="l.realise > l.budget ? 'text-red-600 font-semibold' : 'text-gray-700'">
            {{ l.realise | number:'1.0-0' }}
          </td>
          <td class="px-4 py-3 text-right font-mono font-semibold"
              [ngClass]="l.ecart >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ l.ecart | number:'1.0-0' }}
          </td>
          <td class="px-4 py-3">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-2 rounded-full"
                     [ngClass]="barColor(l.pctConsomme)"
                     [style.width.%]="l.pctConsomme > 100 ? 100 : l.pctConsomme"></div>
              </div>
              <span class="text-xs font-medium w-12 text-right"
                    [ngClass]="l.pctConsomme > 100 ? 'text-red-600' : l.pctConsomme > 80 ? 'text-orange-500' : 'text-gray-500'">
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
    }
  </div>

</div>
  `,
})
export class BudgetRhComponent implements OnInit {

  private svc = inject(BudgetRhService);

  exercices        = signal<number[]>([]);
  selectedExercice = new Date().getFullYear();

  data    = signal<ComparatifRh | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  saving     = signal(false);
  addError   = signal<string | null>(null);
  addSuccess = signal(false);

  readonly categoriesRh = CATEGORIES_RH;
  readonly moisOptions  = Object.entries(MOIS_LABELS).map(([v, l]) => ({ v: +v, l }));

  addForm: AddForm = { categorie: 'MASSE_BRUTE', mois: 0, montant: '' };

  ngOnInit() {
    this.svc.exercices().subscribe({ next: list => {
      this.exercices.set(list);
      if (list.length > 0 && !list.includes(this.selectedExercice)) {
        this.selectedExercice = list[0];
      }
      this.loadData();
    }, error: () => this.loadData() });
  }

  onExerciceChange(y: number) {
    this.selectedExercice = +y;
    this.loadData();
  }

  loadData() {
    this.loading.set(true); this.error.set(null);
    this.svc.getComparatif(this.selectedExercice).subscribe({
      next:  d  => { this.data.set(d); this.loading.set(false); },
      error: () => { this.error.set('Erreur de chargement.'); this.loading.set(false); },
    });
  }

  saveLine() {
    if (!this.addForm.montant) {
      this.addError.set('Le montant est obligatoire.'); return;
    }
    this.saving.set(true); this.addError.set(null); this.addSuccess.set(false);
    const req: BudgetRhUpsertRequest = {
      categorie: this.addForm.categorie,
      mois: +this.addForm.mois,
      montant: parseFloat(this.addForm.montant),
    };
    this.svc.upsert(this.selectedExercice, req).subscribe({
      next: () => {
        this.saving.set(false); this.addSuccess.set(true);
        this.addForm = { categorie: 'MASSE_BRUTE', mois: 0, montant: '' };
        setTimeout(() => this.addSuccess.set(false), 3000);
        this.loadData();
      },
      error: e => { this.saving.set(false); this.addError.set(e?.error?.message ?? 'Erreur.'); },
    });
  }

  prefillEdit(l: LigneBudgetRh) {
    this.addForm = { categorie: l.categorie, mois: l.mois, montant: String(l.budget) };
    this.addError.set(null); this.addSuccess.set(false);
  }

  deleteLine(l: LigneBudgetRh) {
    if (!confirm(`Supprimer la ligne "${l.libelleCategorie}" (${this.moisLabel(l.mois)}) ?`)) return;
    this.svc.delete(l.id).subscribe({ next: () => this.loadData() });
  }

  globalPct(): number {
    const d = this.data();
    if (!d || d.totalBudget === 0) return 0;
    return (d.totalRealise / d.totalBudget) * 100;
  }

  moisLabel(mois: number): string { return MOIS_LABELS[mois] ?? String(mois); }

  barColor(pct: number): string {
    if (pct > 100) return 'bg-red-500';
    if (pct > 80)  return 'bg-orange-400';
    return 'bg-green-500';
  }
}
