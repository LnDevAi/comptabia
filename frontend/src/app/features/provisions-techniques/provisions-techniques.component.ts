import {
  ChangeDetectionStrategy, Component, OnInit, signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProvisionTechniqueService } from '../../core/services/provision-technique.service';
import {
  ProvisionTechniqueResponse,
  ProvisionDashboard,
  TYPES_PROVISION,
  TypeProvision,
  Branche
} from '../../core/models/provision-technique.model';

@Component({
  selector: 'app-provisions-techniques',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Provisions techniques CIMA</h1>
          <p class="text-sm text-gray-500 mt-0.5">
            Suivi des provisions réglementaires — Code CIMA
          </p>
        </div>
        <div class="flex items-center gap-3">
          <select [value]="exerciceSelectionne" (change)="onExerciceChange(+$any($event.target).value)"
                  class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none">
            @for (y of exercices; track y) {
              <option [value]="y">{{ y }}</option>
            }
          </select>
          <button (click)="openCreate()"
                  class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium
                         px-4 py-2 rounded-lg transition">
            + Nouvelle provision
          </button>
        </div>
      </div>

      <!-- Dashboard prudentiel -->
      @if (dashboard()) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p class="text-xs text-gray-500">Total provisions techniques</p>
            <p class="text-lg font-bold text-gray-900">
              {{ dashboard()!.totalProvisionsTechniques | number:'1.0-0' }}
            </p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p class="text-xs text-gray-500">Total placements</p>
            <p class="text-lg font-bold text-gray-900">
              {{ dashboard()!.totalPlacements | number:'1.0-0' }}
            </p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p class="text-xs text-gray-500">Primes acquises</p>
            <p class="text-lg font-bold text-gray-900">
              {{ dashboard()!.primesAcquises | number:'1.0-0' }}
            </p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-4 space-y-1">
            <p class="text-xs text-gray-500">Sinistres payés</p>
            <p class="text-lg font-bold text-gray-900">
              {{ dashboard()!.sinistresPayes | number:'1.0-0' }}
            </p>
          </div>
        </div>

        <!-- Ratios prudentiels -->
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h2 class="text-sm font-semibold text-gray-700 mb-4">Ratios prudentiels CIMA</h2>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">

            <div class="space-y-1 text-center">
              <p class="text-xs text-gray-500">Couverture provisions</p>
              <p class="text-xl font-bold" [class]="ratioColor(dashboard()!.ratioCouvertureProvisions, 100, true)">
                {{ dashboard()!.ratioCouvertureProvisions | number:'1.1-1' }}%
              </p>
              <p class="text-xs text-gray-400">Seuil ≥ 100%</p>
            </div>

            <div class="space-y-1 text-center">
              <p class="text-xs text-gray-500">Marge de solvabilité</p>
              <p class="text-xl font-bold" [class]="ratioColor(dashboard()!.ratioMargeSolvabilite, 20, true)">
                {{ dashboard()!.ratioMargeSolvabilite | number:'1.1-1' }}%
              </p>
              <p class="text-xs text-gray-400">Seuil ≥ 20%</p>
            </div>

            <div class="space-y-1 text-center">
              <p class="text-xs text-gray-500">Taux de sinistralité</p>
              <p class="text-xl font-bold" [class]="ratioColor(dashboard()!.ratioSinistralite, 70, false)">
                {{ dashboard()!.ratioSinistralite | number:'1.1-1' }}%
              </p>
              <p class="text-xs text-gray-400">Seuil ≤ 70%</p>
            </div>

            <div class="space-y-1 text-center">
              <p class="text-xs text-gray-500">Taux de frais</p>
              <p class="text-xl font-bold" [class]="ratioColor(dashboard()!.ratioFrais, 30, false)">
                {{ dashboard()!.ratioFrais | number:'1.1-1' }}%
              </p>
              <p class="text-xs text-gray-400">Seuil ≤ 30%</p>
            </div>

            <div class="space-y-1 text-center">
              <p class="text-xs text-gray-500">Ratio combiné</p>
              <p class="text-xl font-bold" [class]="ratioColor(dashboard()!.ratioCombinaison, 100, false)">
                {{ dashboard()!.ratioCombinaison | number:'1.1-1' }}%
              </p>
              <p class="text-xs text-gray-400">Seuil ≤ 100%</p>
            </div>
          </div>
        </div>
      }

      <!-- Table provisions -->
      @if (loading()) {
        <div class="text-center py-8 text-gray-400 text-sm">Chargement…</div>
      } @else if (provisions().length === 0) {
        <div class="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
          <p class="text-gray-400 text-sm">Aucune provision enregistrée pour cet exercice</p>
        </div>
      } @else {
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type de provision</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Branche</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Exercice</th>
                <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date calcul</th>
                <th class="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (p of provisions(); track p.id) {
                <tr class="hover:bg-gray-50 transition">
                  <td class="px-4 py-3 font-medium text-gray-900 text-xs">{{ p.typeLabel }}</td>
                  <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                          [class]="brancheClass(p.branche)">
                      {{ p.branche }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-gray-600">{{ p.exercice }}</td>
                  <td class="px-4 py-3 text-gray-500 text-xs">{{ p.dateCalcul }}</td>
                  <td class="px-4 py-3 text-right font-semibold text-gray-900">
                    {{ p.montant | number:'1.2-2' }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <button (click)="openEdit(p)"
                              class="text-xs text-gray-500 hover:text-blue-600 transition">
                        Modifier
                      </button>
                      <button (click)="confirmDelete(p)"
                              class="text-xs text-red-400 hover:text-red-600 transition">
                        Suppr.
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Create / Edit modal -->
    @if (showModal()) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
             (click)="$event.stopPropagation()">
          <h2 class="text-base font-bold text-gray-900">
            {{ editingId() ? 'Modifier la provision' : 'Nouvelle provision technique' }}
          </h2>

          <form [formGroup]="form" (ngSubmit)="save()" class="space-y-3">

            @if (!editingId()) {
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Type *</label>
                <select formControlName="typeProvision"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Choisir --</option>
                  @for (t of typesProvision; track t.value) {
                    <option [value]="t.value">{{ t.label }}</option>
                  }
                </select>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Branche *</label>
                  <select formControlName="branche"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white
                                 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="NON_VIE">Non-Vie</option>
                    <option value="VIE">Vie</option>
                    <option value="MIXTE">Mixte</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 mb-1">Exercice *</label>
                  <input type="number" formControlName="exercice"
                         class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            }

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Date de calcul *</label>
                <input type="date" formControlName="dateCalcul"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 mb-1">Montant *</label>
                <input type="number" formControlName="montant" step="0.01" min="0"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <textarea formControlName="notes" rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none
                               focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>

            @if (formError()) {
              <p class="text-xs text-red-600">{{ formError() }}</p>
            }

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="closeModal()"
                      class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</button>
              <button type="submit" [disabled]="form.invalid || saving()"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- Delete confirm -->
    @if (deletingItem()) {
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
          <h2 class="text-base font-bold text-gray-900">Supprimer la provision ?</h2>
          <p class="text-sm text-gray-600">{{ deletingItem()!.typeLabel }} — {{ deletingItem()!.exercice }}</p>
          <div class="flex justify-end gap-3">
            <button (click)="deletingItem.set(null)"
                    class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">Annuler</button>
            <button (click)="deleteConfirmed()"
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">
              Supprimer
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ProvisionsTechniquesComponent implements OnInit {

  provisions    = signal<ProvisionTechniqueResponse[]>([]);
  dashboard     = signal<ProvisionDashboard | null>(null);
  loading       = signal(true);
  showModal     = signal(false);
  editingId     = signal<string | null>(null);
  saving        = signal(false);
  formError     = signal('');
  deletingItem  = signal<ProvisionTechniqueResponse | null>(null);

  exerciceSelectionne = new Date().getFullYear();
  exercices = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  typesProvision = TYPES_PROVISION;

  form = this.fb.nonNullable.group({
    typeProvision: ['', Validators.required],
    branche:       ['NON_VIE' as Branche],
    exercice:      [new Date().getFullYear(), Validators.required],
    dateCalcul:    ['', Validators.required],
    montant:       [0, [Validators.required, Validators.min(0)]],
    notes:         [''],
  });

  // ngModel requires FormsModule — workaround: use signal
  private _exercice = new Date().getFullYear();
  get exerciceModel() { return this._exercice; }
  set exerciceModel(v: number) { this._exercice = v; this.charger(); }

  constructor(
    private fb:  FormBuilder,
    private svc: ProvisionTechniqueService
  ) {}

  ngOnInit() {
    this.charger();
  }

  onExerciceChange(v: number) {
    this.exerciceSelectionne = +v;
    this.charger();
  }

  charger() {
    this.loading.set(true);
    this.svc.listerParExercice(this.exerciceSelectionne).subscribe({
      next: list => { this.provisions.set(list); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
    this.svc.getDashboard(this.exerciceSelectionne).subscribe({
      next: d => this.dashboard.set(d),
      error: () => {}
    });
  }

  openCreate() {
    this.editingId.set(null);
    this.form.reset({
      typeProvision: '',
      branche:   'NON_VIE' as Branche,
      exercice:  this.exerciceSelectionne,
      dateCalcul: '',
      montant:   0,
      notes:     ''
    });
    this.form.get('typeProvision')!.setValidators(Validators.required);
    this.form.get('typeProvision')!.updateValueAndValidity();
    this.formError.set('');
    this.showModal.set(true);
  }

  openEdit(p: ProvisionTechniqueResponse) {
    this.editingId.set(p.id);
    this.form.get('typeProvision')!.clearValidators();
    this.form.get('typeProvision')!.updateValueAndValidity();
    this.form.patchValue({
      dateCalcul: p.dateCalcul,
      montant:    p.montant,
      notes:      p.notes ?? ''
    });
    this.formError.set('');
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.editingId.set(null); }

  save() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    const v  = this.form.getRawValue();
    const id = this.editingId();

    if (id) {
      this.svc.mettrAJour(id, {
        montant:    v.montant    || undefined,
        dateCalcul: v.dateCalcul || undefined,
        notes:      v.notes      || undefined,
      }).subscribe({
        next: updated => {
          this.provisions.update(list => list.map(p => p.id === id ? updated : p));
          this.saving.set(false); this.closeModal();
          this.refreshDashboard();
        },
        error: e => { this.formError.set(e?.error?.detail ?? 'Erreur'); this.saving.set(false); }
      });
    } else {
      this.svc.creer({
        typeProvision: v.typeProvision as TypeProvision,
        branche:       v.branche as Branche,
        exercice:      v.exercice,
        dateCalcul:    v.dateCalcul,
        montant:       v.montant,
        notes:         v.notes || undefined,
      }).subscribe({
        next: created => {
          this.provisions.update(list => [created, ...list]);
          this.saving.set(false); this.closeModal();
          this.refreshDashboard();
        },
        error: e => { this.formError.set(e?.error?.detail ?? 'Erreur'); this.saving.set(false); }
      });
    }
  }

  confirmDelete(p: ProvisionTechniqueResponse) { this.deletingItem.set(p); }

  deleteConfirmed() {
    const p = this.deletingItem();
    if (!p) return;
    this.svc.supprimer(p.id).subscribe({
      next: () => {
        this.provisions.update(list => list.filter(x => x.id !== p.id));
        this.deletingItem.set(null);
        this.refreshDashboard();
      },
      error: () => this.deletingItem.set(null)
    });
  }

  private refreshDashboard() {
    this.svc.getDashboard(this.exerciceSelectionne).subscribe(d => this.dashboard.set(d));
  }

  ratioColor(value: number, threshold: number, higherIsBetter: boolean): string {
    const ok = higherIsBetter ? value >= threshold : value <= threshold;
    return ok ? 'text-green-600' : 'text-red-600';
  }

  brancheClass(b: Branche): string {
    switch (b) {
      case 'VIE':     return 'bg-purple-100 text-purple-700';
      case 'NON_VIE': return 'bg-blue-100 text-blue-700';
      case 'MIXTE':   return 'bg-gray-100 text-gray-600';
    }
  }
}
