import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EcritureService } from '../../core/services/ecriture.service';
import { CompteService } from '../../core/services/compte.service';
import { Ecriture, EcritureRequest, EcritureStats, Journal, JOURNAL_LABELS, StatutEcriture } from '../../core/models/ecriture.model';
import { Compte } from '../../core/models/compte.model';

const JOURNALS: Journal[] = ['AC', 'BQ', 'OD', 'VT'];

@Component({
  selector: 'app-ecritures',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="p-6 max-w-6xl mx-auto space-y-5">

      <!-- Header + stats -->
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-xl font-bold text-gray-900">Écritures comptables</h2>
          @if (stats()) {
            <p class="text-xs text-gray-400 mt-0.5">
              {{ stats()!.totalEcritures }} écriture{{ stats()!.totalEcritures > 1 ? 's' : '' }}
              · <span class="text-yellow-600">{{ stats()!.brouillons }} brouillon{{ stats()!.brouillons > 1 ? 's' : '' }}</span>
              · <span class="text-green-600">{{ stats()!.validees }} validée{{ stats()!.validees > 1 ? 's' : '' }}</span>
            </p>
          }
        </div>
        <button (click)="toggleForm()"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium rounded-lg transition">
          + Nouvelle écriture
        </button>
      </div>

      <!-- New entry form -->
      @if (showForm()) {
        <div class="bg-white border border-blue-200 rounded-xl p-5 shadow-sm space-y-4">
          <h3 class="text-sm font-semibold text-gray-700">Nouvelle écriture</h3>
          <form [formGroup]="form" (ngSubmit)="submitEcriture()">
            <!-- Header fields -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">N° pièce *</label>
                <input type="text" formControlName="numeroPiece"
                       class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                       [class.border-red-400]="form.get('numeroPiece')!.invalid && form.get('numeroPiece')!.touched">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Date *</label>
                <input type="date" formControlName="dateEcriture"
                       class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Journal *</label>
                <select formControlName="journal"
                        class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm bg-white
                               focus:outline-none focus:ring-2 focus:ring-blue-500">
                  @for (j of journals; track j) {
                    <option [value]="j">{{ j }} — {{ journalLabel(j) }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Libellé *</label>
                <input type="text" formControlName="libelle"
                       class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <!-- Lines table -->
            <div class="border border-gray-200 rounded-lg overflow-hidden mb-3">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                  <tr>
                    <th class="px-3 py-2 text-left">Compte</th>
                    <th class="px-3 py-2 text-left">Libellé ligne</th>
                    <th class="px-3 py-2 text-right w-32">Débit</th>
                    <th class="px-3 py-2 text-right w-32">Crédit</th>
                    <th class="px-3 py-2 w-8"></th>
                  </tr>
                </thead>
                <tbody formArrayName="lignes">
                  @for (ligne of lignesArray.controls; track ligne; let i = $index) {
                    <tr [formGroupName]="i" class="border-t border-gray-100">
                      <td class="px-3 py-2">
                        <select formControlName="compteId"
                                class="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white
                                       focus:outline-none focus:ring-1 focus:ring-blue-500"
                                [class.border-red-400]="ligne.get('compteId')!.invalid && ligne.get('compteId')!.touched">
                          <option value="">-- Choisir --</option>
                          @for (c of comptes(); track c.id) {
                            <option [value]="c.id">{{ c.numero }} — {{ c.intitule }}</option>
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
                               (input)="clearOpposite(i,'debit')"
                               class="w-28 px-2 py-1 border border-gray-300 rounded text-xs text-right
                                      focus:outline-none focus:ring-1 focus:ring-blue-500">
                      </td>
                      <td class="px-3 py-2">
                        <input type="number" formControlName="credit" min="0" step="0.01"
                               (input)="clearOpposite(i,'credit')"
                               class="w-28 px-2 py-1 border border-gray-300 rounded text-xs text-right
                                      focus:outline-none focus:ring-1 focus:ring-blue-500">
                      </td>
                      <td class="px-3 py-2 text-center">
                        @if (lignesArray.length > 2) {
                          <button type="button" (click)="lignesArray.removeAt(i)"
                                  class="text-red-300 hover:text-red-500 text-xs">✕</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-gray-50 text-xs">
                  <tr>
                    <td colspan="2" class="px-3 py-2 font-semibold text-gray-500">Totaux</td>
                    <td class="px-3 py-2 text-right font-bold"
                        [class]="isBalanced() ? 'text-green-700' : 'text-red-600'">
                      {{ totalDebit() | number:'1.2-2' }}
                    </td>
                    <td class="px-3 py-2 text-right font-bold"
                        [class]="isBalanced() ? 'text-green-700' : 'text-red-600'">
                      {{ totalCredit() | number:'1.2-2' }}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div class="flex items-center gap-3">
              <button type="button" (click)="addLigne()"
                      class="text-sm text-blue-600 hover:text-blue-800">
                + Ajouter une ligne
              </button>
              @if (!isBalanced() && totalDebit() > 0) {
                <span class="text-xs text-red-500 font-medium">
                  Déséquilibre : {{ (totalDebit() - totalCredit()) | number:'1.2-2' }}
                </span>
              }
              @if (isBalanced() && totalDebit() > 0) {
                <span class="text-xs text-green-600">✓ Écriture équilibrée</span>
              }
              <div class="flex-1"></div>
              <button type="button" (click)="showForm.set(false)"
                      class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit"
                      [disabled]="form.invalid || !isBalanced() || totalDebit() === 0 || saving()"
                      class="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ saving() ? 'Enregistrement...' : 'Enregistrer en brouillon' }}
              </button>
            </div>
            @if (formError()) {
              <p class="text-xs text-red-500 mt-2">{{ formError() }}</p>
            }
          </form>
        </div>
      }

      <!-- Filters -->
      <div class="bg-white border border-gray-200 rounded-xl px-5 py-3 flex flex-wrap gap-3 items-center">
        <span class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtres</span>
        <select [(ngModel)]="filterJournal" (ngModelChange)="applyFilters()"
                class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les journaux</option>
          @for (j of journals; track j) {
            <option [value]="j">{{ j }} — {{ journalLabel(j) }}</option>
          }
        </select>
        <select [(ngModel)]="filterStatut" (ngModelChange)="applyFilters()"
                class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous les statuts</option>
          <option value="BROUILLON">Brouillon</option>
          <option value="VALIDEE">Validée</option>
          <option value="CLOTUREE">Clôturée</option>
        </select>
        <div class="flex items-center gap-1">
          <label class="text-xs text-gray-500">Du</label>
          <input type="date" [(ngModel)]="filterFrom" (ngModelChange)="applyFilters()"
                 class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div class="flex items-center gap-1">
          <label class="text-xs text-gray-500">au</label>
          <input type="date" [(ngModel)]="filterTo" (ngModelChange)="applyFilters()"
                 class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                        focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        @if (filterJournal || filterStatut || filterFrom || filterTo) {
          <button (click)="clearFilters()"
                  class="text-xs text-red-500 hover:text-red-700 hover:underline">
            Effacer les filtres
          </button>
        }
      </div>

      <!-- Écritures table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (loadingList()) {
          <div class="flex justify-center py-12 text-gray-400 text-sm">Chargement...</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-5 py-3 text-left w-8"></th>
                <th class="px-5 py-3 text-left">Pièce</th>
                <th class="px-5 py-3 text-left">Date</th>
                <th class="px-5 py-3 text-left">Libellé</th>
                <th class="px-5 py-3 text-center">Journal</th>
                <th class="px-5 py-3 text-right">Débit</th>
                <th class="px-5 py-3 text-right">Crédit</th>
                <th class="px-5 py-3 text-center">Statut</th>
                <th class="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (e of ecritures(); track e.id) {
                <tr class="hover:bg-gray-50">
                  <!-- Expand toggle -->
                  <td class="px-3 py-3 text-center">
                    <button (click)="toggleDetail(e.id)"
                            class="text-gray-300 hover:text-blue-500 transition text-xs">
                      {{ expandedId() === e.id ? '▲' : '▼' }}
                    </button>
                  </td>
                  <td class="px-5 py-3 font-mono text-xs text-gray-700">{{ e.numeroPiece }}</td>
                  <td class="px-5 py-3 text-gray-600 whitespace-nowrap">{{ e.dateEcriture }}</td>
                  <td class="px-5 py-3 text-gray-800 max-w-xs truncate">{{ e.libelle }}</td>
                  <td class="px-5 py-3 text-center">
                    <span class="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-medium">
                      {{ e.journal }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right font-mono text-xs text-gray-800">
                    {{ e.totalDebit | number:'1.2-2' }}
                  </td>
                  <td class="px-5 py-3 text-right font-mono text-xs text-gray-800">
                    {{ e.totalCredit | number:'1.2-2' }}
                  </td>
                  <td class="px-5 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                          [class]="statutClass(e.statut)">
                      {{ e.statut }}
                    </span>
                  </td>
                  <td class="px-5 py-3 text-right whitespace-nowrap">
                    @if (e.statut === 'BROUILLON') {
                      <button (click)="valider(e)"
                              class="text-xs text-green-600 hover:text-green-800 mr-3 font-medium">
                        Valider
                      </button>
                      <button (click)="supprimer(e)"
                              class="text-xs text-red-400 hover:text-red-600">
                        Supprimer
      	              </button>
                    }
                  </td>
                </tr>

                <!-- Detail panel (expanded lignes) -->
                @if (expandedId() === e.id) {
                  <tr class="bg-blue-50">
                    <td colspan="9" class="px-8 py-3">
                      <div class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Lignes d'écriture
                      </div>
                      <table class="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                        <thead class="bg-white text-gray-500">
                          <tr>
                            <th class="px-4 py-1.5 text-left">Compte</th>
                            <th class="px-4 py-1.5 text-left">Libellé</th>
                            <th class="px-4 py-1.5 text-right">Débit</th>
                            <th class="px-4 py-1.5 text-right">Crédit</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                          @for (l of e.lignes; track l.id) {
                            <tr class="bg-white">
                              <td class="px-4 py-1.5 font-mono">
                                {{ l.compteNumero }} — {{ l.compteIntitule }}
                              </td>
                              <td class="px-4 py-1.5 text-gray-600">{{ l.libelle || '—' }}</td>
                              <td class="px-4 py-1.5 text-right">
                                {{ l.debit > 0 ? (l.debit | number:'1.2-2') : '—' }}
                              </td>
                              <td class="px-4 py-1.5 text-right">
                                {{ l.credit > 0 ? (l.credit | number:'1.2-2') : '—' }}
                              </td>
                            </tr>
                          }
                        </tbody>
                        <tfoot class="bg-gray-50 font-semibold">
                          <tr>
                            <td colspan="2" class="px-4 py-1.5 text-gray-500">Total</td>
                            <td class="px-4 py-1.5 text-right text-green-700">
                              {{ e.totalDebit | number:'1.2-2' }}
                            </td>
                            <td class="px-4 py-1.5 text-right text-green-700">
                              {{ e.totalCredit | number:'1.2-2' }}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>

          @if (ecritures().length === 0) {
            <div class="text-center py-12 text-gray-400 text-sm">
              Aucune écriture pour ces critères
            </div>
          }

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
              <span class="text-gray-500 text-xs">
                Page {{ currentPage() + 1 }} sur {{ totalPages() }}
                · {{ totalElements() }} écriture{{ totalElements() > 1 ? 's' : '' }}
              </span>
              <div class="flex gap-2">
                <button [disabled]="currentPage() === 0"
                        (click)="changePage(currentPage() - 1)"
                        class="px-3 py-1 border border-gray-300 rounded-lg text-xs
                               disabled:opacity-40 hover:bg-gray-50">
                  ← Précédent
                </button>
                <button [disabled]="currentPage() === totalPages() - 1"
                        (click)="changePage(currentPage() + 1)"
                        class="px-3 py-1 border border-gray-300 rounded-lg text-xs
                               disabled:opacity-40 hover:bg-gray-50">
                  Suivant →
                </button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  `
})
export class EcrituresComponent implements OnInit {

  private readonly ecritureService = inject(EcritureService);
  private readonly compteService   = inject(CompteService);
  private readonly fb              = inject(FormBuilder);

  journals     = JOURNALS;
  journalLabel = (j: Journal) => JOURNAL_LABELS[j];

  ecritures    = signal<Ecriture[]>([]);
  comptes      = signal<Compte[]>([]);
  stats        = signal<EcritureStats | null>(null);
  loadingList  = signal(true);
  showForm     = signal(false);
  saving       = signal(false);
  formError    = signal('');
  expandedId   = signal<string | null>(null);
  currentPage  = signal(0);
  totalPages   = signal(1);
  totalElements = signal(0);

  // Filters
  filterJournal: Journal | '' = '';
  filterStatut:  StatutEcriture | '' = '';
  filterFrom = '';
  filterTo   = '';

  form = this.fb.nonNullable.group({
    numeroPiece:  ['', Validators.required],
    dateEcriture: [new Date().toISOString().slice(0, 10), Validators.required],
    journal:      ['BQ' as Journal, Validators.required],
    libelle:      ['', Validators.required],
    lignes:       this.fb.array([])
  });

  get lignesArray(): FormArray { return this.form.get('lignes') as FormArray; }

  ngOnInit() {
    this.loadEcritures();
    this.ecritureService.stats().subscribe(s => this.stats.set(s));
    this.compteService.findAll().subscribe(list => this.comptes.set(list.filter(c => c.actif)));
    this.addLigne(); this.addLigne();
  }

  addLigne() {
    this.lignesArray.push(this.fb.nonNullable.group({
      compteId: ['', Validators.required],
      libelle:  [''],
      debit:    [0],
      credit:   [0]
    }));
  }

  clearOpposite(i: number, changed: 'debit' | 'credit') {
    const other = changed === 'debit' ? 'credit' : 'debit';
    const val = Number(this.lignesArray.at(i).get(changed)?.value) || 0;
    if (val > 0) this.lignesArray.at(i).get(other)?.setValue(0);
  }

  totalDebit(): number {
    return this.lignesArray.controls.reduce((s, c) => s + (Number(c.get('debit')?.value) || 0), 0);
  }

  totalCredit(): number {
    return this.lignesArray.controls.reduce((s, c) => s + (Number(c.get('credit')?.value) || 0), 0);
  }

  isBalanced(): boolean {
    return Math.abs(this.totalDebit() - this.totalCredit()) < 0.005;
  }

  submitEcriture() {
    if (this.form.invalid || !this.isBalanced()) return;
    this.saving.set(true);
    this.formError.set('');
    const raw = this.form.getRawValue();
    const payload: EcritureRequest = {
      ...raw,
      lignes: (raw.lignes as any[]).map((l: any) => ({
        ...l, debit: Number(l.debit), credit: Number(l.credit)
      })).filter((l: any) => l.compteId)
    };
    this.ecritureService.create(payload).subscribe({
      next: (e) => {
        this.ecritures.update(list => [e, ...list]);
        this.ecritureService.stats().subscribe(s => this.stats.set(s));
        this.resetForm();
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: (err) => {
        this.formError.set(err?.error?.detail ?? 'Erreur lors de la création');
        this.saving.set(false);
      }
    });
  }

  toggleForm() {
    this.showForm.update(v => !v);
    if (!this.showForm()) this.resetForm();
  }

  valider(e: Ecriture) {
    this.ecritureService.valider(e.id).subscribe(updated => {
      this.ecritures.update(list => list.map(x => x.id === e.id ? updated : x));
      this.ecritureService.stats().subscribe(s => this.stats.set(s));
    });
  }

  supprimer(e: Ecriture) {
    if (!confirm(`Supprimer l'écriture "${e.numeroPiece}" ?`)) return;
    this.ecritureService.supprimer(e.id).subscribe(() => {
      this.ecritures.update(list => list.filter(x => x.id !== e.id));
      this.ecritureService.stats().subscribe(s => this.stats.set(s));
    });
  }

  toggleDetail(id: string) {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  applyFilters() { this.currentPage.set(0); this.loadEcritures(); }

  clearFilters() {
    this.filterJournal = '';
    this.filterStatut  = '';
    this.filterFrom    = '';
    this.filterTo      = '';
    this.applyFilters();
  }

  changePage(p: number) { this.currentPage.set(p); this.loadEcritures(); }

  statutClass(statut: string): string {
    if (statut === 'VALIDEE')  return 'bg-green-100 text-green-700';
    if (statut === 'CLOTUREE') return 'bg-gray-200 text-gray-600';
    return 'bg-yellow-100 text-yellow-700';
  }

  private loadEcritures() {
    this.loadingList.set(true);
    this.ecritureService.findAll({
      page:    this.currentPage(),
      journal: this.filterJournal as Journal,
      statut:  this.filterStatut  as StatutEcriture,
      from:    this.filterFrom,
      to:      this.filterTo
    }).subscribe(page => {
      this.ecritures.set(page.content);
      this.totalPages.set(page.totalPages);
      this.totalElements.set(page.totalElements);
      this.loadingList.set(false);
    });
  }

  private resetForm() {
    this.form.reset({ dateEcriture: new Date().toISOString().slice(0, 10), journal: 'BQ' });
    while (this.lignesArray.length) this.lignesArray.removeAt(0);
    this.addLigne(); this.addLigne();
    this.formError.set('');
  }
}
