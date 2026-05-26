import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImmobilisationService } from '../../core/services/immobilisation.service';
import {
  Immobilisation, ImmoRequest, ImmoStats, PlanAmortissement,
  CategorieImmo, StatutImmo
} from '../../core/models/immobilisation.model';
import { PageResponse } from '../../core/models/ecriture.model';

interface FormState {
  code: string; designation: string; categorie: CategorieImmo;
  compteNumero: string; compteAmortNumero: string;
  dateAcquisition: string; valeurBrute: string; dureeAmortissement: string;
  methode: string;
}

function blankForm(): FormState {
  return {
    code: '', designation: '', categorie: 'CORPORELLE',
    compteNumero: '', compteAmortNumero: '',
    dateAcquisition: new Date().toISOString().slice(0, 10),
    valeurBrute: '', dureeAmortissement: '5', methode: 'LINEAIRE',
  };
}

const CAT_META: Record<CategorieImmo, { label: string; css: string }> = {
  CORPORELLE:   { label: 'Corporelle',   css: 'bg-blue-100 text-blue-700'   },
  INCORPORELLE: { label: 'Incorporelle', css: 'bg-purple-100 text-purple-700' },
  FINANCIERE:   { label: 'Financière',   css: 'bg-green-100 text-green-700'  },
};

const STATUT_META: Record<StatutImmo, { label: string; css: string }> = {
  ACTIF:  { label: 'Actif',  css: 'bg-green-100 text-green-700' },
  CEDE:   { label: 'Cédé',   css: 'bg-orange-100 text-orange-700' },
  RETIRE: { label: 'Retiré', css: 'bg-gray-100 text-gray-600'   },
};

