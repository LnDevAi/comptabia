import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionFiscaleService } from '../../core/services/gestion-fiscale.service';
import {
  CalendrierFiscalItem, DeclarationFiscaleResponse,
  DeclarationFiscaleSaveRequest, DeclarationFiscaleUpdateRequest,
  StatutDeclarationFiscale
} from '../../core/models/fiscal.model';

const STATUTS: { val: StatutDeclarationFiscale; label: string; css: string }[] = [
  { val: 'A_FAIRE',  label: 'À faire',   css: 'bg-gray-100 text-gray-700' },
  { val: 'EN_COURS', label: 'En cours',  css: 'bg-blue-100 text-blue-700' },
  { val: 'DECLAREE', label: 'Déclarée',  css: 'bg-yellow-100 text-yellow-700' },
  { val: 'PAYEE',    label: 'Payée',     css: 'bg-green-100 text-green-700' },
];

@Component({
  selector: 'app-gestion-fiscale',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Gestion fiscale</h1>
      <p class="text-sm text-gray-500 mt-0.5">Calendrier des obligations fiscales et suivi des déclarations</p>
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-600 font-medium">Exercice</label>
      <select [(ngModel)]="annee" (ngModelChange)="charger()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        @for (a of annees; track a) { <option [value]="a">{{ a }}</option> }
      </select>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1">
      <button (click)="tab = 'calendrier'; chargerCalendrier()" [class]="tabClass('calendrier')">
        Calendrier fiscal
        @if (enRetardCount > 0) {
          <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700">{{ enRetardCount }}</span>
        }
      </button>
      <button (click)="tab = 'declarations'; chargerDeclarations()" [class]="tabClass('declarations')">Déclarations</button>
    </nav>
  </div>

  <!-- ── Calendrier ─────────────────────────────────────────────────────── -->
  @if (tab === 'calendrier') {
    <div class="space-y-3">
      @if (calendrier.length === 0) {
        <p class="text-center text-gray-400 py-12">Aucune obligation fiscale configurée pour ce pays.</p>
      }
      @for (item of calendrier; track item.codeImpot + item.periode) {
        <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4 hover:shadow-sm transition-shadow">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="font-semibold text-gray-900 text-sm">{{ item.libelle }}</span>
              <span class="text-xs text-gray-400 font-mono">{{ item.codeImpot }}</span>
              <span class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ item.periode }}</span>
            </div>
            <div class="text-xs text-gray-500 mt-0.5">
              Échéance : <span [class]="isEnRetard(item.dateEcheance, item.statut) ? 'text-red-600 font-semibold' : 'text-gray-600'">
                {{ formatDate(item.dateEcheance) }}
              </span>
              @if (isEnRetard(item.dateEcheance, item.statut)) {
                <span class="ml-1 text-red-500 font-medium">— En retard !</span>
              }
            </div>
          </div>
          <div class="flex items-center gap-3">
            @if (item.montantImpot) {
              <span class="text-sm font-semibold text-gray-800">{{ fmt(item.montantImpot) }} XOF</span>
            }
            <span [class]="'px-2.5 py-1 rounded-full text-xs font-medium ' + statutCss(item.statut)">
              {{ statutLabel(item.statut) }}
            </span>
            @if (!item.declarationId) {
              <button (click)="ouvrirCreerDepuisCalendrier(item)"
                      class="text-xs text-blue-600 hover:underline">Déclarer</button>
            } @else {
              <button (click)="ouvrirModifier(item.declarationId)"
                      class="text-xs text-gray-500 hover:underline">Modifier</button>
            }
          </div>
        </div>
      }
    </div>
  }

  <!-- ── Déclarations ───────────────────────────────────────────────────── -->
  @if (tab === 'declarations') {
    <div class="space-y-4">
      <div class="flex justify-end">
        <button (click)="ouvrirCreer()"
                class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          + Nouvelle déclaration
        </button>
      </div>
      @if (declarations.length === 0) {
        <p class="text-center text-gray-400 py-12">Aucune déclaration pour {{ annee }}.</p>
      }
      <div class="overflow-auto rounded-xl border border-gray-200">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-3">Impôt</th>
              <th class="px-4 py-3">Période</th>
              <th class="px-4 py-3">Échéance</th>
              <th class="px-4 py-3 text-right">Base</th>
              <th class="px-4 py-3 text-right">Montant</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (d of declarations; track d.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ d.libelle }}</div>
                  <div class="text-xs text-gray-400 font-mono">{{ d.codeImpot }}</div>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ d.periode }}</td>
                <td class="px-4 py-3 text-gray-600">{{ formatDate(d.dateEcheance) }}</td>
                <td class="px-4 py-3 text-right text-gray-600">{{ d.montantBase ? fmt(d.montantBase) : '—' }}</td>
                <td class="px-4 py-3 text-right font-semibold text-gray-900">{{ d.montantImpot ? fmt(d.montantImpot) : '—' }}</td>
                <td class="px-4 py-3">
                  <span [class]="'px-2 py-0.5 rounded-full text-xs font-medium ' + statutCss(d.statut)">
                    {{ statutLabel(d.statut) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button (click)="ouvrirModifier(d.id)" class="text-blue-600 hover:underline text-xs">Modifier</button>
                    <button (click)="supprimer(d.id)" class="text-red-500 hover:underline text-xs">Suppr.</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  }

</div>

<!-- ── Modal créer/modifier ─────────────────────────────────────────────── -->
@if (modalOuvert) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
      <h2 class="text-lg font-bold text-gray-900">{{ editId ? 'Modifier la déclaration' : 'Nouvelle déclaration' }}</h2>

      @if (!editId) {
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Code impôt</label>
          <input [(ngModel)]="form.codeImpot" class="input-field" placeholder="Ex: BF_TVA">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Libellé</label>
          <input [(ngModel)]="form.libelle" class="input-field" placeholder="TVA 18%">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Période</label>
            <input [(ngModel)]="form.periode" class="input-field" placeholder="2025-01">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date d'échéance</label>
            <input [(ngModel)]="form.dateEcheance" type="date" class="input-field">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Base de calcul (XOF)</label>
            <input [(ngModel)]="form.montantBase" type="number" class="input-field" placeholder="0">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Montant impôt (XOF)</label>
            <input [(ngModel)]="form.montantImpot" type="number" class="input-field" placeholder="0">
          </div>
        </div>
      } @else {
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Statut</label>
          <select [(ngModel)]="updateForm.statut" class="input-field">
            @for (s of statuts; track s.val) { <option [value]="s.val">{{ s.label }}</option> }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Base (XOF)</label>
            <input [(ngModel)]="updateForm.montantBase" type="number" class="input-field">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Montant impôt (XOF)</label>
            <input [(ngModel)]="updateForm.montantImpot" type="number" class="input-field">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Référence paiement</label>
          <input [(ngModel)]="updateForm.referencePaiement" class="input-field" placeholder="Virement/Reçu n°...">
        </div>
      }

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea [(ngModel)]="editId ? updateForm.notes : form.notes" rows="2"
                  class="input-field resize-none" placeholder="Observations..."></textarea>
      </div>

      @if (erreur) { <p class="text-red-500 text-sm">{{ erreur }}</p> }

      <div class="flex justify-end gap-2 pt-2">
        <button (click)="fermerModal()" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="sauvegarder()" [disabled]="loading"
                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
          {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
}
`,
  styles: [`
    .input-field { @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500; }
  `]
})
export class GestionFiscaleComponent implements OnInit {
  private svc = inject(GestionFiscaleService);
  private cdr = inject(ChangeDetectorRef);

  tab: 'calendrier' | 'declarations' = 'calendrier';
  annee = new Date().getFullYear();
  annees = Array.from({ length: 5 }, (_, i) => this.annee - 2 + i);

  calendrier: CalendrierFiscalItem[] = [];
  declarations: DeclarationFiscaleResponse[] = [];
  statuts = STATUTS;

  modalOuvert = false;
  editId: string | null = null;
  loading = false;
  erreur = '';

  form: DeclarationFiscaleSaveRequest = this.emptyForm();
  updateForm: DeclarationFiscaleUpdateRequest = {};

  get enRetardCount() {
    return this.calendrier.filter(c => this.isEnRetard(c.dateEcheance, c.statut)).length;
  }

  ngOnInit() { this.chargerCalendrier(); }

  charger() {
    if (this.tab === 'calendrier') this.chargerCalendrier();
    else this.chargerDeclarations();
  }

  chargerCalendrier() {
    this.svc.calendrier(this.annee).subscribe({ next: d => { this.calendrier = d; this.cdr.markForCheck(); } });
  }

  chargerDeclarations() {
    this.svc.findByAnnee(this.annee).subscribe({ next: d => { this.declarations = d; this.cdr.markForCheck(); } });
  }

  ouvrirCreer() {
    this.editId = null;
    this.form = this.emptyForm();
    this.erreur = '';
    this.modalOuvert = true;
  }

  ouvrirCreerDepuisCalendrier(item: CalendrierFiscalItem) {
    this.tab = 'declarations';
    this.editId = null;
    this.form = {
      codeImpot:    item.codeImpot,
      libelle:      item.libelle,
      periode:      item.periode,
      dateEcheance: item.dateEcheance,
      montantBase:  null,
      montantImpot: item.montantImpot,
      notes:        null
    };
    this.erreur = '';
    this.modalOuvert = true;
  }

  ouvrirModifier(id: string) {
    const d = this.declarations.find(x => x.id === id);
    if (!d) {
      this.chargerDeclarations();
      return;
    }
    this.editId = id;
    this.updateForm = {
      statut:            d.statut,
      montantBase:       d.montantBase,
      montantImpot:      d.montantImpot,
      referencePaiement: d.referencePaiement,
      notes:             d.notes
    };
    this.erreur = '';
    this.tab = 'declarations';
    this.modalOuvert = true;
  }

  sauvegarder() {
    this.loading = true;
    this.erreur = '';
    const obs = this.editId
      ? this.svc.update(this.editId, this.updateForm)
      : this.svc.create(this.form);
    obs.subscribe({
      next: () => { this.fermerModal(); this.chargerDeclarations(); this.chargerCalendrier(); },
      error: (e) => { this.erreur = e.error?.message || 'Erreur'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer cette déclaration ?')) return;
    this.svc.delete(id).subscribe({ next: () => this.chargerDeclarations() });
  }

  fermerModal() { this.modalOuvert = false; this.loading = false; this.cdr.markForCheck(); }

  isEnRetard(dateStr: string, statut: StatutDeclarationFiscale | null) {
    if (statut === 'PAYEE' || statut === 'DECLAREE') return false;
    return new Date(dateStr) < new Date();
  }

  formatDate(d: string) {
    return d ? new Date(d).toLocaleDateString('fr-FR') : '—';
  }

  fmt(v: number | null) {
    if (v == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(v);
  }

  statutLabel(s: StatutDeclarationFiscale | null) {
    if (!s) return 'À faire';
    return STATUTS.find(x => x.val === s)?.label ?? s;
  }

  statutCss(s: StatutDeclarationFiscale | null) {
    if (!s) return 'bg-gray-100 text-gray-700';
    return STATUTS.find(x => x.val === s)?.css ?? 'bg-gray-100 text-gray-700';
  }

  tabClass(t: string) {
    const base = 'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ';
    return this.tab === t
      ? base + 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
      : base + 'text-gray-500 hover:text-gray-700';
  }

  private emptyForm(): DeclarationFiscaleSaveRequest {
    return {
      codeImpot:    '',
      libelle:      '',
      periode:      '',
      dateEcheance: '',
      montantBase:  null,
      montantImpot: null,
      notes:        null
    };
  }
}
