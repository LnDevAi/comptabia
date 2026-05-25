import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegularisationService } from '../../core/services/regularisation.service';
import {
  RegularisationResponse, RegularisationSaveRequest, TypeRegularisation
} from '../../core/models/regularisation.model';

const TYPE_INFO: Record<TypeRegularisation, { label: string; color: string; exemple: string }> = {
  CCA: { label: 'Charge constatée d\'avance', color: 'bg-blue-100 text-blue-700',   exemple: 'Loyer payé d\'avance, prime assurance…' },
  PCA: { label: 'Produit constaté d\'avance',  color: 'bg-purple-100 text-purple-700', exemple: 'Abonnement encaissé d\'avance…' },
  CAP: { label: 'Charge à payer',              color: 'bg-orange-100 text-orange-700', exemple: 'Facture non reçue, intérêts courus…' },
  PAR: { label: 'Produit à recevoir',          color: 'bg-green-100 text-green-700',   exemple: 'Produit couru non facturé…' },
};

@Component({
  selector: 'app-regularisations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Régularisations comptables</h1>
      <p class="text-sm text-gray-500 mt-0.5">CCA · PCA · CAP · PAR — Écritures de fin de période SYSCOHADA</p>
    </div>
    <div class="flex items-center gap-3">
      <select [(ngModel)]="exercice" (change)="charger()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        @for (y of exercices; track y) {
          <option [value]="y">{{ y }}</option>
        }
      </select>
      <button (click)="openForm()"
              class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
        + Nouvelle régularisation
      </button>
    </div>
  </div>

  <!-- Légende types -->
  <div class="grid grid-cols-4 gap-3">
    @for (t of typeKeys; track t) {
      <div class="bg-white border border-gray-200 rounded-xl p-3 space-y-1">
        <span class="px-2 py-0.5 rounded text-xs font-bold" [ngClass]="typeInfo(t).color">{{ t }}</span>
        <p class="text-xs font-medium text-gray-700">{{ typeInfo(t).label }}</p>
        <p class="text-xs text-gray-400">{{ typeInfo(t).exemple }}</p>
      </div>
    }
  </div>

  <!-- Stats -->
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p class="text-2xl font-bold text-gray-900">{{ regularisations.length }}</p>
      <p class="text-xs text-gray-500 mt-0.5">Total {{ exercice }}</p>
    </div>
    <div class="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p class="text-2xl font-bold text-orange-600">{{ count('EN_ATTENTE') }}</p>
      <p class="text-xs text-gray-500 mt-0.5">En attente</p>
    </div>
    <div class="bg-white border border-gray-200 rounded-xl p-4 text-center">
      <p class="text-2xl font-bold text-green-600">{{ count('COMPTABILISEE') + count('EXTOURNEE') }}</p>
      <p class="text-xs text-gray-500 mt-0.5">Comptabilisées</p>
    </div>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (loading) {
      <p class="text-sm text-gray-400 text-center py-10">Chargement…</p>
    } @else if (regularisations.length === 0) {
      <p class="text-sm text-gray-400 text-center py-10">Aucune régularisation pour {{ exercice }}.</p>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
          <tr>
            <th class="px-4 py-2 text-left">Type</th>
            <th class="px-4 py-2 text-left">Libellé</th>
            <th class="px-4 py-2 text-center">Schéma</th>
            <th class="px-4 py-2 text-right">Montant</th>
            <th class="px-4 py-2 text-center">Date rég.</th>
            <th class="px-4 py-2 text-center">Date extourne</th>
            <th class="px-4 py-2 text-center">Statut</th>
            <th class="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          @for (r of regularisations; track r.id) {
            <tr class="border-t border-gray-100 hover:bg-gray-50">
              <td class="px-4 py-2">
                <span class="px-2 py-0.5 rounded text-xs font-bold" [ngClass]="typeInfo(r.type).color">
                  {{ r.type }}
                </span>
              </td>
              <td class="px-4 py-2 font-medium text-gray-800 max-w-xs">
                <p class="truncate">{{ r.libelle }}</p>
                <p class="text-xs text-gray-400 font-mono">
                  {{ r.compteRegularisation }} ↔ {{ r.compteContrepartie }}
                </p>
              </td>
              <td class="px-4 py-2 text-center text-xs text-gray-500 max-w-xs">
                <span class="hidden xl:block truncate">{{ schemaEcriture(r) }}</span>
                <span class="xl:hidden">{{ r.compteRegularisation }}/{{ r.compteContrepartie }}</span>
              </td>
              <td class="px-4 py-2 text-right font-semibold text-gray-900">{{ fmt(r.montant) }}</td>
              <td class="px-4 py-2 text-center text-gray-600">{{ r.dateRegularisation | date:'dd/MM/yyyy' }}</td>
              <td class="px-4 py-2 text-center text-gray-500">{{ r.dateExtourne | date:'dd/MM/yyyy' }}</td>
              <td class="px-4 py-2 text-center">
                <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                      [ngClass]="statutClass(r.statut)">
                  {{ r.statut }}
                </span>
              </td>
              <td class="px-4 py-2 text-center">
                <div class="flex items-center justify-center gap-1 flex-wrap">
                  @if (r.statut === 'EN_ATTENTE') {
                    <button (click)="editReg(r)"
                            class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50">
                      Modifier
                    </button>
                    <button (click)="comptabiliser(r)"
                            class="px-2 py-1 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium">
                      Comptabiliser
                    </button>
                    <button (click)="supprimer(r.id)"
                            class="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50">
                      ✕
                    </button>
                  }
                  @if (r.statut === 'COMPTABILISEE') {
                    <button (click)="extourner(r)"
                            class="px-2 py-1 text-xs rounded border border-purple-300 text-purple-700 hover:bg-purple-50 font-medium">
                      Extourner
                    </button>
                  }
                  @if (r.statut === 'EXTOURNEE') {
                    <span class="text-xs text-green-600 font-medium">✓ Terminée</span>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    }
  </div>

  <!-- Toast -->
  @if (toast) {
    <div class="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
         [ngClass]="toastError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'">
      {{ toast }}
    </div>
  }

  <!-- Modal formulaire -->
  @if (showForm) {
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
         (click)="closeForm()">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4"
           (click)="$event.stopPropagation()">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ editId ? 'Modifier la régularisation' : 'Nouvelle régularisation' }}
        </h2>

        <!-- Type -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Type *</label>
          <select [(ngModel)]="form.type" (change)="onTypeChange()"
                  class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
            @for (t of typeKeys; track t) {
              <option [value]="t">{{ t }} — {{ typeInfo(t).label }}</option>
            }
          </select>
          <p class="text-xs text-gray-400 mt-1">{{ typeInfo(form.type).exemple }}</p>
        </div>

        <!-- Schéma comptable -->
        <div class="bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono">
          {{ descriptionType() }}
        </div>

        <div class="grid grid-cols-2 gap-3">
          <!-- Libellé -->
          <div class="col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Libellé *</label>
            <input [(ngModel)]="form.libelle" type="text"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Compte contrepartie -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">
              Compte {{ form.type === 'CCA' || form.type === 'CAP' ? 'de charge (6xx)' : 'de produit (7xx)' }} *
            </label>
            <input [(ngModel)]="form.compteContrepartie" type="text"
                   [placeholder]="form.type === 'CCA' || form.type === 'CAP' ? '613, 622, 661…' : '706, 758…'"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Montant -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Montant *</label>
            <input [(ngModel)]="form.montant" type="number" min="0" step="0.01"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Date régularisation -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date de régularisation *</label>
            <input [(ngModel)]="form.dateRegularisation" type="date"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <!-- Date extourne -->
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date d'extourne *</label>
            <input [(ngModel)]="form.dateExtourne" type="date"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>
        </div>

        @if (formError) {
          <p class="text-sm text-red-600">{{ formError }}</p>
        }

        <div class="flex justify-end gap-2 pt-2">
          <button (click)="closeForm()"
                  class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button (click)="save()" [disabled]="saving"
                  class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `
})
export class RegularisationsComponent implements OnInit {

  private svc = inject(RegularisationService);
  private cdr = inject(ChangeDetectorRef);

  readonly typeKeys: TypeRegularisation[] = ['CCA', 'PCA', 'CAP', 'PAR'];

  exercice = new Date().getFullYear();
  exercices = Array.from({ length: 5 }, (_, i) => this.exercice - i);

  regularisations: RegularisationResponse[] = [];
  loading = false;
  showForm = false;
  editId: string | null = null;
  saving = false;
  formError = '';
  toast = '';
  toastError = false;

  form: RegularisationSaveRequest = this.emptyForm();

  ngOnInit() { this.charger(); }

  charger() {
    this.loading = true;
    this.svc.list(this.exercice).subscribe({
      next: d => { this.regularisations = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  openForm() {
    this.editId = null;
    this.form = this.emptyForm();
    this.formError = '';
    this.showForm = true;
  }

  editReg(r: RegularisationResponse) {
    this.editId = r.id;
    this.form = {
      type: r.type, libelle: r.libelle, compteContrepartie: r.compteContrepartie,
      montant: r.montant, exercice: r.exercice,
      dateRegularisation: r.dateRegularisation, dateExtourne: r.dateExtourne
    };
    this.formError = '';
    this.showForm = true;
  }

  closeForm() { this.showForm = false; }

  onTypeChange() {
    this.form.compteContrepartie = '';
  }

  save() {
    if (!this.form.libelle || !this.form.compteContrepartie || !this.form.montant) {
      this.formError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.saving = true;
    const obs = this.editId
      ? this.svc.update(this.editId, this.form)
      : this.svc.create(this.form);

    obs.subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.charger();
        this.showToast('Régularisation enregistrée');
      },
      error: () => {
        this.saving = false;
        this.formError = 'Une erreur est survenue.';
        this.cdr.detectChanges();
      }
    });
  }

  comptabiliser(r: RegularisationResponse) {
    if (!confirm(`Comptabiliser "${r.libelle}" — DR/CR ${r.compteRegularisation}/${r.compteContrepartie} — ${this.fmt(r.montant)} ?`)) return;
    this.svc.comptabiliser(r.id).subscribe({
      next: updated => {
        this.updateRow(updated);
        this.showToast('Écriture de régularisation générée (OD VALIDÉE)');
      },
      error: () => this.showToast('Erreur lors de la comptabilisation', true)
    });
  }

  extourner(r: RegularisationResponse) {
    if (!confirm(`Générer l'extourne au ${r.dateExtourne} pour "${r.libelle}" ?`)) return;
    this.svc.extourner(r.id).subscribe({
      next: updated => {
        this.updateRow(updated);
        this.showToast('Écriture d\'extourne générée');
      },
      error: () => this.showToast('Erreur lors de l\'extourne', true)
    });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer cette régularisation ?')) return;
    this.svc.delete(id).subscribe(() => {
      this.regularisations = this.regularisations.filter(r => r.id !== id);
      this.showToast('Supprimé');
      this.cdr.detectChanges();
    });
  }

  count(statut: string): number {
    return this.regularisations.filter(r => r.statut === statut).length;
  }

  typeInfo(t: TypeRegularisation) { return TYPE_INFO[t]; }

  schemaEcriture(r: RegularisationResponse): string {
    switch (r.type) {
      case 'CCA': return `DR ${r.compteRegularisation} / CR ${r.compteContrepartie}`;
      case 'PCA': return `DR ${r.compteContrepartie} / CR ${r.compteRegularisation}`;
      case 'CAP': return `DR ${r.compteContrepartie} / CR ${r.compteRegularisation}`;
      case 'PAR': return `DR ${r.compteRegularisation} / CR ${r.compteContrepartie}`;
    }
  }

  descriptionType(): string {
    switch (this.form.type) {
      case 'CCA': return `DR 476 Charges const. d'avance / CR ${this.form.compteContrepartie || '6xx'}`;
      case 'PCA': return `DR ${this.form.compteContrepartie || '7xx'} / CR 477 Produits const. d'avance`;
      case 'CAP': return `DR ${this.form.compteContrepartie || '6xx'} / CR 408 Fourn. fact. non parvenues`;
      case 'PAR': return `DR 418 Clients prod. à recevoir / CR ${this.form.compteContrepartie || '7xx'}`;
    }
  }

  statutClass(s: string): string {
    if (s === 'EN_ATTENTE')    return 'bg-orange-100 text-orange-700';
    if (s === 'COMPTABILISEE') return 'bg-blue-100 text-blue-700';
    return 'bg-green-100 text-green-700';
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  private updateRow(updated: RegularisationResponse) {
    const idx = this.regularisations.findIndex(r => r.id === updated.id);
    if (idx >= 0) this.regularisations[idx] = updated;
    this.cdr.detectChanges();
  }

  private emptyForm(): RegularisationSaveRequest {
    const year = new Date().getFullYear();
    const dec31 = `${year}-12-31`;
    const jan01 = `${year + 1}-01-01`;
    return {
      type: 'CCA', libelle: '', compteContrepartie: '',
      montant: 0, exercice: year,
      dateRegularisation: dec31, dateExtourne: jan01
    };
  }

  private showToast(msg: string, error = false) {
    this.toast = msg;
    this.toastError = error;
    this.cdr.detectChanges();
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3500);
  }
}