@Component({
  selector: 'app-immobilisations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-6xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Immobilisations</h1>
      <p class="text-sm text-gray-500 mt-0.5">Registre des immobilisations SYSCOHADA — classes 2, 28 et 68</p>
    </div>
    <button (click)="openCreate()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
      + Nouvelle immobilisation
    </button>
  </div>

  <!-- Stats -->
  @if (stats()) {
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Actifs</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats()!.totalActifs }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Valeur brute</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats()!.valeurBrute | number:'1.0-0' }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-orange-600 uppercase tracking-wide">Amortissements</p>
      <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats()!.cumulAmortissements | number:'1.0-0' }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-blue-600 uppercase tracking-wide">Valeur nette</p>
      <p class="text-2xl font-bold text-blue-700 mt-1">{{ stats()!.valeurNette | number:'1.0-0' }}</p>
    </div>
  </div>
  }

  <!-- Filters -->
  <div class="flex flex-wrap gap-3 items-center">
    <select [(ngModel)]="filterCategorie" (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="">Toutes catégories</option>
      <option value="CORPORELLE">Corporelle</option>
      <option value="INCORPORELLE">Incorporelle</option>
      <option value="FINANCIERE">Financière</option>
    </select>

    <select [(ngModel)]="filterStatut" (ngModelChange)="onFilterChange()"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
      <option value="ACTIF">Actives</option>
      <option value="">Tous statuts</option>
      <option value="CEDE">Cédées</option>
      <option value="RETIRE">Retirées</option>
    </select>

    <input [(ngModel)]="filterSearch" (ngModelChange)="onSearchChange()"
           placeholder="Rechercher par code ou désignation…"
           class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-500" />

    <span class="ml-auto text-sm text-gray-400">{{ page()?.totalElements ?? 0 }} immobilisation(s)</span>
  </div>

  <!-- Table -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (loading()) {
      <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
    } @else if (error()) {
      <div class="flex items-center justify-center h-40 text-red-500 text-sm">{{ error() }}</div>
    } @else if (!page() || page()!.content.length === 0) {
      <div class="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
        <span class="text-3xl">🏭</span>
        <span>Aucune immobilisation. Créez votre premier actif immobilisé.</span>
      </div>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Code</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Désignation</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Catégorie</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Valeur brute</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Cumul amort.</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">VNC</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Durée</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Statut</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (i of page()!.content; track i.id) {
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 font-mono text-gray-700 font-medium">{{ i.code }}</td>
            <td class="px-4 py-3 text-gray-900">{{ i.designation }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="catMeta(i.categorie).css">
                {{ catMeta(i.categorie).label }}
              </span>
            </td>
            <td class="px-4 py-3 text-right font-mono text-gray-700">{{ i.valeurBrute | number:'1.2-2' }}</td>
            <td class="px-4 py-3 text-right font-mono text-orange-600">{{ i.cumulAmortissement | number:'1.2-2' }}</td>
            <td class="px-4 py-3 text-right font-mono font-semibold"
                [ngClass]="i.valeurNette > 0 ? 'text-blue-700' : 'text-gray-400'">
              {{ i.valeurNette | number:'1.2-2' }}
            </td>
            <td class="px-4 py-3 text-gray-500">{{ i.dureeAmortissement }} ans</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="statutMeta(i.statut).css">
                {{ statutMeta(i.statut).label }}
              </span>
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center justify-end gap-1.5">
                <button (click)="showPlan(i)"
                        class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600">
                  Plan
                </button>
                @if (i.statut === 'ACTIF') {
                <button (click)="openDoter(i)"
                        class="text-xs px-2 py-1 rounded border border-blue-200 hover:bg-blue-50 text-blue-600">
                  Doter
                </button>
                <button (click)="openEdit(i)"
                        class="text-xs px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 text-gray-600">
                  Modifier
                </button>
                }
                @if (!amortissementsExist(i)) {
                <button (click)="confirmDelete(i)"
                        class="text-xs px-2 py-1 rounded border border-red-200 hover:bg-red-50 text-red-600">
                  Suppr.
                </button>
                }
              </div>
            </td>
          </tr>
          }
        </tbody>
      </table>

      <!-- Pagination -->
      @if (page()!.totalPages > 1) {
      <div class="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <span class="text-xs text-gray-500">Page {{ currentPage + 1 }} / {{ page()!.totalPages }}</span>
        <div class="flex gap-2">
          <button [disabled]="currentPage === 0" (click)="goPage(currentPage - 1)"
                  class="text-xs px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">← Préc.</button>
          <button [disabled]="currentPage >= page()!.totalPages - 1" (click)="goPage(currentPage + 1)"
                  class="text-xs px-3 py-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Suiv. →</button>
        </div>
      </div>
      }
    }
  </div>

  <!-- Create / Edit modal -->
  @if (showForm()) {
  <div class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
       (click)="closeForm()">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
         (click)="$event.stopPropagation()">

      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-800">
          {{ editingId() ? 'Modifier' : 'Nouvelle immobilisation' }}
        </h2>
        <button (click)="closeForm()" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Code <span class="text-red-500">*</span></label>
          <input [(ngModel)]="form.code" maxlength="20" placeholder="MAT001"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Catégorie <span class="text-red-500">*</span></label>
          <select [(ngModel)]="form.categorie"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="CORPORELLE">Corporelle</option>
            <option value="INCORPORELLE">Incorporelle</option>
            <option value="FINANCIERE">Financière</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Désignation <span class="text-red-500">*</span></label>
        <input [(ngModel)]="form.designation" maxlength="255" placeholder="Matériel informatique…"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Date d'acquisition <span class="text-red-500">*</span></label>
          <input [(ngModel)]="form.dateAcquisition" type="date"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Durée amort. (ans) <span class="text-red-500">*</span></label>
          <input [(ngModel)]="form.dureeAmortissement" type="number" min="1" max="50"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Valeur brute <span class="text-red-500">*</span></label>
        <input [(ngModel)]="form.valeurBrute" type="number" min="0.01" step="0.01" placeholder="0.00"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">
            Compte immobilisation
            <span class="text-gray-400 font-normal ml-1">(ex: 241000)</span>
          </label>
          <input [(ngModel)]="form.compteNumero" maxlength="20" placeholder="241000"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">
            Compte amortissement
            <span class="text-gray-400 font-normal ml-1">(ex: 281000)</span>
          </label>
          <input [(ngModel)]="form.compteAmortNumero" maxlength="20" placeholder="281000"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <p class="text-xs text-gray-400">
        Si les comptes sont renseignés, la dotation génère automatiquement une écriture OD
        (DR 681xxx / CR 281xxx) en brouillon.
      </p>

      @if (formError()) {
      <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ formError() }}</p>
      }

      <div class="flex gap-3 justify-end pt-1">
        <button (click)="closeForm()"
                class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
          Annuler
        </button>
        <button (click)="saveForm()" [disabled]="saving()"
                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg">
          {{ saving() ? 'Enregistrement…' : (editingId() ? 'Enregistrer' : 'Créer') }}
        </button>
      </div>
    </div>
  </div>
  }

  <!-- Plan d'amortissement modal -->
  @if (planData()) {
  <div class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4"
       (click)="planData.set(null)">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
         (click)="$event.stopPropagation()">

      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-800">Plan d'amortissement</h2>
          <p class="text-sm text-gray-500">{{ planData()!.code }} — {{ planData()!.designation }}</p>
        </div>
        <button (click)="planData.set(null)" class="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
      </div>

      <div class="flex gap-6 text-sm text-gray-600">
        <span>Valeur brute : <strong class="text-gray-900">{{ planData()!.valeurBrute | number:'1.2-2' }}</strong></span>
        <span>Durée : <strong class="text-gray-900">{{ planData()!.dureeAmortissement }} ans</strong></span>
        <span>Méthode : <strong class="text-gray-900">{{ planData()!.methode === 'DEGRESSIF' ? 'Dégressive' : 'Linéaire' }}</strong></span>
      </div>

      <table class="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Exercice</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Dotation</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cumul</th>
            <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">VNC</th>
            <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Statut</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (l of planData()!.lignes; track l.exercice) {
          <tr [ngClass]="l.comptabilisee ? 'bg-green-50' : ''">
            <td class="px-4 py-2 font-mono text-gray-700">{{ l.exercice }}</td>
            <td class="px-4 py-2 text-right font-mono">{{ l.dotation | number:'1.2-2' }}</td>
            <td class="px-4 py-2 text-right font-mono text-orange-600">{{ l.cumulAmortissement | number:'1.2-2' }}</td>
            <td class="px-4 py-2 text-right font-mono font-semibold"
                [ngClass]="l.valeurNette > 0 ? 'text-blue-700' : 'text-gray-400'">
              {{ l.valeurNette | number:'1.2-2' }}
            </td>
            <td class="px-4 py-2 text-center">
              @if (l.comptabilisee) {
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Comptabilisée</span>
              } @else {
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">À doter</span>
              }
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
  }

  <!-- Doter exercice dialog -->
  @if (doterTarget()) {
  <div class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-800">Doter l'exercice</h2>
      <p class="text-sm text-gray-600">
        Immobilisation : <strong>{{ doterTarget()!.designation }}</strong>
      </p>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Exercice</label>
        <input [(ngModel)]="doterExercice" type="number" [min]="doterTarget()!.dateAcquisition.slice(0,4)"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      @if (doterError()) {
        <p class="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{{ doterError() }}</p>
      }
      @if (doterSuccess()) {
        <div class="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 space-y-1">
          <p class="font-medium">Dotation enregistrée.</p>
          <p>Montant : <strong>{{ doterSuccess()!.dotation | number:'1.2-2' }}</strong></p>
          @if (doterSuccess()!.ecritureId) {
            <p class="text-xs text-green-600">Écriture OD générée en brouillon.</p>
          } @else {
            <p class="text-xs text-gray-500">Comptes non configurés — aucune écriture générée.</p>
          }
        </div>
      }
      <div class="flex gap-3 justify-end">
        <button (click)="closeDoter()"
                class="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600">
          {{ doterSuccess() ? 'Fermer' : 'Annuler' }}
        </button>
        @if (!doterSuccess()) {
        <button (click)="runDoter()" [disabled]="dotering()"
                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg">
          {{ dotering() ? 'Enregistrement…' : 'Enregistrer la dotation' }}
        </button>
        }
      </div>
    </div>
  </div>
  }

  <!-- Delete confirmation -->
  @if (deleteTarget()) {
  <div class="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-800">Supprimer cette immobilisation ?</h2>
      <p class="text-sm text-gray-600">
        <span class="font-medium">{{ deleteTarget()!.designation }}</span> sera supprimée définitivement.
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
export class ImmobilisationsComponent implements OnInit {

  private svc = inject(ImmobilisationService);

  page     = signal<PageResponse<Immobilisation> | null>(null);
  stats    = signal<ImmoStats | null>(null);
  loading  = signal(false);
  error    = signal<string | null>(null);

  showForm  = signal(false);
  editingId = signal<string | null>(null);
  saving    = signal(false);
  formError = signal<string | null>(null);
  form: FormState = blankForm();

  planData = signal<PlanAmortissement | null>(null);

  doterTarget  = signal<Immobilisation | null>(null);
  doterExercice = new Date().getFullYear();
  dotering     = signal(false);
  doterError   = signal<string | null>(null);
  doterSuccess = signal<{ dotation: number; ecritureId: string | null } | null>(null);

  deleteTarget = signal<Immobilisation | null>(null);

  filterCategorie: CategorieImmo | '' = '';
  filterStatut:    StatutImmo | ''     = 'ACTIF';
  filterSearch                         = '';
  currentPage                          = 0;

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit() { this.loadStats(); this.loadPage(); }

  // ─── Data ─────────────────────────────────────────────────────────────────

  loadPage() {
    this.loading.set(true); this.error.set(null);
    this.svc.findAll({
      page: this.currentPage,
      categorie: this.filterCategorie || undefined,
      statut: this.filterStatut || undefined,
      search: this.filterSearch || undefined,
    }).subscribe({
      next:  p  => { this.page.set(p); this.loading.set(false); },
      error: () => { this.error.set('Erreur de chargement.'); this.loading.set(false); },
    });
  }

  loadStats() { this.svc.stats().subscribe({ next: s => this.stats.set(s) }); }

  onFilterChange() { this.currentPage = 0; this.loadPage(); }
  onSearchChange() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 0; this.loadPage(); }, 350);
  }
  goPage(p: number) { this.currentPage = p; this.loadPage(); }

  // ─── Form ─────────────────────────────────────────────────────────────────

  openCreate() {
    this.editingId.set(null); this.form = blankForm();
    this.formError.set(null); this.showForm.set(true);
  }

  openEdit(i: Immobilisation) {
    this.editingId.set(i.id);
    this.form = {
      code: i.code, designation: i.designation, categorie: i.categorie,
      compteNumero: i.compteNumero ?? '', compteAmortNumero: i.compteAmortNumero ?? '',
      dateAcquisition: i.dateAcquisition,
      valeurBrute: String(i.valeurBrute), dureeAmortissement: String(i.dureeAmortissement),
      methode: i.methode ?? 'LINEAIRE',
    };
    this.formError.set(null); this.showForm.set(true);
  }

  closeForm() { this.showForm.set(false); }

  saveForm() {
    if (!this.form.code.trim() || !this.form.designation.trim() ||
        !this.form.dateAcquisition || !this.form.valeurBrute) {
      this.formError.set('Les champs obligatoires doivent être renseignés.'); return;
    }
    const payload: ImmoRequest = {
      code:               this.form.code.toUpperCase().trim(),
      designation:        this.form.designation.trim(),
      categorie:          this.form.categorie,
      compteNumero:       this.form.compteNumero || null,
      compteAmortNumero:  this.form.compteAmortNumero || null,
      dateAcquisition:    this.form.dateAcquisition,
      valeurBrute:        parseFloat(this.form.valeurBrute),
      dureeAmortissement: parseInt(this.form.dureeAmortissement, 10),
      methode:            this.form.methode,
    };
    this.saving.set(true); this.formError.set(null);
    const req = this.editingId()
      ? this.svc.update(this.editingId()!, payload)
      : this.svc.create(payload);
    req.subscribe({
      next: () => { this.saving.set(false); this.showForm.set(false); this.loadStats(); this.loadPage(); },
      error: (e) => { this.saving.set(false); this.formError.set(e?.error?.message ?? 'Erreur.'); },
    });
  }

  // ─── Plan ─────────────────────────────────────────────────────────────────

  showPlan(i: Immobilisation) {
    this.svc.plan(i.id).subscribe({ next: p => this.planData.set(p) });
  }

  // ─── Doter ────────────────────────────────────────────────────────────────

  openDoter(i: Immobilisation) {
    this.doterTarget.set(i);
    this.doterExercice = new Date().getFullYear();
    this.doterError.set(null); this.doterSuccess.set(null);
  }

  runDoter() {
    const t = this.doterTarget();
    if (!t) return;
    this.dotering.set(true); this.doterError.set(null);
    this.svc.doter(t.id, this.doterExercice).subscribe({
      next: r => {
        this.dotering.set(false);
        this.doterSuccess.set({ dotation: r.dotation, ecritureId: r.ecritureId });
        this.loadStats(); this.loadPage();
      },
      error: e => { this.dotering.set(false); this.doterError.set(e?.error?.message ?? 'Erreur.'); },
    });
  }

  closeDoter() { this.doterTarget.set(null); this.doterSuccess.set(null); }

  // ─── Delete ───────────────────────────────────────────────────────────────

  confirmDelete(i: Immobilisation) { this.deleteTarget.set(i); }
  doDelete() {
    const t = this.deleteTarget();
    if (!t) return;
    this.svc.delete(t.id).subscribe({
      next: () => { this.deleteTarget.set(null); this.loadStats(); this.loadPage(); },
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  catMeta(cat: string)    { return CAT_META[cat as CategorieImmo]    ?? { label: cat, css: 'bg-gray-100 text-gray-600' }; }
  statutMeta(s: string)   { return STATUT_META[s as StatutImmo]      ?? { label: s,   css: 'bg-gray-100 text-gray-600' }; }
  amortissementsExist(i: Immobilisation) { return i.cumulAmortissement > 0; }
}
