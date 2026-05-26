import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GestionSocialeService } from '../../core/services/gestion-sociale.service';
import {
  OrganismeResume, CalculRequest, CalculResult,
  DeclarationSocialeResponse, DeclarationSocialeSaveRequest,
  DeclarationSocialeUpdateRequest, StatutDeclarationSociale
} from '../../core/models/social.model';

const STATUTS: { val: StatutDeclarationSociale; label: string; css: string }[] = [
  { val: 'A_FAIRE',  label: 'À faire', css: 'bg-gray-100 text-gray-700' },
  { val: 'DECLAREE', label: 'Déclarée', css: 'bg-yellow-100 text-yellow-700' },
  { val: 'PAYEE',    label: 'Payée',    css: 'bg-green-100 text-green-700' },
];

@Component({
  selector: 'app-gestion-sociale',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Gestion sociale</h1>
      <p class="text-sm text-gray-500 mt-0.5">CNSS, CARFO et cotisations sociales — Burkina Faso</p>
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-600 font-medium">Exercice</label>
      <select [(ngModel)]="annee" (ngModelChange)="chargerDeclarations()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        @for (a of annees; track a) { <option [value]="a">{{ a }}</option> }
      </select>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1">
      <button (click)="tab = 'simulateur'" [class]="tabClass('simulateur')">Simulateur CNSS/CARFO</button>
      <button (click)="tab = 'declarations'; chargerDeclarations()" [class]="tabClass('declarations')">Déclarations</button>
      <button (click)="tab = 'referentiel'; chargerOrganismes()" [class]="tabClass('referentiel')">Référentiel BF</button>
    </nav>
  </div>

  <!-- ── Simulateur ─────────────────────────────────────────────────────── -->
  @if (tab === 'simulateur') {
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Saisie -->
      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 class="font-semibold text-gray-900">Paramètres de calcul</h2>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Organisme</label>
          <select [(ngModel)]="calcReq.codeOrganisme" class="input-field">
            <option value="">— Sélectionner —</option>
            @for (o of organismes; track o.codeOrganisme) {
              <option [value]="o.codeOrganisme">{{ o.libelleOrganisme }} ({{ o.codeOrganisme }})</option>
            }
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Nombre de salariés</label>
          <input [(ngModel)]="calcReq.nbEmployes" type="number" min="1" class="input-field" placeholder="1">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Masse salariale brute (XOF)</label>
          <input [(ngModel)]="calcReq.masseSalariale" type="number" class="input-field" placeholder="0">
        </div>
        <button (click)="calculer()" [disabled]="!calcReq.codeOrganisme || loading"
                class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg text-sm disabled:opacity-50">
          {{ loading ? 'Calcul...' : 'Calculer les cotisations' }}
        </button>
      </div>

      <!-- Résultats -->
      @if (calcResult) {
        <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="font-semibold text-gray-900">{{ calcResult.libelleOrganisme }}</h2>
            @if (calcResult.plafonneApplique) {
              <span class="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Plafond appliqué</span>
            }
          </div>
          <div class="space-y-3">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Masse salariale brute</span>
              <span class="font-medium">{{ fmt(calcResult.masseSalarialeBase) }} XOF</span>
            </div>
            @if (calcResult.plafonneApplique) {
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Base ouvrant droit (plafonnée)</span>
                <span class="font-medium text-orange-600">{{ fmt(calcResult.masseSalarialeOuvrantDroit) }} XOF</span>
              </div>
            }
            <hr class="border-gray-100">
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Part salarié</span>
              <span class="font-medium text-blue-700">{{ fmt(calcResult.montantSalarie) }} XOF</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Part patronale</span>
              <span class="font-medium text-indigo-700">{{ fmt(calcResult.montantPatronal) }} XOF</span>
            </div>
            <hr class="border-gray-100">
            <div class="flex justify-between text-base font-bold">
              <span>Total à verser</span>
              <span class="text-green-700">{{ fmt(calcResult.montantTotal) }} XOF</span>
            </div>
          </div>
          <button (click)="preRemplirDeclaration()"
                  class="w-full mt-2 border border-blue-600 text-blue-600 hover:bg-blue-50 font-medium py-2 rounded-lg text-sm">
            Créer la déclaration depuis ce calcul
          </button>
        </div>
      } @else {
        <div class="bg-gray-50 rounded-xl border border-dashed border-gray-200 p-6 flex flex-col items-center justify-center text-gray-400 min-h-48">
          <svg class="w-10 h-10 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
          </svg>
          <p class="text-sm">Résultat du calcul</p>
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
              <th class="px-4 py-3">Organisme</th>
              <th class="px-4 py-3">Période</th>
              <th class="px-4 py-3">Échéance</th>
              <th class="px-4 py-3 text-right">Salarié</th>
              <th class="px-4 py-3 text-right">Patronal</th>
              <th class="px-4 py-3 text-right">Total</th>
              <th class="px-4 py-3">Statut</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (d of declarations; track d.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900">{{ d.libelleOrganisme }}</div>
                  <div class="text-xs text-gray-400">{{ d.nbEmployes }} sal.</div>
                </td>
                <td class="px-4 py-3 text-gray-600">{{ d.periode }}</td>
                <td class="px-4 py-3 text-gray-600">{{ formatDate(d.dateEcheance) }}</td>
                <td class="px-4 py-3 text-right text-blue-700 font-medium">{{ fmt(d.montantSalarie) }}</td>
                <td class="px-4 py-3 text-right text-indigo-700 font-medium">{{ fmt(d.montantPatronal) }}</td>
                <td class="px-4 py-3 text-right font-bold text-gray-900">{{ fmt(d.montantTotal) }}</td>
                <td class="px-4 py-3">
                  <span [class]="'px-2 py-0.5 rounded-full text-xs font-medium ' + statutCss(d.statut)">
                    {{ statutLabel(d.statut) }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex gap-2">
                    <button (click)="ouvrirModifier(d)" class="text-blue-600 hover:underline text-xs">Modifier</button>
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

  <!-- ── Référentiel ────────────────────────────────────────────────────── -->
  @if (tab === 'referentiel') {
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      @for (o of organismes; track o.codeOrganisme) {
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div>
            <div class="text-xs font-mono text-gray-400">{{ o.codeOrganisme }}</div>
            <div class="font-semibold text-gray-900 mt-0.5">{{ o.libelleOrganisme }}</div>
          </div>
          <div class="space-y-1.5 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Part salarié</span>
              <span class="font-medium text-blue-700">{{ fmtTaux(o.tauxSalarieTotal) }}%</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Part patronale</span>
              <span class="font-medium text-indigo-700">{{ fmtTaux(o.tauxPatronalTotal) }}%</span>
            </div>
            @if (o.plafondMensuel) {
              <div class="flex justify-between text-xs text-gray-400 border-t border-gray-100 pt-1.5">
                <span>Plafond mensuel</span>
                <span>{{ fmt(o.plafondMensuel) }} XOF</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  }

</div>

<!-- ── Modal déclaration ─────────────────────────────────────────────────── -->
@if (modalOuvert) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
      <h2 class="text-lg font-bold text-gray-900">{{ editId ? 'Modifier la déclaration' : 'Nouvelle déclaration sociale' }}</h2>

      @if (!editId) {
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Organisme</label>
            <select [(ngModel)]="saveForm.codeOrganisme" (ngModelChange)="onOrganismeChange()" class="input-field">
              <option value="">— Choisir —</option>
              @for (o of organismes; track o.codeOrganisme) {
                <option [value]="o.codeOrganisme">{{ o.libelleOrganisme }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Période (ex: 2025-01)</label>
            <input [(ngModel)]="saveForm.periode" class="input-field" placeholder="2025-01">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date échéance</label>
            <input [(ngModel)]="saveForm.dateEcheance" type="date" class="input-field">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Nb salariés</label>
            <input [(ngModel)]="saveForm.nbEmployes" type="number" class="input-field" placeholder="1">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Masse salariale brute (XOF)</label>
          <input [(ngModel)]="saveForm.masseSalariale" type="number" class="input-field">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Part salarié (XOF)</label>
            <input [(ngModel)]="saveForm.montantSalarie" type="number" class="input-field">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Part patronale (XOF)</label>
            <input [(ngModel)]="saveForm.montantPatronal" type="number" class="input-field">
          </div>
        </div>
      } @else {
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Statut</label>
          <select [(ngModel)]="updateForm.statut" class="input-field">
            @for (s of statuts; track s.val) { <option [value]="s.val">{{ s.label }}</option> }
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Référence paiement</label>
          <input [(ngModel)]="updateForm.referencePaiement" class="input-field" placeholder="Reçu / Virement n°...">
        </div>
      }

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
        <textarea [(ngModel)]="editId ? updateForm.notes : saveForm.notes" rows="2"
                  class="input-field resize-none"></textarea>
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
export class GestionSocialeComponent implements OnInit {
  private svc = inject(GestionSocialeService);
  private cdr = inject(ChangeDetectorRef);

  tab: 'simulateur' | 'declarations' | 'referentiel' = 'simulateur';
  annee = new Date().getFullYear();
  annees = Array.from({ length: 5 }, (_, i) => this.annee - 2 + i);

  organismes: OrganismeResume[] = [];
  declarations: DeclarationSocialeResponse[] = [];
  statuts = STATUTS;

  calcReq: CalculRequest = { codeOrganisme: '', nbEmployes: 1, masseSalariale: 0 };
  calcResult: CalculResult | null = null;

  modalOuvert = false;
  editId: string | null = null;
  loading = false;
  erreur = '';

  saveForm: DeclarationSocialeSaveRequest = this.emptySave();
  updateForm: DeclarationSocialeUpdateRequest = {};

  ngOnInit() {
    this.chargerOrganismes();
  }

  chargerOrganismes() {
    this.svc.organismesByPays('BF').subscribe({ next: d => { this.organismes = d; this.cdr.markForCheck(); } });
  }

  chargerDeclarations() {
    this.svc.findByAnnee(this.annee).subscribe({ next: d => { this.declarations = d; this.cdr.markForCheck(); } });
  }

  calculer() {
    if (!this.calcReq.codeOrganisme) return;
    this.loading = true;
    this.svc.calculer('BF', this.calcReq).subscribe({
      next: r => { this.calcResult = r; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; }
    });
  }

  preRemplirDeclaration() {
    if (!this.calcResult) return;
    const o = this.organismes.find(x => x.codeOrganisme === this.calcResult!.codeOrganisme);
    this.saveForm = {
      codeOrganisme:    this.calcResult.codeOrganisme,
      libelleOrganisme: this.calcResult.libelleOrganisme,
      periode:          `${this.annee}-`,
      dateEcheance:     '',
      nbEmployes:       this.calcReq.nbEmployes,
      masseSalariale:   this.calcResult.masseSalarialeBase,
      montantSalarie:   this.calcResult.montantSalarie,
      montantPatronal:  this.calcResult.montantPatronal,
      notes:            null
    };
    this.editId = null;
    this.erreur = '';
    this.tab = 'declarations';
    this.modalOuvert = true;
    this.cdr.markForCheck();
  }

  onOrganismeChange() {
    const o = this.organismes.find(x => x.codeOrganisme === this.saveForm.codeOrganisme);
    if (o) this.saveForm.libelleOrganisme = o.libelleOrganisme;
  }

  ouvrirCreer() {
    this.editId = null;
    this.saveForm = this.emptySave();
    this.erreur = '';
    this.modalOuvert = true;
  }

  ouvrirModifier(d: DeclarationSocialeResponse) {
    this.editId = d.id;
    this.updateForm = { statut: d.statut, referencePaiement: d.referencePaiement, notes: d.notes };
    this.erreur = '';
    this.modalOuvert = true;
  }

  sauvegarder() {
    this.loading = true;
    this.erreur = '';
    const obs = this.editId
      ? this.svc.update(this.editId, this.updateForm)
      : this.svc.create(this.saveForm);
    obs.subscribe({
      next: () => { this.fermerModal(); this.chargerDeclarations(); },
      error: (e) => { this.erreur = e.error?.message || 'Erreur'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer cette déclaration ?')) return;
    this.svc.delete(id).subscribe({ next: () => this.chargerDeclarations() });
  }

  fermerModal() { this.modalOuvert = false; this.loading = false; this.cdr.markForCheck(); }

  fmt(v: number | null) {
    if (v == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(v);
  }

  fmtTaux(v: number) {
    return (v * 100).toFixed(2).replace(/\.?0+$/, '');
  }

  formatDate(d: string) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }
  statutLabel(s: StatutDeclarationSociale) { return STATUTS.find(x => x.val === s)?.label ?? s; }
  statutCss(s: StatutDeclarationSociale) { return STATUTS.find(x => x.val === s)?.css ?? 'bg-gray-100 text-gray-700'; }

  tabClass(t: string) {
    const base = 'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ';
    return this.tab === t
      ? base + 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
      : base + 'text-gray-500 hover:text-gray-700';
  }

  private emptySave(): DeclarationSocialeSaveRequest {
    return {
      codeOrganisme: '', libelleOrganisme: '', periode: '',
      dateEcheance: '', nbEmployes: 1, masseSalariale: 0,
      montantSalarie: 0, montantPatronal: 0, notes: null
    };
  }
}
