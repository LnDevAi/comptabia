import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { IaService } from '../../core/services/ia.service';
import { EcritureService } from '../../core/services/ecriture.service';
import { CompteService } from '../../core/services/compte.service';
import { InvoiceAnalysis, TYPE_DOCUMENT_LABELS } from '../../core/models/ia.model';
import { Compte } from '../../core/models/compte.model';
import { JOURNAL_LABELS } from '../../core/models/ecriture.model';

type Step = 'upload' | 'processing' | 'review';

@Component({
  selector: 'app-ia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Assistant IA – Analyse de documents</h1>
    <p class="text-sm text-gray-500 mt-1">
      Déposez une facture (PDF ou image) et l'IA extraira les informations et proposera l'imputation comptable SYSCOHADA.
    </p>
  </div>

  <!-- Step 1 – Upload -->
  @if (step() === 'upload') {
    <div
      class="border-2 border-dashed rounded-2xl p-12 text-center transition-colors cursor-pointer"
      [class]="dragOver() ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'"
      (dragover)="$event.preventDefault(); dragOver.set(true)"
      (dragleave)="dragOver.set(false)"
      (drop)="onDrop($event)"
      (click)="fileInput.click()">
      <div class="text-5xl mb-4">📄</div>
      <p class="text-gray-700 font-medium text-lg">Déposez votre facture ici</p>
      <p class="text-gray-400 text-sm mt-1">ou cliquez pour sélectionner un fichier</p>
      <p class="text-xs text-gray-400 mt-3">PDF, JPEG, PNG, WebP — jusqu'à 10 Mo</p>
      <input #fileInput type="file" class="hidden"
             accept=".pdf,image/jpeg,image/png,image/webp"
             (change)="onFileSelected($event)"/>
    </div>

    @if (uploadError()) {
      <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
        {{ uploadError() }}
      </div>
    }
  }

  <!-- Step 2 – Processing -->
  @if (step() === 'processing') {
    <div class="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-4">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
        <div class="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p class="font-medium text-gray-700">Analyse en cours…</p>
      <p class="text-sm text-gray-400">L'assistant IA lit votre document et prépare l'imputation SYSCOHADA</p>
    </div>
  }

  <!-- Step 3 – Review -->
  @if (step() === 'review' && result()) {
    <div class="space-y-5">

      <!-- Extraction card -->
      <div class="bg-white rounded-2xl border border-gray-200 p-5">
        <div class="flex items-start justify-between mb-4">
          <div>
            <span class="text-xs font-bold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              {{ typeLabel() }}
            </span>
            <h2 class="text-lg font-bold text-gray-800 mt-2">
              {{ result()!.fournisseur || result()!.client || 'Document analysé' }}
            </h2>
            @if (result()!.description) {
              <p class="text-sm text-gray-500">{{ result()!.description }}</p>
            }
          </div>
          <button (click)="reset()"
                  class="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg">
            Nouveau document
          </button>
        </div>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs text-gray-400 mb-1">Date</div>
            <div class="font-semibold text-sm text-gray-800">{{ result()!.dateDocument || '–' }}</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs text-gray-400 mb-1">N° document</div>
            <div class="font-semibold text-sm text-gray-800">{{ result()!.numeroDocument || '–' }}</div>
          </div>
          <div class="bg-gray-50 rounded-xl p-3">
            <div class="text-xs text-gray-400 mb-1">Montant HT</div>
            <div class="font-semibold text-sm text-gray-800 font-mono">
              {{ result()!.montantHt | number:'1.2-2' }} {{ result()!.devise }}
            </div>
          </div>
          <div class="bg-blue-50 rounded-xl p-3">
            <div class="text-xs text-blue-500 mb-1">Montant TTC</div>
            <div class="font-bold text-blue-700 font-mono">
              {{ result()!.montantTtc | number:'1.2-2' }} {{ result()!.devise }}
            </div>
          </div>
        </div>

        @if (result()!.tauxTva > 0) {
          <div class="mt-3 text-xs text-gray-400">
            TVA {{ result()!.tauxTva }}% → {{ result()!.montantTva | number:'1.2-2' }} {{ result()!.devise }}
          </div>
        }
      </div>

      <!-- Écriture form -->
      @if (form) {
        <div class="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 class="font-semibold text-gray-700 mb-4">Écriture comptable suggérée</h3>

          <form [formGroup]="form" class="space-y-4">

            <!-- Header fields -->
            <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label class="text-xs text-gray-500 mb-1 block">Date *</label>
                <input type="date" formControlName="dateEcriture"
                       class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div>
                <label class="text-xs text-gray-500 mb-1 block">N° pièce *</label>
                <input type="text" formControlName="numeroPiece"
                       class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div class="sm:col-span-2">
                <label class="text-xs text-gray-500 mb-1 block">Libellé *</label>
                <input type="text" formControlName="libelle"
                       class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
            </div>
            <div class="max-w-xs">
              <label class="text-xs text-gray-500 mb-1 block">Journal</label>
              <select formControlName="journal"
                      class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                @for (j of journals; track j.code) {
                  <option [value]="j.code">{{ j.label }}</option>
                }
              </select>
            </div>

            <!-- Lines -->
            <div class="overflow-x-auto">
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
                                class="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                [class.border-red-400]="lignesArray.at(i).get('compteId')!.invalid && lignesArray.at(i).get('compteId')!.touched">
                          <option value="">-- Choisir --</option>
                          @for (c of comptes(); track c.id) {
                            <option [value]="c.id">{{ c.numero }} – {{ c.intitule }}</option>
                          }
                        </select>
                      </td>
                      <td class="px-3 py-2">
                        <input formControlName="libelle" type="text" placeholder="Libellé"
                               class="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"/>
                      </td>
                      <td class="px-3 py-2">
                        <input formControlName="debit" type="number" min="0" step="0.01" placeholder="0.00"
                               class="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                               (change)="clearOpposite(i, 'debit')"/>
                      </td>
                      <td class="px-3 py-2">
                        <input formControlName="credit" type="number" min="0" step="0.01" placeholder="0.00"
                               class="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                               (change)="clearOpposite(i, 'credit')"/>
                      </td>
                      <td class="px-3 py-2 text-center">
                        @if (lignesArray.length > 2) {
                          <button type="button" (click)="removeLigne(i)"
                                  class="text-red-400 hover:text-red-600 text-xs">✕</button>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Totals & balance indicator -->
            <div class="flex items-center justify-between text-sm">
              <button type="button" (click)="addLigne()"
                      class="text-blue-600 text-xs hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg">
                + Ajouter une ligne
              </button>
              <div class="flex gap-4 font-mono text-xs">
                <span class="text-blue-700">Débit : {{ totalDebit() | number:'1.2-2' }}</span>
                <span class="text-green-700">Crédit : {{ totalCredit() | number:'1.2-2' }}</span>
                <span [class]="isBalanced() ? 'text-green-600 font-bold' : 'text-red-600 font-bold'">
                  {{ isBalanced() ? '✓ Équilibrée' : '✗ Déséquilibrée' }}
                </span>
              </div>
            </div>

            @if (formError()) {
              <div class="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {{ formError() }}
              </div>
            }

            @if (saved()) {
              <div class="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 flex items-center gap-2">
                <span>✓</span> Écriture créée avec succès en brouillon.
              </div>
            }

            <div class="flex items-center gap-3">
              <button type="button" (click)="submit()"
                      [disabled]="saving() || !isBalanced()"
                      class="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                {{ saving() ? 'Enregistrement…' : 'Créer l\'écriture (brouillon)' }}
              </button>
              <button type="button" (click)="reset()"
                      class="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl">
                Analyser un autre document
              </button>
            </div>
          </form>
        </div>
      }
    </div>
  }
</div>
  `
})
export class IaComponent implements OnInit {
  private iaService    = inject(IaService);
  private ecritureService = inject(EcritureService);
  private compteService   = inject(CompteService);
  private fb           = inject(FormBuilder);

  step       = signal<Step>('upload');
  dragOver   = signal(false);
  uploadError = signal<string | null>(null);
  result     = signal<InvoiceAnalysis | null>(null);
  comptes    = signal<Compte[]>([]);
  saving     = signal(false);
  saved      = signal(false);
  formError  = signal<string | null>(null);

  form!: FormGroup;

  readonly journals = Object.entries(JOURNAL_LABELS).map(([code, label]) => ({ code, label }));

  typeLabel() {
    const t = this.result()?.typeDocument;
    return t ? TYPE_DOCUMENT_LABELS[t] : '';
  }

  get lignesArray(): FormArray { return this.form.get('lignes') as FormArray; }

  totalDebit()  { return this.lignesArray.controls.reduce((s, c) => s + (Number(c.get('debit')?.value) || 0), 0); }
  totalCredit() { return this.lignesArray.controls.reduce((s, c) => s + (Number(c.get('credit')?.value) || 0), 0); }
  isBalanced()  { return Math.abs(this.totalDebit() - this.totalCredit()) < 0.01 && this.totalDebit() > 0; }

  ngOnInit() {
    this.compteService.findAll().subscribe(list => this.comptes.set(list));
    this.initForm();
  }

  private initForm(prefill?: InvoiceAnalysis) {
    this.form = this.fb.group({
      dateEcriture: [prefill?.dateDocument ?? new Date().toISOString().slice(0, 10), Validators.required],
      numeroPiece:  [prefill?.numeroDocument ?? '', Validators.required],
      libelle:      [prefill?.imputation?.libelleEcriture ?? prefill?.description ?? '', Validators.required],
      journal:      [prefill?.imputation?.journalSuggere ?? 'OD', Validators.required],
      lignes:       this.fb.array([]),
    });

    if (prefill?.imputation?.lignes?.length) {
      for (const l of prefill.imputation.lignes) {
        this.addLigne(l.compteId ?? '', l.libelle, l.sens === 'DEBIT' ? l.montant : 0, l.sens === 'CREDIT' ? l.montant : 0);
      }
    } else {
      this.addLigne(); this.addLigne();
    }
  }

  addLigne(compteId = '', libelle = '', debit = 0, credit = 0) {
    this.lignesArray.push(this.fb.group({
      compteId: [compteId, Validators.required],
      libelle:  [libelle],
      debit:    [debit, [Validators.min(0)]],
      credit:   [credit, [Validators.min(0)]],
    }));
  }

  removeLigne(i: number) { this.lignesArray.removeAt(i); }

  clearOpposite(i: number, changed: 'debit' | 'credit') {
    const other = changed === 'debit' ? 'credit' : 'debit';
    const val = Number(this.lignesArray.at(i).get(changed)?.value) || 0;
    if (val > 0) this.lignesArray.at(i).get(other)?.setValue(0);
  }

  // ─── File upload ──────────────────────────────────────────────────────────

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  private processFile(file: File) {
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      this.uploadError.set('Fichier trop volumineux (max 10 Mo).');
      return;
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      this.uploadError.set('Format non supporté. Utilisez PDF, JPEG, PNG ou WebP.');
      return;
    }
    this.uploadError.set(null);
    this.step.set('processing');
    this.iaService.analyserFacture(file).subscribe({
      next: res => {
        this.result.set(res);
        this.initForm(res);
        this.step.set('review');
      },
      error: err => {
        this.uploadError.set(err?.error?.message ?? 'Erreur lors de l\'analyse. Réessayez.');
        this.step.set('upload');
      }
    });
  }

  // ─── Submit écriture ──────────────────────────────────────────────────────

  submit() {
    if (!this.isBalanced()) { this.formError.set('L\'écriture est déséquilibrée.'); return; }
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.formError.set('Remplissez tous les champs obligatoires.'); return; }

    this.formError.set(null);
    this.saving.set(true);
    const raw = this.form.getRawValue();
    const payload = {
      ...raw,
      lignes: (raw.lignes as any[]).map((l: any) => ({
        ...l, debit: Number(l.debit), credit: Number(l.credit)
      })).filter((l: any) => l.compteId)
    };

    this.ecritureService.create(payload).subscribe({
      next: () => { this.saved.set(true); this.saving.set(false); },
      error: (err: any) => {
        this.formError.set(err?.error?.message ?? 'Erreur lors de la création.');
        this.saving.set(false);
      }
    });
  }

  reset() {
    this.step.set('upload');
    this.result.set(null);
    this.saved.set(false);
    this.formError.set(null);
    this.uploadError.set(null);
    this.initForm();
  }
}
