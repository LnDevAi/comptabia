import {
  ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, signal, ViewChild, effect
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { IaService } from '../../core/services/ia.service';
import { EcritureService } from '../../core/services/ecriture.service';
import { CompteService } from '../../core/services/compte.service';
import { InvoiceAnalysis, TYPE_DOCUMENT_LABELS, ChatMessage } from '../../core/models/ia.model';
import { Compte } from '../../core/models/compte.model';
import { JOURNAL_LABELS } from '../../core/models/ecriture.model';

type Step = 'upload' | 'processing' | 'review';
type ActiveTab = 'facture' | 'chat';

@Component({
  selector: 'app-ia',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-5">

  <!-- Header + Tabs -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Assistant IA</h1>
    <div class="flex gap-1 mt-4 border-b border-gray-200">
      <button (click)="activeTab.set('facture')"
              [class]="tabClass('facture')"
              class="px-4 py-2 text-sm font-medium rounded-t-lg -mb-px border border-b-0 transition-colors">
        📄 Analyse de factures
      </button>
      <button (click)="activeTab.set('chat')"
              [class]="tabClass('chat')"
              class="px-4 py-2 text-sm font-medium rounded-t-lg -mb-px border border-b-0 transition-colors flex items-center gap-1.5">
        <span class="text-xs text-purple-500">✦</span> Assistant SYSCOHADA
      </button>
    </div>
  </div>

  <!-- ─── Tab Analyse de factures ─────────────────────────────── -->
  @if (activeTab() === 'facture') {

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
                  {{ saving() ? 'Enregistrement…' : "Créer l'écriture (brouillon)" }}
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
  }

  <!-- ─── Tab Assistant SYSCOHADA ────────────────────────────── -->
  @if (activeTab() === 'chat') {
    <div class="flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden"
         style="height: 600px">

      <!-- Messages area -->
      <div #messagesContainer class="flex-1 overflow-y-auto p-5 space-y-4">

        @if (chatMessages().length === 0) {
          <div class="text-center py-10">
            <div class="text-5xl mb-3 text-purple-400">✦</div>
            <h2 class="font-bold text-gray-800 text-lg">SYSCO</h2>
            <p class="text-sm text-gray-500 mt-1">Votre assistant comptable SYSCOHADA</p>
            <p class="text-xs text-gray-400 mt-0.5">Plan comptable, écritures, TVA, clôture d'exercice…</p>

            <div class="flex flex-wrap gap-2 justify-center mt-6 max-w-xl mx-auto">
              @for (chip of quickChips; track chip) {
                <button (click)="sendChip(chip)"
                        class="px-3 py-1.5 text-xs bg-gray-50 hover:bg-purple-50 hover:text-purple-700 border border-gray-200 hover:border-purple-200 rounded-xl transition-colors text-gray-600">
                  {{ chip }}
                </button>
              }
            </div>
          </div>
        }

        @for (msg of chatMessages(); track msg) {
          <div class="flex items-end gap-2" [class]="msg.role === 'user' ? 'justify-end' : 'justify-start'">
            @if (msg.role === 'assistant') {
              <div class="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">✦</div>
            }
            <div class="max-w-[78%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed"
                 [class]="msg.role === 'user'
                   ? 'bg-blue-600 text-white rounded-br-sm'
                   : 'bg-gray-100 text-gray-800 rounded-bl-sm'">
              {{ msg.content }}
            </div>
          </div>
        }

        @if (chatLoading()) {
          <div class="flex items-end gap-2 justify-start">
            <div class="w-7 h-7 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold shrink-0">✦</div>
            <div class="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:160ms"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:320ms"></div>
            </div>
          </div>
        }
      </div>

      <!-- Input area -->
      <div class="border-t border-gray-100 px-4 pt-3 pb-4 space-y-2.5">
        <div class="flex items-center justify-between">
          <label class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none">
            <input type="checkbox" [checked]="includeContext()" (change)="includeContext.update(v => !v)"
                   class="rounded border-gray-300"/>
            Inclure les données de mon entreprise
          </label>
          @if (chatMessages().length > 0) {
            <button (click)="clearChat()"
                    class="text-xs text-gray-400 hover:text-red-500 transition-colors">
              Effacer la conversation
            </button>
          }
        </div>

        @if (chatError()) {
          <p class="text-xs text-red-600">{{ chatError() }}</p>
        }

        <div class="flex gap-2 items-end">
          <textarea
            [value]="chatInput()"
            (input)="onChatInput($event)"
            (keydown)="onChatKeydown($event)"
            placeholder="Posez votre question comptable…"
            rows="2"
            class="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 leading-snug">
          </textarea>
          <button (click)="sendMessage()"
                  [disabled]="chatLoading() || !chatInput().trim()"
                  class="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition text-sm font-medium shrink-0">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `
})
export class IaComponent implements OnInit {
  private iaService       = inject(IaService);
  private ecritureService = inject(EcritureService);
  private compteService   = inject(CompteService);
  private fb              = inject(FormBuilder);

  // ─── Invoice analysis state ───────────────────────────────────────────────
  activeTab   = signal<ActiveTab>('facture');
  step        = signal<Step>('upload');
  dragOver    = signal(false);
  uploadError = signal<string | null>(null);
  result      = signal<InvoiceAnalysis | null>(null);
  comptes     = signal<Compte[]>([]);
  saving      = signal(false);
  saved       = signal(false);
  formError   = signal<string | null>(null);
  form!: FormGroup;
  readonly journals = Object.entries(JOURNAL_LABELS).map(([code, label]) => ({ code, label }));

  // ─── Chat state ───────────────────────────────────────────────────────────
  chatMessages   = signal<ChatMessage[]>([]);
  chatLoading    = signal(false);
  chatError      = signal<string | null>(null);
  includeContext = signal(true);
  chatInput      = signal('');

  @ViewChild('messagesContainer') messagesContainer?: ElementRef<HTMLDivElement>;

  readonly quickChips = [
    "Comment comptabiliser une facture d'achat avec TVA ?",
    "Quels sont les comptes de TVA SYSCOHADA ?",
    "Comment clôturer l'exercice comptable ?",
    "Différence entre Système Normal et SMT ?",
    "Comment enregistrer les salaires bruts et nets ?",
    "Quel compte pour un emprunt bancaire à long terme ?",
  ];

  constructor() {
    effect(() => {
      this.chatMessages();
      this.chatLoading();
      setTimeout(() => this.scrollToBottom(), 60);
    });
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  ngOnInit() {
    this.compteService.findAll().subscribe(list => this.comptes.set(list));
    this.initForm();
  }

  tabClass(tab: ActiveTab): string {
    return this.activeTab() === tab
      ? 'bg-white border-gray-200 text-blue-700'
      : 'border-transparent text-gray-500 hover:bg-gray-50';
  }

  // ─── Invoice helpers ──────────────────────────────────────────────────────

  typeLabel() {
    const t = this.result()?.typeDocument;
    return t ? TYPE_DOCUMENT_LABELS[t] : '';
  }

  get lignesArray(): FormArray { return this.form.get('lignes') as FormArray; }

  totalDebit()  { return this.lignesArray.controls.reduce((s, c) => s + (Number(c.get('debit')?.value) || 0), 0); }
  totalCredit() { return this.lignesArray.controls.reduce((s, c) => s + (Number(c.get('credit')?.value) || 0), 0); }
  isBalanced()  { return Math.abs(this.totalDebit() - this.totalCredit()) < 0.01 && this.totalDebit() > 0; }

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
    if (file.size > 10 * 1024 * 1024) {
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
      error: (err: any) => {
        this.uploadError.set(err?.error?.message ?? "Erreur lors de l'analyse. Réessayez.");
        this.step.set('upload');
      }
    });
  }

  submit() {
    if (!this.isBalanced()) { this.formError.set("L'écriture est déséquilibrée."); return; }
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

  // ─── Chat ─────────────────────────────────────────────────────────────────

  onChatInput(event: Event) {
    this.chatInput.set((event.target as HTMLTextAreaElement).value);
  }

  onChatKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendChip(chip: string) {
    this.chatInput.set(chip);
    this.sendMessage();
  }

  sendMessage() {
    const text = this.chatInput().trim();
    if (!text || this.chatLoading()) return;

    this.chatInput.set('');
    this.chatError.set(null);
    this.chatMessages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.chatLoading.set(true);

    this.iaService.chat({
      messages: this.chatMessages(),
      includeContext: this.includeContext()
    }).subscribe({
      next: res => {
        this.chatMessages.update(msgs => [...msgs, { role: 'assistant', content: res.content }]);
        this.chatLoading.set(false);
      },
      error: (err: any) => {
        this.chatError.set(err?.error?.message ?? "Erreur de communication avec l'assistant.");
        this.chatLoading.set(false);
      }
    });
  }

  clearChat() {
    this.chatMessages.set([]);
    this.chatError.set(null);
  }

  private scrollToBottom() {
    const el = this.messagesContainer?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
