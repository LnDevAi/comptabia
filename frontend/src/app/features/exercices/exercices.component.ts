import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ExerciceService } from '../../core/services/exercice.service';
import { ExerciceComptable, ClotureResponse } from '../../core/models/exercice.model';

@Component({
  selector: 'app-exercices',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe],
  template: `
<div class="p-6 max-w-4xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Exercices comptables</h1>
    <p class="text-sm text-gray-500 mt-1">
      Gérez les exercices fiscaux de votre entreprise. La clôture génère les écritures de résultat
      et verrouille l'exercice.
    </p>
  </div>

  <!-- Info banner -->
  <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
    <p class="font-semibold">Comment fonctionne la clôture SYSCOHADA ?</p>
    <p>
      La clôture génère automatiquement deux écritures OD validées :
      <span class="font-mono">CL-&#123;année&#125;-CH</span> (virement des charges vers 1301) et
      <span class="font-mono">CL-&#123;année&#125;-PR</span> (virement des produits depuis 1301).
      Le solde du compte 1301 représente le résultat net (bénéfice ou perte).
    </p>
    <p class="text-blue-600 text-xs">
      Pré-requis : toutes les écritures de l'exercice doivent être validées (aucun brouillon en attente).
    </p>
  </div>

  <!-- Exercices list -->
  @if (exercices().length > 0) {
    <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th class="px-5 py-3 text-left">Exercice</th>
            <th class="px-5 py-3 text-left">Ouverture</th>
            <th class="px-5 py-3 text-left">Clôture</th>
            <th class="px-5 py-3 text-left">Statut</th>
            <th class="px-5 py-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          @for (ex of exercices(); track ex.id) {
            <tr class="border-t border-gray-50 hover:bg-gray-50 transition-colors">
              <td class="px-5 py-4 font-bold text-gray-800 text-base">{{ ex.annee }}</td>
              <td class="px-5 py-4 text-gray-500 text-xs">{{ ex.dateOuverture | date:'dd/MM/yyyy' }}</td>
              <td class="px-5 py-4 text-gray-500 text-xs">
                {{ ex.dateCloture ? (ex.dateCloture | date:'dd/MM/yyyy') : '—' }}
              </td>
              <td class="px-5 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                      [class]="ex.statut === 'OUVERT'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'">
                  {{ ex.statut === 'OUVERT' ? 'Ouvert' : 'Clôturé' }}
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                @if (ex.statut === 'OUVERT') {
                  @if (confirming() === ex.annee) {
                    <div class="flex items-center gap-2 justify-center">
                      <span class="text-xs text-red-600 font-medium">Confirmer la clôture ?</span>
                      <button (click)="confirmerCloture(ex.annee)"
                              [disabled]="cloturing()"
                              class="text-xs px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {{ cloturing() ? '…' : 'Oui, clôturer' }}
                      </button>
                      <button (click)="confirming.set(null)"
                              class="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
                        Annuler
                      </button>
                    </div>
                  } @else {
                    <button (click)="confirming.set(ex.annee)"
                            class="text-xs px-3 py-1.5 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                      Clôturer l'exercice
                    </button>
                  }
                } @else {
                  <span class="text-xs text-gray-300">—</span>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  } @else {
    <div class="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
      Chargement des exercices…
    </div>
  }

  <!-- Error -->
  @if (error()) {
    <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
      {{ error() }}
    </div>
  }

  <!-- Clôture result -->
  @if (clotureResult()) {
    <div class="bg-white rounded-2xl border border-green-300 p-6 space-y-4">
      <div class="flex items-center gap-2">
        <span class="text-green-600 text-xl">✓</span>
        <h3 class="font-semibold text-gray-800">Exercice {{ clotureResult()!.annee }} clôturé</h3>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="bg-gray-50 rounded-xl p-4 text-center">
          <div class="text-xs text-gray-400 mb-1">Total charges</div>
          <div class="font-bold font-mono text-gray-800">
            {{ clotureResult()!.totalCharges | number:'1.2-2' }}
          </div>
        </div>
        <div class="bg-gray-50 rounded-xl p-4 text-center">
          <div class="text-xs text-gray-400 mb-1">Total produits</div>
          <div class="font-bold font-mono text-gray-800">
            {{ clotureResult()!.totalProduits | number:'1.2-2' }}
          </div>
        </div>
        <div class="rounded-xl p-4 text-center"
             [class]="clotureResult()!.resultatNet >= 0 ? 'bg-green-50' : 'bg-red-50'">
          <div class="text-xs mb-1"
               [class]="clotureResult()!.resultatNet >= 0 ? 'text-green-500' : 'text-red-400'">
            {{ clotureResult()!.resultatNet >= 0 ? 'Bénéfice net' : 'Perte nette' }}
          </div>
          <div class="font-bold font-mono text-lg"
               [class]="clotureResult()!.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'">
            {{ (clotureResult()!.resultatNet < 0 ? -clotureResult()!.resultatNet : clotureResult()!.resultatNet) | number:'1.2-2' }}
          </div>
        </div>
      </div>

      <p class="text-xs text-gray-500">
        Les écritures de clôture <span class="font-mono">CL-{{ clotureResult()!.annee }}-CH</span> et
        <span class="font-mono">CL-{{ clotureResult()!.annee }}-PR</span> ont été créées en statut Validée
        dans le journal OD. Le compte 1301 reflète désormais le résultat net de l'exercice.
      </p>
    </div>
  }

</div>
  `
})
export class ExercicesComponent implements OnInit {
  private svc = inject(ExerciceService);

  exercices     = signal<ExerciceComptable[]>([]);
  confirming    = signal<number | null>(null);
  cloturing     = signal(false);
  error         = signal<string | null>(null);
  clotureResult = signal<ClotureResponse | null>(null);

  ngOnInit() {
    this.svc.lister().subscribe({
      next: list => this.exercices.set(list),
      error: () => this.error.set('Erreur lors du chargement des exercices.')
    });
  }

  confirmerCloture(annee: number) {
    this.error.set(null);
    this.clotureResult.set(null);
    this.cloturing.set(true);
    this.svc.cloturer(annee).subscribe({
      next: res => {
        this.clotureResult.set(res);
        this.exercices.update(list =>
          list.map(ex => ex.annee === annee
            ? { ...ex, statut: 'CLOTURE' as const, dateCloture: res.dateCloture }
            : ex));
        this.confirming.set(null);
        this.cloturing.set(false);
      },
      error: (err: any) => {
        this.error.set(err?.error?.message ?? `Erreur lors de la clôture de l'exercice ${annee}.`);
        this.confirming.set(null);
        this.cloturing.set(false);
      }
    });
  }
}
