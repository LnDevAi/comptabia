import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeclarationIsService } from '../../core/services/declaration-is.service';
import { DeclarationIs } from '../../core/models/declaration-is.model';

@Component({
  selector: 'app-declaration-is',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-4xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Déclaration IS — Impôt sur les Sociétés</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Calcul du résultat fiscal et génération de l'écriture comptable (DR 8951 / CR 4410)
    </p>
  </div>

  <!-- Sélecteur exercice + liste historique -->
  <div class="flex gap-4 items-start">

    <!-- Panneau gauche : liste -->
    <div class="w-40 shrink-0 space-y-1">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Exercices</p>
      @for (d of historique(); track d.exercice) {
        <button (click)="selectionner(d.exercice)"
                class="w-full text-left px-3 py-2 rounded-lg text-sm transition"
                [ngClass]="exercice() === d.exercice
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-gray-600 hover:bg-gray-100'">
          {{ d.exercice }}
          <span class="ml-1 text-xs"
                [ngClass]="d.statut === 'VALIDEE'
                  ? (exercice() === d.exercice ? 'text-blue-200' : 'text-green-600')
                  : (exercice() === d.exercice ? 'text-blue-200' : 'text-gray-400')">
            {{ d.statut === 'VALIDEE' ? '✓' : '◌' }}
          </span>
        </button>
      }
      <button (click)="nouvelExercice()"
              class="w-full text-left px-3 py-2 rounded-lg text-sm text-blue-600 hover:bg-blue-50 font-medium">
        + Nouvel exercice
      </button>
    </div>

    <!-- Panneau droit : formulaire -->
    <div class="flex-1 space-y-4">

      @if (!decl()) {
        <!-- Saisie rapide exercice -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm text-gray-500 mb-3">Charger un exercice :</p>
          <div class="flex gap-3 items-center">
            <input type="number" [(ngModel)]="anneeInput" name="annee"
                   [min]="2020" [max]="anneeMax"
                   class="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button (click)="charger(anneeInput)"
                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
              Charger
            </button>
          </div>
        </div>
      }

      @if (decl()) {
        <!-- Résultat comptable -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <h2 class="text-sm font-semibold text-gray-700">Résultat de l'exercice {{ exercice() }}</h2>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-400 mb-1">Résultat comptable</p>
              <p class="text-lg font-bold"
                 [ngClass]="(decl()!.resultatComptable ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'">
                {{ decl()!.resultatComptable | number:'1.2-2' }}
              </p>
            </div>
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-xs text-gray-400 mb-1">Résultat fiscal</p>
              <p class="text-lg font-bold"
                 [ngClass]="(decl()!.resultatFiscal ?? 0) >= 0 ? 'text-blue-700' : 'text-orange-600'">
                {{ decl()!.resultatFiscal | number:'1.2-2' }}
              </p>
            </div>
            <div class="bg-blue-50 rounded-lg p-3">
              <p class="text-xs text-blue-400 mb-1">IS dû</p>
              <p class="text-lg font-bold text-blue-700">
                {{ decl()!.isDu | number:'1.2-2' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Ajustements fiscaux -->
        @if (decl()!.statut === 'BROUILLON') {
          <form (ngSubmit)="sauvegarder()" class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h2 class="text-sm font-semibold text-gray-700">Ajustements fiscaux</h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Réintégrations (charges non déductibles)</label>
                <input [(ngModel)]="form.reintagrations" name="reintagrations"
                       type="number" min="0" step="0.01"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p class="text-xs text-gray-400 mt-1">Ex. amortissements excédentaires, amendes, dépenses somptuaires</p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Déductions (revenus exonérés)</label>
                <input [(ngModel)]="form.deductions" name="deductions"
                       type="number" min="0" step="0.01"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p class="text-xs text-gray-400 mt-1">Ex. dividendes exonérés, plus-values exonérées</p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Taux IS (%)</label>
                <input [(ngModel)]="form.tauxIs" name="tauxIs"
                       type="number" min="0" max="50" step="0.01"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p class="text-xs text-gray-400 mt-1">25% UEMOA · 28% CEMAC · 30% Maroc</p>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Minimum forfaitaire</label>
                <input [(ngModel)]="form.minimumForfaitaire" name="minimumForfaitaire"
                       type="number" min="0" step="0.01"
                       class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p class="text-xs text-gray-400 mt-1">Pré-calculé : 0,5% du CA. Modifiable.</p>
              </div>
            </div>

            @if (error()) {
              <p class="text-sm text-red-600">{{ error() }}</p>
            }

            <div class="flex justify-end gap-3 pt-2">
              <button type="submit" [disabled]="saving()"
                      class="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
                {{ saving() ? 'Calcul…' : 'Recalculer & sauvegarder' }}
              </button>
            </div>
          </form>
        }

        <!-- Détail calcul -->
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-2 text-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Détail du calcul</h2>
          <div class="flex justify-between py-1.5 border-b border-gray-50">
            <span class="text-gray-500">Résultat comptable (compte 1301)</span>
            <span class="font-medium">{{ decl()!.resultatComptable | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-gray-50">
            <span class="text-gray-500">+ Réintégrations</span>
            <span class="font-medium text-orange-600">+ {{ decl()!.reintagrations | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-gray-50">
            <span class="text-gray-500">− Déductions</span>
            <span class="font-medium text-green-600">− {{ decl()!.deductions | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-gray-100 font-semibold">
            <span>= Résultat fiscal</span>
            <span>{{ decl()!.resultatFiscal | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-gray-50">
            <span class="text-gray-500">IS théorique ({{ decl()!.tauxIs }}%)</span>
            <span class="font-medium">{{ decl()!.isTheorique | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between py-1.5 border-b border-gray-50">
            <span class="text-gray-500">Minimum forfaitaire (0,5% CA)</span>
            <span class="font-medium">{{ decl()!.minimumForfaitaire | number:'1.2-2' }}</span>
          </div>
          <div class="flex justify-between py-1.5 font-bold text-blue-700">
            <span>IS dû = max(IS théorique, minimum forfaitaire)</span>
            <span>{{ decl()!.isDu | number:'1.2-2' }}</span>
          </div>
        </div>

        <!-- Validation -->
        @if (decl()!.statut === 'BROUILLON') {
          <div class="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
            <p class="text-sm text-amber-800">
              La validation génère l'écriture OD <strong>IS-{{ exercice() }}</strong> :
              DR 8951 (Impôt sur le bénéfice) / CR 4410 (IS à payer) pour
              <strong>{{ decl()!.isDu | number:'1.2-2' }}</strong>.
              Cette opération est irréversible.
            </p>
            <button (click)="valider()" [disabled]="saving()"
                    class="px-5 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
              {{ saving() ? 'Validation…' : 'Valider la déclaration IS' }}
            </button>
          </div>
        }

        @if (decl()!.statut === 'VALIDEE') {
          <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            Déclaration IS {{ exercice() }} validée — OD IS-{{ exercice() }} enregistrée.
          </div>
        }
      }
    </div>
  </div>

</div>
  `
})
export class DeclarationIsComponent implements OnInit {

  private svc = inject(DeclarationIsService);

  historique = signal<DeclarationIs[]>([]);
  decl       = signal<DeclarationIs | null>(null);
  exercice   = signal<number>(new Date().getFullYear() - 1);
  saving     = signal(false);
  error      = signal<string | null>(null);

  anneeInput = new Date().getFullYear() - 1;
  anneeMax   = new Date().getFullYear();

  form = { reintagrations: 0, deductions: 0, tauxIs: 25, minimumForfaitaire: 0 };

  ngOnInit() {
    this.svc.lister().subscribe({ next: h => this.historique.set(h) });
    this.charger(this.exercice());
  }

  charger(annee: number) {
    this.exercice.set(annee);
    this.decl.set(null);
    this.error.set(null);
    this.svc.getOrCompute(annee).subscribe({
      next: d => {
        this.decl.set(d);
        this.form = {
          reintagrations: d.reintagrations,
          deductions: d.deductions,
          tauxIs: d.tauxIs,
          minimumForfaitaire: d.minimumForfaitaire
        };
      },
      error: e => this.error.set(e?.error?.message ?? 'Exercice introuvable.')
    });
  }

  selectionner(annee: number) { this.charger(annee); }

  nouvelExercice() {
    this.decl.set(null);
    this.anneeInput = new Date().getFullYear() - 1;
  }

  sauvegarder() {
    this.saving.set(true);
    this.error.set(null);
    this.svc.sauvegarder(this.exercice(), this.form).subscribe({
      next: d => {
        this.decl.set(d);
        this.saving.set(false);
        this.svc.lister().subscribe({ next: h => this.historique.set(h) });
      },
      error: e => {
        this.error.set(e?.error?.message ?? 'Erreur lors de la sauvegarde.');
        this.saving.set(false);
      }
    });
  }

  valider() {
    this.saving.set(true);
    this.error.set(null);
    this.svc.valider(this.exercice()).subscribe({
      next: d => {
        this.decl.set(d);
        this.saving.set(false);
        this.svc.lister().subscribe({ next: h => this.historique.set(h) });
      },
      error: e => {
        this.error.set(e?.error?.message ?? 'Erreur lors de la validation.');
        this.saving.set(false);
      }
    });
  }
}
