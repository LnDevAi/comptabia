import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiersService } from '../../core/services/tiers.service';
import { Tiers, TiersRequest, TiersStats, TypeTiers } from '../../core/models/tiers.model';
import { PageResponse } from '../../core/models/ecriture.model';

type FilterType = TypeTiers | '';

interface FormState {
  code: string; nom: string; type: TypeTiers;
  email: string; telephone: string; adresse: string; compteNumero: string;
}

function blankForm(): FormState {
  return { code: '', nom: '', type: 'CLIENT', email: '', telephone: '', adresse: '', compteNumero: '' };
}

const TYPE_META: Record<TypeTiers, { label: string; css: string }> = {
  CLIENT:      { label: 'Client',      css: 'bg-green-100 text-green-700' },
  FOURNISSEUR: { label: 'Fournisseur', css: 'bg-orange-100 text-orange-700' },
  AUTRE:       { label: 'Autre',       css: 'bg-gray-100 text-gray-600' },
};

@Component({
  selector: 'app-tiers',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-6xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Tiers</h1>
      <p class="text-sm text-gray-500 mt-0.5">Clients, fournisseurs et autres tiers liés aux comptes de classe 4</p>
    </div>
    <button (click)="openCreate()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
      + Nouveau tiers
    </button>
  </div>

  <!-- Stats cards -->
  @if (stats()) {
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Total</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats()!.total }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-green-600 uppercase tracking-wide">Clients</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats()!.clients }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-orange-600 uppercase tracking-wide">Fournisseurs</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats()!.fournisseurs }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-blue-600 uppercase tracking-wide">Actifs</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats()!.actifs }}</p>
    </div>
  </div>
  }

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 items-center">
    <select [(ngModel)]="filterType" (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Tous les types</option>
      <option value="CLIENT">Client</option>
      <option value="FOURNISSEUR">Fournisseur</option>
      <option value="AUTRE">Autre</option>
    </select>

    <input [(ngModel)]="filterSearch" (ngModelChange)="onSearchChange()"
           placeholder="Rechercher par nom ou code…"
           class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500" />

    <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
      <input type="checkbox" [(ngModel)]="filterActifOnly" (ngModelChange)="onFilterChange()"
             class="rounded border-gray-300" />
      Actifs seulement
    </label>

    @if (filterType || filterSearch || filterActifOnly) {
    <button (click)="resetFilters()"
            class="text-xs text-gray-500 hover:text-gray-700 underline">
      Réinitialiser
    </button>
    }

    <span class="ml-auto text-sm text-gray-400">
      {{ page()?.totalElements ?? 0 }} tiers
    </span>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (loading()) {
      <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
    } @else if (error()) {
      <div class="flex items-center justify-center h-40 text-red-500 text-sm">{{ error() }}</div>
    } @else if (!page() || page()!.content.length === 0) {
      <div class="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
        <span class="text-3xl">👥</span>
        <span>Aucun tiers trouvé. Créez votre premier client ou fournisseur.</span>
      </div>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wide">Code</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wide">Nom</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wide">Type</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wide">Contact</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wide">Compte lié</th>
            <th class="px-4 py-3 text-left font-medium text-gray-500 uppercase text-xs tracking-wide">Statut</th>
            <th class="px-4 py-3 text-right font-medium text-gray-500 uppercase text-xs tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (t of page()!.content; track t.id) {
          <tr class="hover:bg-gray-50 transition-colors" [class.opacity-50]="!t.actif">
            <td class="px-4 py-3 font-mono text-gray-700 font-medium">{{ t.code }}</td>
            <td class="px-4 py-3 text-gray-900 font-medium">{{ t.nom }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="typeMeta(t.type).css">
                {{ typeMeta(t.type).label }}
              </span>
            </td>
            <td class="px-4 py-3 text-gray-500">
              @if (t.email) { <div>{{ t.email }}</div> }
              @if (t.telephone) { <div>{{ t.telephone }}</div> }
              @if (!t.email && !t.telephone) { <span class="text-gray-300">—</span> }
            </td>
            <td class="px-4 py-3 font-mono text-gray-500">{{ t.compteNumero || '—' }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="t.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'">
                {{ t.actif ? 'Actif' : 'Inactif' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-2">
                <button (click)="openEdit(t)"
                        class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600">
                  Modifier
                </button>
                <button (click)="toggleActif(t)"
                        class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600">
                  {{ t.actif ? 'Désactiver' : 'Activer' }}
                </button>
                <button (click)="confirmDelete(t)"
                        class="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600">
                  Suppr.
                </button>
              </div>
            </td>
          </tr>
          }
        </tbody>
      </table>

      <!-- Pagination -->
      @if (page()!.totalPages > 1) {
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-500">
          Page {{ currentPage + 1 }} / {{ page()!.totalPages }}
        </span>
        <div class="flex gap-2">
          <button [disabled]="currentPage === 0" (click)="goPage(currentPage - 1)"
                  class="text-xs px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            ← Préc.
          </button>
          <button [disabled]="currentPage >= page()!.totalPages - 1" (click)="goPage(currentPage + 1)"
                  class="text-xs px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
            Suiv. →
          </button>
        </div>
      </div>
      }
    }
  </div>

  <!-- Create / Edit panel -->
  @if (showForm()) {
  <div class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
       (click)="closeForm()">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5"
         (click)="$event.stopPropagation()">

      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">
          {{ editingId() ? 'Modifier le tiers' : 'Nouveau tiers' }}
        </h2>
        <button (click)="closeForm()" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Code -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Code <span class="text-red-500">*</span></label>
          <input [(ngModel)]="form.code" maxlength="20" placeholder="CLI001"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase" />
        </div>
        <!-- Type -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Type <span class="text-red-500">*</span></label>
          <select [(ngModel)]="form.type"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="CLIENT">Client</option>
            <option value="FOURNISSEUR">Fournisseur</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
      </div>

      <!-- Nom -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Nom <span class="text-red-500">*</span></label>
        <input [(ngModel)]="form.nom" maxlength="255" placeholder="Nom du tiers"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <!-- Email -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input [(ngModel)]="form.email" type="email" placeholder="contact@exemple.com"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <!-- Téléphone -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
          <input [(ngModel)]="form.telephone" placeholder="+226 XX XX XX XX"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <!-- Compte lié -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">
          Compte comptable lié
          <span class="ml-1 text-gray-400 font-normal">(ex: 411001 pour client, 401001 pour fournisseur)</span>
        </label>
        <input [(ngModel)]="form.compteNumero" maxlength="20" placeholder="411001"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" />
      </div>

      <!-- Adresse -->
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
        <textarea [(ngModel)]="form.adresse" rows="2" placeholder="Adresse complète…"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
      </div>

      @if (formError()) {
      <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ formError() }}</p>
      }

      <div class="flex gap-3 justify-end pt-1">
        <button (click)="closeForm()"
                class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
          Annuler
        </button>
        <button (click)="saveForm()" [disabled]="saving()"
                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors">
          {{ saving() ? 'Enregistrement…' : (editingId() ? 'Enregistrer' : 'Créer') }}
        </button>
      </div>
    </div>
  </div>
  }

  <!-- Delete confirmation dialog -->
  @if (deleteTarget()) {
  <div class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-800">Supprimer ce tiers ?</h2>
      <p class="text-sm text-gray-600">
        <span class="font-medium">{{ deleteTarget()!.nom }}</span> ({{ deleteTarget()!.code }}) sera supprimé définitivement.
        Cette action ne peut pas être annulée.
      </p>
      <div class="flex gap-3 justify-end">
        <button (click)="deleteTarget.set(null)"
                class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
          Annuler
        </button>
        <button (click)="doDelete()"
                class="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg">
          Supprimer
        </button>
      </div>
    </div>
  </div>
  }

</div>
  `,
})
export class TiersComponent implements OnInit {

  private svc = inject(TiersService);

  page        = signal<PageResponse<Tiers> | null>(null);
  stats       = signal<TiersStats | null>(null);
  loading     = signal(false);
  error       = signal<string | null>(null);

  showForm    = signal(false);
  editingId   = signal<string | null>(null);
  saving      = signal(false);
  formError   = signal<string | null>(null);
  form: FormState = blankForm();

  deleteTarget = signal<Tiers | null>(null);

  filterType: FilterType   = '';
  filterSearch             = '';
  filterActifOnly          = false;
  currentPage              = 0;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() {
    this.loadStats();
    this.loadPage();
  }

  // ─── Data loading ─────────────────────────────────────────────────────────

  loadPage() {
    this.loading.set(true);
    this.error.set(null);
    this.svc.findAll({
      page: this.currentPage,
      type: this.filterType || undefined,
      search: this.filterSearch || undefined,
      actifOnly: this.filterActifOnly,
    }).subscribe({
      next: p  => { this.page.set(p); this.loading.set(false); },
      error: () => { this.error.set('Erreur lors du chargement des tiers.'); this.loading.set(false); },
    });
  }

  loadStats() {
    this.svc.stats().subscribe({ next: s => this.stats.set(s) });
  }

  // ─── Filters ──────────────────────────────────────────────────────────────

  onFilterChange() { this.currentPage = 0; this.loadPage(); }

  onSearchChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 0; this.loadPage(); }, 350);
  }

  resetFilters() {
    this.filterType = ''; this.filterSearch = ''; this.filterActifOnly = false;
    this.currentPage = 0; this.loadPage();
  }

  goPage(p: number) { this.currentPage = p; this.loadPage(); }

  // ─── Form ─────────────────────────────────────────────────────────────────

  openCreate() {
    this.editingId.set(null);
    this.form = blankForm();
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEdit(t: Tiers) {
    this.editingId.set(t.id);
    this.form = {
      code: t.code, nom: t.nom, type: t.type,
      email: t.email ?? '', telephone: t.telephone ?? '',
      adresse: t.adresse ?? '', compteNumero: t.compteNumero ?? '',
    };
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  saveForm() {
    if (!this.form.code.trim() || !this.form.nom.trim()) {
      this.formError.set('Le code et le nom sont obligatoires.');
      return;
    }
    const payload: TiersRequest = {
      code:         this.form.code.toUpperCase().trim(),
      nom:          this.form.nom.trim(),
      type:         this.form.type,
      email:        this.form.email || null,
      telephone:    this.form.telephone || null,
      adresse:      this.form.adresse || null,
      compteNumero: this.form.compteNumero || null,
    };

    this.saving.set(true);
    this.formError.set(null);

    const req = this.editingId()
      ? this.svc.update(this.editingId()!, payload)
      : this.svc.create(payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.loadStats();
        this.loadPage();
      },
      error: (e) => {
        this.saving.set(false);
        this.formError.set(e?.error?.message ?? 'Une erreur est survenue.');
      },
    });
  }

  // ─── Toggle actif ─────────────────────────────────────────────────────────

  toggleActif(t: Tiers) {
    this.svc.toggleActif(t.id).subscribe({
      next: () => { this.loadStats(); this.loadPage(); },
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  confirmDelete(t: Tiers) { this.deleteTarget.set(t); }

  doDelete() {
    const t = this.deleteTarget();
    if (!t) return;
    this.svc.delete(t.id).subscribe({
      next: () => {
        this.deleteTarget.set(null);
        this.loadStats();
        this.loadPage();
      },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  typeMeta(type: string) {
    return TYPE_META[type as TypeTiers] ?? { label: type, css: 'bg-gray-100 text-gray-600' };
  }
}
