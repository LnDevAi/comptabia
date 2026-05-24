import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalytiqueService } from '../../core/services/analytique.service';
import { AxeAnalytique, RapportAnalytique } from '../../core/models/analytique.model';

type Onglet = 'axes' | 'rapport';

@Component({
  selector: 'app-analytique',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Comptabilité analytique</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Axes d'analyse (centres de coût / projets) et rapport par axe
    </p>
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
    <button (click)="onglet.set('axes')"
            [class]="onglet() === 'axes'
              ? 'px-4 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm'
              : 'px-4 py-1.5 rounded-lg text-gray-500 text-sm hover:text-gray-700'">
      Axes analytiques
    </button>
    <button (click)="onglet.set('rapport')"
            [class]="onglet() === 'rapport'
              ? 'px-4 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm'
              : 'px-4 py-1.5 rounded-lg text-gray-500 text-sm hover:text-gray-700'">
      Rapport analytique
    </button>
  </div>

  <!-- ═══ ONGLET AXES ═══ -->
  @if (onglet() === 'axes') {

  <!-- Formulaire création -->
  <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
    <h2 class="text-sm font-semibold text-gray-700">Nouvel axe analytique</h2>
    <div class="flex flex-wrap gap-3 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Code</label>
        <input [(ngModel)]="formCode" type="text" placeholder="ex: PROD" maxlength="20"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
      </div>
      <div class="flex-1 min-w-[200px]">
        <label class="block text-xs text-gray-500 mb-1">Intitulé</label>
        <input [(ngModel)]="formIntitule" type="text" placeholder="ex: Production"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="creer()" [disabled]="saving() || !formCode.trim() || !formIntitule.trim()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ saving() ? 'Enregistrement…' : 'Ajouter' }}
      </button>
    </div>
    @if (formError()) {
      <p class="text-sm text-red-600">{{ formError() }}</p>
    }
  </div>

  <!-- Liste des axes -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (axes().length === 0) {
      <div class="flex items-center justify-center h-24 text-gray-400 text-sm">
        Aucun axe analytique défini.
      </div>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intitulé</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (a of axes(); track a.id) {
          <tr class="hover:bg-gray-50">
            @if (editing() === a.id) {
              <td class="px-4 py-2" colspan="2">
                <div class="flex gap-2 items-center">
                  <input [(ngModel)]="editCode" maxlength="20"
                         class="border border-gray-300 rounded px-2 py-1 text-sm w-24 uppercase" />
                  <input [(ngModel)]="editIntitule"
                         class="border border-gray-300 rounded px-2 py-1 text-sm flex-1" />
                  <button (click)="sauvegarder(a.id)"
                          class="text-xs px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Sauver
                  </button>
                  <button (click)="editing.set(null)"
                          class="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50">
                    Annuler
                  </button>
                </div>
              </td>
              <td></td><td></td>
            } @else {
              <td class="px-4 py-3 font-mono font-bold text-gray-700">{{ a.code }}</td>
              <td class="px-4 py-3 text-gray-700">{{ a.intitule }}</td>
              <td class="px-4 py-3">
                <button (click)="toggleActif(a)"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer"
                        [ngClass]="a.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'">
                  {{ a.actif ? 'Actif' : 'Inactif' }}
                </button>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-2">
                  <button (click)="startEdit(a)"
                          class="text-xs text-blue-600 hover:underline">Modifier</button>
                  <button (click)="supprimer(a.id)"
                          class="text-xs text-red-500 hover:underline">Supprimer</button>
                </div>
              </td>
            }
          </tr>
          }
        </tbody>
      </table>
    }
  </div>

  }

  <!-- ═══ ONGLET RAPPORT ═══ -->
  @if (onglet() === 'rapport') {

  <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
    <h2 class="text-sm font-semibold text-gray-700">Paramètres du rapport</h2>
    <div class="flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Début</label>
        <input [(ngModel)]="rapDebut" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Fin</label>
        <input [(ngModel)]="rapFin" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="chargerRapport()"
              [disabled]="loadingRap() || !rapDebut || !rapFin"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ loadingRap() ? 'Calcul…' : 'Générer' }}
      </button>
    </div>
    @if (rapError()) {
      <p class="text-sm text-red-600">{{ rapError() }}</p>
    }
  </div>

  @if (rapport()) {
    @if (rapport()!.axes.length === 0) {
      <div class="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-24 text-gray-400 text-sm">
        Aucune ligne ventilée sur cette période.
      </div>
    } @else {
      @for (axe of rapport()!.axes; track axe.axeId) {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <!-- En-tête axe -->
        <div class="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
              {{ axe.axeCode }}
            </span>
            <span class="font-medium text-gray-700 text-sm">{{ axe.axeIntitule }}</span>
          </div>
          <div class="flex gap-6 text-xs font-mono">
            <span class="text-red-600">Débit : {{ axe.totalDebit | number:'1.2-2' }}</span>
            <span class="text-green-600">Crédit : {{ axe.totalCredit | number:'1.2-2' }}</span>
            <span class="font-bold" [ngClass]="axe.solde >= 0 ? 'text-gray-800' : 'text-purple-700'">
              Solde : {{ axe.solde | number:'1.2-2' }}
            </span>
          </div>
        </div>
        <!-- Détail comptes -->
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Compte</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Intitulé</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Débit</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Crédit</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Solde</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (l of axe.lignes; track l.compteNumero) {
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-2 font-mono text-gray-600 text-xs">{{ l.compteNumero }}</td>
              <td class="px-4 py-2 text-gray-600 text-xs">{{ l.compteIntitule }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs text-red-500">
                {{ l.debit > 0 ? (l.debit | number:'1.2-2') : '' }}
              </td>
              <td class="px-4 py-2 text-right font-mono text-xs text-green-600">
                {{ l.credit > 0 ? (l.credit | number:'1.2-2') : '' }}
              </td>
              <td class="px-4 py-2 text-right font-mono text-xs font-medium"
                  [ngClass]="l.solde >= 0 ? 'text-gray-700' : 'text-purple-700'">
                {{ l.solde | number:'1.2-2' }}
              </td>
            </tr>
            }
          </tbody>
        </table>
      </div>
      }
    }
  }

  }

</div>
  `,
})
export class AnalytiqueComponent implements OnInit {

  private svc = inject(AnalytiqueService);

  onglet = signal<Onglet>('axes');

  axes    = signal<AxeAnalytique[]>([]);
  saving  = signal(false);
  editing = signal<string | null>(null);
  formError = signal<string | null>(null);

  formCode    = '';
  formIntitule = '';
  editCode    = '';
  editIntitule = '';

  rapport    = signal<RapportAnalytique | null>(null);
  loadingRap = signal(false);
  rapError   = signal<string | null>(null);
  rapDebut   = '';
  rapFin     = '';

  ngOnInit() { this.chargerAxes(); }

  chargerAxes() {
    this.svc.listerAxes().subscribe({ next: list => this.axes.set(list) });
  }

  creer() {
    const code = this.formCode.trim().toUpperCase();
    const intitule = this.formIntitule.trim();
    if (!code || !intitule) return;
    this.saving.set(true); this.formError.set(null);
    this.svc.creerAxe(code, intitule).subscribe({
      next: a => {
        this.axes.update(list => [...list, a].sort((x, y) => x.code.localeCompare(y.code)));
        this.formCode = ''; this.formIntitule = '';
        this.saving.set(false);
      },
      error: e => { this.formError.set(e?.error?.message ?? 'Erreur.'); this.saving.set(false); },
    });
  }

  startEdit(a: AxeAnalytique) {
    this.editing.set(a.id);
    this.editCode = a.code;
    this.editIntitule = a.intitule;
  }

  sauvegarder(id: string) {
    this.svc.modifierAxe(id, this.editCode.toUpperCase(), this.editIntitule).subscribe({
      next: updated => {
        this.axes.update(list => list.map(a => a.id === id ? updated : a));
        this.editing.set(null);
      },
      error: e => this.formError.set(e?.error?.message ?? 'Erreur.'),
    });
  }

  toggleActif(a: AxeAnalytique) {
    this.svc.toggleActif(a.id).subscribe({
      next: () => this.axes.update(list =>
        list.map(x => x.id === a.id ? { ...x, actif: !x.actif } : x)),
    });
  }

  supprimer(id: string) {
    this.svc.supprimerAxe(id).subscribe({
      next: () => this.axes.update(list => list.filter(a => a.id !== id)),
      error: e => this.formError.set(e?.error?.message ?? 'Erreur.'),
    });
  }

  chargerRapport() {
    if (!this.rapDebut || !this.rapFin) return;
    this.loadingRap.set(true); this.rapError.set(null);
    this.svc.rapport(this.rapDebut, this.rapFin).subscribe({
      next: r  => { this.rapport.set(r); this.loadingRap.set(false); },
      error: e => { this.rapError.set(e?.error?.message ?? 'Erreur.'); this.loadingRap.set(false); },
    });
  }
}
