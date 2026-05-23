import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { EcritureService } from '../../core/services/ecriture.service';
import { CompteService } from '../../core/services/compte.service';
import { Ecriture, Journal } from '../../core/models/ecriture.model';
import { Compte } from '../../core/models/compte.model';

const JOURNALS: { value: Journal; label: string }[] = [
  { value: 'AC', label: 'Achats (AC)' },
  { value: 'BQ', label: 'Banque (BQ)' },
  { value: 'OD', label: 'Opérations diverses (OD)' },
  { value: 'VT', label: 'Ventes (VT)' },
];

@Component({
  selector: 'app-ecritures',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">Écritures comptables</h2>
        <button (click)="showForm.set(!showForm())"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium rounded-lg transition">
          + Nouvelle écriture
        </button>
      </div>

      <!-- New entry form -->
      @if (showForm()) {
        <div class="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h3 class="text-sm font-semibold text-gray-700">Nouvelle écriture</h3>
          <form [formGroup]="form" (ngSubmit)="submitEcriture()">
            <!-- Header fields -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label class="block text-xs text-gray-600 mb-1">N° pièce</label>
                <input type="text" formControlName="numeroPiece"
                       class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Date</label>
                <input type="date" formControlName="dateEcriture"
                       class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Journal</label>
                <select formControlName="journal"
                        class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500">
                  @for (j of journals; track j.value) {
                    <option [value]="j.value">{{ j.label }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Libellé</label>
                <input type="text" formControlName="libelle"
                       class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <!-- Lines -->
            <div class="border border-gray-200 rounded-lg overflow-hidden mb-3">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th class="px-3 py-2 text-left">Compte</th>
                    <th class="px-3 py-2 text-left">Libellé ligne</th>
                    <th class="px-3 py-2 text-right">Débit</th>
                    <th class="px-3 py-2 text-right">Crédit</th>
                    <th class="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody formArrayName="lignes">
                  @for (ligne of lignesArray.controls; track $index; let i = $index) {
                    <tr [formGroupName]="i" class="border-t border-gray-100">
                      <td class="px-3 py-2">
                        <select formControlName="compteId"
                                class="w-full px-2 py-1 border border-gray-300 rounded text-xs
                                       focus:outline-none focus:ring-1 focus:ring-blue-500">
                          <option value="">-- Compte --</option>
                          @for (c of comptes(); track c.id) {
                            <option [value]="c.id">{{ c.numero }} - {{ c.intitule }}</option>
                          }
                        </select>
                      </td>
                      <td class="px-3 py-2">
                        <input type="text" formControlName="libelle" placeholder="Libellé"
                               class="w-full px-2 py-1 border border-gray-300 rounded text-xs
                                      focus:outline-none focus:ring-1 focus:ring-blue-500">
                      </td>
                      <td class="px-3 py-2">
                        <input type="number" formControlName="debit" min="0" step="0.01"
                               class="w-24 px-2 py-1 border border-gray-300 rounded text-xs text-right
                                      focus:outline-none focus:ring-1 focus:ring-blue-500">
                      </td>
                      <td class="px-3 py-2">
                        <input type="number" formControlName="credit" min="0" step="0.01"
                               class="w-24 px-2 py-1 border border-gray-300 rounded text-xs text-right
                                      focus:outline-none focus:ring-1 focus:ring-blue-500">
                      </td>
                      <td class="px-3 py-2">
                        <button type="button" (click)="removeLigne(i)"
                                class="text-red-400 hover:text-red-600 text-xs">✕</button>
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-gray-50 text-xs font-semibold">
                  <tr>
                    <td colspan="2" class="px-3 py-2 text-gray-500">Totaux</td>
                    <td class="px-3 py-2 text-right" [class]="isBalanced() ? 'text-green-700' : 'text-red-600'">
                      {{ totalDebit() | number:'1.2-2' }}
                    </td>
                    <td class="px-3 py-2 text-right" [class]="isBalanced() ? 'text-green-700' : 'text-red-600'">
                      {{ totalCredit() | number:'1.2-2' }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="flex items-center gap-3">
              <button type="button" (click)="addLigne()"
                      class="text-sm text-blue-600 hover:text-blue-800">+ Ligne</button>
              @if (!isBalanced() && lignesArray.length > 0) {
                <span class="text-xs text-red-600">Déséquilibre comptable (débit ≠ crédit)</span>
              }
              <div class="flex-1"></div>
              <button type="button" (click)="showForm.set(false)"
                      class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" [disabled]="form.invalid || !isBalanced() || saving()"
                      class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>

            @if (formError()) {
              <p class="text-xs text-red-500 mt-2">{{ formError() }}</p>
            }
          </form>
        </div>
      }

      <!-- Écritures list -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-5 py-3 text-left">Pièce</th>
              <th class="px-5 py-3 text-left">Date</th>
              <th class="px-5 py-3 text-left">Libellé</th>
              <th class="px-5 py-3 text-center">Journal</th>
              <th class="px-5 py-3 text-center">Statut</th>
              <th class="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (e of ecritures(); track e.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-5 py-3 font-mono text-xs">{{ e.numeroPiece }}</td>
                <td class="px-5 py-3 text-gray-600">{{ e.dateEcriture }}</td>
                <td class="px-5 py-3 text-gray-800">{{ e.libelle }}</td>
                <td class="px-5 py-3 text-center">
                  <span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{{ e.journal }}</span>
                </td>
                <td class="px-5 py-3 text-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                        [class]="statutClass(e.statut)">
                    {{ e.statut }}
                  </span>
                </td>
                <td class="px-5 py-3 text-right">
                  @if (e.statut === 'BROUILLON') {
                    <button (click)="valider(e.id)"
                            class="text-xs text-green-600 hover:text-green-800 mr-3">
                      Valider
                    </button>
                    <button (click)="supprimer(e.id)"
                            class="text-xs text-red-400 hover:text-red-600">
                      Supprimer
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="6" class="px-5 py-8 text-center text-gray-400 text-sm">
                  Aucune écriture pour le moment
                </td>
              </tr>
            }
          </tbody>
        </table>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span class="text-gray-500">Page {{ page() + 1 }} / {{ totalPages() }}</span>
            <div class="flex gap-2">
              <button [disabled]="page() === 0" (click)="changePage(page() - 1)"
                      class="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">
                Précédent
              </button>
              <button [disabled]="page() === totalPages() - 1" (click)="changePage(page() + 1)"
                      class="px-3 py-1 border border-gray-300 rounded disabled:opacity-40 hover:bg-gray-50">
                Suivant
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class EcrituresComponent implements OnInit {

  private readonly ecritureService = inject(EcritureService);
  private readonly compteService   = inject(CompteService);
  private readonly fb              = inject(FormBuilder);

  journals  = JOURNALS;
  ecritures = signal<Ecriture[]>([]);
  comptes   = signal<Compte[]>([]);
  showForm  = signal(false);
  saving    = signal(false);
  formError = signal('');
  page      = signal(0);
  totalPages = signal(1);

  form = this.fb.nonNullable.group({
    numeroPiece:   ['', Validators.required],
    dateEcriture:  [new Date().toISOString().slice(0, 10), Validators.required],
    journal:       ['BQ' as Journal, Validators.required],
    libelle:       ['', Validators.required],
    lignes:        this.fb.array([])
  });

  get lignesArray(): FormArray { return this.form.get('lignes') as FormArray; }

  ngOnInit() {
    this.loadEcritures();
    this.compteService.findAll().subscribe(list => this.comptes.set(list));
    this.addLigne();
    this.addLigne();
  }

  addLigne() {
    this.lignesArray.push(this.fb.nonNullable.group({
      compteId: ['', Validators.required],
      libelle:  [''],
      debit:    [0, [Validators.required, Validators.min(0)]],
      credit:   [0, [Validators.required, Validators.min(0)]]
    }));
  }

  removeLigne(i: number) {
    if (this.lignesArray.length > 2) this.lignesArray.removeAt(i);
  }

  totalDebit(): number {
    return this.lignesArray.controls.reduce((s, c) => s + (Number(c.get('debit')?.value) || 0), 0);
  }

  totalCredit(): number {
    return this.lignesArray.controls.reduce((s, c) => s + (Number(c.get('credit')?.value) || 0), 0);
  }

  isBalanced(): boolean {
    const d = this.totalDebit(), cr = this.totalCredit();
    return Math.abs(d - cr) < 0.01 && d > 0;
  }

  submitEcriture() {
    if (this.form.invalid || !this.isBalanced()) return;
    this.saving.set(true);
    this.formError.set('');
    const raw = this.form.getRawValue();
    this.ecritureService.create({
      ...raw,
      lignes: raw.lignes.map(l => ({ ...l, debit: Number(l.debit), credit: Number(l.credit) }))
    }).subscribe({
      next: (e) => {
        this.ecritures.update(list => [e, ...list]);
        this.form.reset({ dateEcriture: new Date().toISOString().slice(0, 10), journal: 'BQ' });
        while (this.lignesArray.length) this.lignesArray.removeAt(0);
        this.addLigne(); this.addLigne();
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: (e) => {
        this.formError.set(e?.error?.detail ?? 'Erreur lors de la création');
        this.saving.set(false);
      }
    });
  }

  valider(id: string) {
    this.ecritureService.valider(id).subscribe(updated => {
      this.ecritures.update(list => list.map(e => e.id === id ? updated : e));
    });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer cette écriture ?')) return;
    this.ecritureService.supprimer(id).subscribe(() => {
      this.ecritures.update(list => list.filter(e => e.id !== id));
    });
  }

  changePage(p: number) {
    this.page.set(p);
    this.loadEcritures();
  }

  statutClass(statut: string): string {
    if (statut === 'VALIDEE')  return 'bg-green-100 text-green-700';
    if (statut === 'CLOTUREE') return 'bg-gray-200 text-gray-600';
    return 'bg-yellow-100 text-yellow-700';
  }

  private loadEcritures() {
    this.ecritureService.findAll(this.page(), 20).subscribe(page => {
      this.ecritures.set(page.content);
      this.totalPages.set(page.totalPages);
    });
  }
}
