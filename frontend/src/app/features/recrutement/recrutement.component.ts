import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RecrutementService } from '../../core/services/recrutement.service';
import { AuthService } from '../../core/services/auth.service';
import {
  OffreResponse, OffreRequest, StatutOffre,
  CandidatureResponse, CandidatureRequest, StatutCandidature,
  PlanResponse, PlanRequest, TacheRequest, CategorieTache,
  TYPE_CONTRAT_LABELS, STATUT_OFFRE_LABELS,
  STATUT_CANDIDATURE_LABELS, CATEGORIE_TACHE_LABELS,
  PIPELINE_STATUTS, TypeContrat
} from '../../core/models/recrutement.model';

type Tab = 'offres' | 'candidatures' | 'onboarding';

const STATUT_OFFRE_CSS: Record<StatutOffre, string> = {
  OUVERTE:  'bg-green-100 text-green-700',
  EN_PAUSE: 'bg-amber-100 text-amber-700',
  FERMEE:   'bg-red-100 text-red-700',
};

const STATUT_CAND_CSS: Record<StatutCandidature, string> = {
  RECUE:          'bg-gray-100 text-gray-700',
  PRESELECTIONEE: 'bg-blue-100 text-blue-700',
  ENTRETIEN:      'bg-purple-100 text-purple-700',
  OFFRE:          'bg-amber-100 text-amber-700',
  EMBAUCHEE:      'bg-green-100 text-green-700',
  REFUSEE:        'bg-red-100 text-red-700',
};

const CAT_CSS: Record<CategorieTache, string> = {
  ADMIN:  'bg-gray-100 text-gray-700',
  IT:     'bg-blue-100 text-blue-700',
  RH:     'bg-pink-100 text-pink-700',
  METIER: 'bg-indigo-100 text-indigo-700',
};

@Component({
  selector: 'app-recrutement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Recrutement & Onboarding</h1>
      <p class="text-xs text-gray-400 mt-0.5">Offres d'emploi · Pipeline candidatures · Plans d'intégration</p>
    </div>
    @if (isAdmin) {
      <button (click)="openCreateModal()" class="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
        @if (activeTab() === 'offres') { + Nouvelle offre }
        @if (activeTab() === 'candidatures') { + Ajouter candidature }
        @if (activeTab() === 'onboarding') { + Créer plan }
      </button>
    }
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 border-b border-gray-200">
    @for (t of tabs; track t.key) {
      <button (click)="activeTab.set(t.key)"
              class="px-4 py-2 text-sm font-medium border-b-2 transition"
              [class]="activeTab() === t.key
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'">
        {{ t.label }}
        @if (t.key === 'candidatures' && candidatures.length > 0) {
          <span class="ml-1 bg-indigo-100 text-indigo-700 text-xs rounded-full px-1.5">{{ candidatures.length }}</span>
        }
      </button>
    }
  </div>

  <!-- ═══ TAB: OFFRES ═══════════════════════════════════════════════════════ -->
  @if (activeTab() === 'offres') {
    @if (loading) {
      <p class="text-sm text-gray-400 text-center py-10">Chargement...</p>
    } @else if (offres.length === 0) {
      <div class="text-center py-16 text-gray-400">
        <div class="text-4xl mb-3">📋</div>
        <p class="text-sm">Aucune offre d'emploi publiée.</p>
      </div>
    } @else {
      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        @for (o of offres; track o.id) {
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition space-y-3">
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-semibold text-gray-800 text-sm">{{ o.titre }}</h3>
                @if (o.departement) {
                  <p class="text-xs text-gray-400">{{ o.departement }}</p>
                }
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    [class]="statutOffreCss(o.statut)">
                {{ statutOffreLabel(o.statut) }}
              </span>
            </div>
            <div class="flex gap-2 text-xs text-gray-500 flex-wrap">
              <span class="bg-gray-100 px-2 py-0.5 rounded">{{ typeContratLabel(o.typeContrat) }}</span>
              <span class="bg-gray-100 px-2 py-0.5 rounded">{{ o.nbPostes }} poste{{ o.nbPostes > 1 ? 's' : '' }}</span>
              <span class="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">{{ o.nbCandidatures }} candidature{{ o.nbCandidatures > 1 ? 's' : '' }}</span>
            </div>
            @if (o.dateOuverture || o.dateCloture) {
              <p class="text-xs text-gray-400">
                @if (o.dateOuverture) { Ouv. {{ o.dateOuverture | date:'dd/MM/yyyy' }} }
                @if (o.dateCloture) { · Clôt. {{ o.dateCloture | date:'dd/MM/yyyy' }} }
              </p>
            }
            @if (isAdmin) {
              <div class="flex gap-2 pt-1 border-t border-gray-100">
                <select [value]="o.statut"
                        (change)="onChangeStatutOffre(o, $event)"
                        class="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-400">
                  @for (s of statutsOffre; track s.val) {
                    <option [value]="s.val">{{ s.label }}</option>
                  }
                </select>
                <button (click)="deleteOffre(o)" class="text-xs text-red-500 hover:text-red-700 px-2 py-1">Suppr.</button>
              </div>
            }
          </div>
        }
      </div>
    }
  }

  <!-- ═══ TAB: CANDIDATURES ═════════════════════════════════════════════════ -->
  @if (activeTab() === 'candidatures') {
    <!-- Pipeline Kanban -->
    <div class="flex gap-3 overflow-x-auto pb-2">
      @for (col of pipelineCols; track col.statut) {
        <div class="flex-shrink-0 w-52 space-y-2">
          <div class="flex items-center justify-between px-2 py-1">
            <span class="text-xs font-semibold text-gray-600 uppercase tracking-wide">{{ col.label }}</span>
            <span class="text-xs bg-gray-100 text-gray-600 rounded-full px-1.5">{{ byStatut(col.statut).length }}</span>
          </div>
          @for (c of byStatut(col.statut); track c.id) {
            <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm space-y-1.5">
              <p class="text-sm font-medium text-gray-800">{{ c.nomCandidat }}</p>
              @if (c.offreTitre) {
                <p class="text-xs text-indigo-600">{{ c.offreTitre }}</p>
              }
              @if (c.emailCandidat) {
                <p class="text-xs text-gray-400">{{ c.emailCandidat }}</p>
              }
              @if (isAdmin) {
                <div class="flex flex-wrap gap-1 pt-1 border-t border-gray-100">
                  @for (next of nextStatuts(col.statut); track next.val) {
                    <button (click)="avancerStatut(c, next.val)"
                            class="text-xs px-2 py-0.5 rounded border border-gray-200 hover:bg-gray-50">
                      → {{ next.label }}
                    </button>
                  }
                  <button (click)="deleteCandidature(c)" class="text-xs text-red-400 hover:text-red-600 ml-auto">✕</button>
                </div>
              }
            </div>
          }
          @if (byStatut(col.statut).length === 0) {
            <div class="border-2 border-dashed border-gray-200 rounded-xl p-3 text-center text-xs text-gray-300">
              Vide
            </div>
          }
        </div>
      }
    </div>
  }

  <!-- ═══ TAB: ONBOARDING ═══════════════════════════════════════════════════ -->
  @if (activeTab() === 'onboarding') {
    @if (plans.length === 0) {
      <div class="text-center py-16 text-gray-400">
        <div class="text-4xl mb-3">🚀</div>
        <p class="text-sm">Aucun plan d'onboarding actif.</p>
      </div>
    } @else {
      <div class="space-y-4">
        @for (p of plans; track p.id) {
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <!-- Plan header -->
            <div class="flex items-start justify-between gap-3">
              <div>
                <h3 class="font-semibold text-gray-800 text-sm">{{ p.titre }}</h3>
                <p class="text-xs text-gray-500">{{ p.collaborateurNom }}</p>
                @if (p.dateEmbauche) {
                  <p class="text-xs text-gray-400">Embauche : {{ p.dateEmbauche | date:'dd/MM/yyyy' }}</p>
                }
              </div>
              <div class="flex items-center gap-2">
                <!-- Progress bar -->
                <div class="w-24">
                  <div class="flex justify-between text-xs text-gray-400 mb-0.5">
                    <span>{{ p.nbTerminees }}/{{ p.nbTaches }}</span>
                    <span>{{ progress(p) }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full transition-all"
                         [class]="p.statut === 'TERMINE' ? 'bg-green-500' : 'bg-indigo-500'"
                         [style.width]="progress(p) + '%'"></div>
                  </div>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class]="p.statut === 'TERMINE' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'">
                  {{ p.statut === 'TERMINE' ? 'Terminé' : 'En cours' }}
                </span>
                @if (isAdmin) {
                  <button (click)="openAddTache(p)" class="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded-lg">+ Tâche</button>
                  <button (click)="deletePlan(p)" class="text-xs text-red-400 hover:text-red-600">✕</button>
                }
              </div>
            </div>

            <!-- Tâches -->
            @if (p.taches.length > 0) {
              <div class="space-y-1.5 border-t border-gray-100 pt-3">
                @for (t of p.taches; track t.id) {
                  <div class="flex items-center gap-3 group">
                    <button (click)="toggleTache(p, t.id)"
                            class="w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition"
                            [class]="t.terminee ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-green-400'">
                      @if (t.terminee) { ✓ }
                    </button>
                    <span class="text-sm flex-1" [class]="t.terminee ? 'line-through text-gray-400' : 'text-gray-700'">
                      {{ t.titre }}
                    </span>
                    <span class="text-xs px-1.5 py-0.5 rounded" [class]="catCss(t.categorie)">
                      {{ catLabel(t.categorie) }}
                    </span>
                    @if (t.dateLimite) {
                      <span class="text-xs text-gray-400">{{ t.dateLimite | date:'dd/MM' }}</span>
                    }
                    @if (isAdmin) {
                      <button (click)="deleteTache(p, t.id)"
                              class="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity">✕</button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  }

</div>

<!-- ═══ MODAL: Nouvelle offre ════════════════════════════════════════════ -->
@if (showModal && activeTab() === 'offres') {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
      <h2 class="font-bold text-gray-800">Nouvelle offre d'emploi</h2>
      <div class="grid grid-cols-2 gap-3">
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Titre *</label>
          <input [(ngModel)]="offreForm.titre" placeholder="Ex : Développeur Java"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Département</label>
          <input [(ngModel)]="offreForm.departement" placeholder="Ex : Comptabilité"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Type de contrat</label>
          <select [(ngModel)]="offreForm.typeContrat"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            @for (tc of typesContrat; track tc.val) {
              <option [value]="tc.val">{{ tc.label }}</option>
            }
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Nb postes</label>
          <input type="number" [(ngModel)]="offreForm.nbPostes" min="1"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Date cloture</label>
          <input type="date" [(ngModel)]="offreForm.dateCloture"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Description</label>
          <textarea [(ngModel)]="offreForm.description" rows="3" placeholder="Description du poste..."
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"></textarea>
        </div>
      </div>
      @if (error) { <p class="text-xs text-red-500">{{ error }}</p> }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closeModal()" class="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
        <button (click)="submitOffre()" [disabled]="saving"
                class="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
          {{ saving ? 'Enregistrement...' : 'Créer l\'offre' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ═══ MODAL: Ajouter candidature ══════════════════════════════════════ -->
@if (showModal && activeTab() === 'candidatures') {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
      <h2 class="font-bold text-gray-800">Ajouter une candidature</h2>
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Nom du candidat *</label>
          <input [(ngModel)]="candidForm.nomCandidat" placeholder="Prénom Nom"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Email</label>
          <input type="email" [(ngModel)]="candidForm.emailCandidat" placeholder="candidat@mail.com"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Téléphone</label>
          <input [(ngModel)]="candidForm.telephone" placeholder="+226 XX XX XX XX"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Offre associée</label>
          <select [(ngModel)]="candidForm.offreId"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
            <option value="">-- Candidature spontanée --</option>
            @for (o of offresOuvertes; track o.id) {
              <option [value]="o.id">{{ o.titre }}</option>
            }
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Notes</label>
          <textarea [(ngModel)]="candidForm.notes" rows="2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"></textarea>
        </div>
      </div>
      @if (error) { <p class="text-xs text-red-500">{{ error }}</p> }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closeModal()" class="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
        <button (click)="submitCandidature()" [disabled]="saving"
                class="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
          {{ saving ? 'Enregistrement...' : 'Ajouter' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ═══ MODAL: Créer plan onboarding ════════════════════════════════════ -->
@if (showModal && activeTab() === 'onboarding') {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
      <h2 class="font-bold text-gray-800">Créer un plan d'onboarding</h2>
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">ID Collaborateur *</label>
          <input [(ngModel)]="planForm.collaborateurId" placeholder="UUID du collaborateur"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Titre (optionnel)</label>
          <input [(ngModel)]="planForm.titre" placeholder="Plan d'onboarding — ..."
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Date d'embauche</label>
          <input type="date" [(ngModel)]="planForm.dateEmbauche"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
      </div>
      @if (error) { <p class="text-xs text-red-500">{{ error }}</p> }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closeModal()" class="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
        <button (click)="submitPlan()" [disabled]="saving"
                class="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
          {{ saving ? 'Enregistrement...' : 'Créer le plan' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ═══ MODAL: Ajouter tâche ════════════════════════════════════════════ -->
@if (showTacheModal) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
      <h2 class="font-bold text-gray-800">Ajouter une tâche</h2>
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Titre *</label>
          <input [(ngModel)]="tacheForm.titre" placeholder="Ex : Créer compte AD"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Catégorie</label>
            <select [(ngModel)]="tacheForm.categorie"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              @for (c of categories; track c.val) {
                <option [value]="c.val">{{ c.label }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Date limite</label>
            <input type="date" [(ngModel)]="tacheForm.dateLimite"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          </div>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Description</label>
          <textarea [(ngModel)]="tacheForm.description" rows="2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"></textarea>
        </div>
      </div>
      @if (error) { <p class="text-xs text-red-500">{{ error }}</p> }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closeTacheModal()" class="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
        <button (click)="submitTache()" [disabled]="saving"
                class="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
          {{ saving ? 'Enregistrement...' : 'Ajouter' }}
        </button>
      </div>
    </div>
  </div>
}
`,
})
export class RecrutementComponent implements OnInit {
  private svc   = inject(RecrutementService);
  private auth  = inject(AuthService);
  private cdr   = inject(ChangeDetectorRef);

  activeTab = signal<Tab>('offres');

  offres:       OffreResponse[]      = [];
  candidatures: CandidatureResponse[] = [];
  plans:        PlanResponse[]        = [];

  loading = false;
  saving  = false;
  error   = '';

  showModal     = false;
  showTacheModal = false;
  selectedPlan: PlanResponse | null = null;

  // Forms
  offreForm: OffreRequest = { titre: '', typeContrat: 'CDI', nbPostes: 1 };
  candidForm: CandidatureRequest & { emailCandidat?: string; telephone?: string; offreId?: string; notes?: string } = {
    nomCandidat: '', emailCandidat: '', telephone: '', offreId: '', notes: ''
  };
  planForm: PlanRequest = { collaborateurId: '' };
  tacheForm: TacheRequest = { titre: '', categorie: 'ADMIN', ordre: 0 };

  get isAdmin() { return this.auth.user()?.role === 'ADMIN'; }

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'offres',       label: 'Offres d\'emploi' },
    { key: 'candidatures', label: 'Candidatures' },
    { key: 'onboarding',   label: 'Onboarding' },
  ];

  readonly statutsOffre = [
    { val: 'OUVERTE'  as StatutOffre, label: 'Ouverte'  },
    { val: 'EN_PAUSE' as StatutOffre, label: 'En pause' },
    { val: 'FERMEE'   as StatutOffre, label: 'Fermée'   },
  ];

  readonly typesContrat = (Object.entries(TYPE_CONTRAT_LABELS) as [TypeContrat, string][])
    .map(([val, label]) => ({ val, label }));

  readonly pipelineCols = PIPELINE_STATUTS.map(s => ({
    statut: s,
    label: STATUT_CANDIDATURE_LABELS[s]
  }));

  readonly categories = (Object.entries(CATEGORIE_TACHE_LABELS) as [CategorieTache, string][])
    .map(([val, label]) => ({ val, label }));

  get offresOuvertes() { return this.offres.filter(o => o.statut === 'OUVERTE'); }

  ngOnInit() { this.loadAll(); }

  private loadAll() {
    this.loading = true;
    this.svc.findOffres().subscribe({ next: d => { this.offres = d; this.loading = false; this.cdr.markForCheck(); } });
    this.svc.findCandidatures().subscribe({ next: d => { this.candidatures = d; this.cdr.markForCheck(); } });
    this.svc.findPlans().subscribe({ next: d => { this.plans = d; this.cdr.markForCheck(); } });
  }

  byStatut(s: StatutCandidature) { return this.candidatures.filter(c => c.statut === s); }

  nextStatuts(current: StatutCandidature): { val: StatutCandidature; label: string }[] {
    const all: StatutCandidature[] = ['RECUE', 'PRESELECTIONEE', 'ENTRETIEN', 'OFFRE', 'EMBAUCHEE', 'REFUSEE'];
    const idx = all.indexOf(current);
    return all
      .filter((_, i) => i !== idx)
      .slice(0, 3)
      .map(v => ({ val: v, label: STATUT_CANDIDATURE_LABELS[v] }));
  }

  progress(p: PlanResponse) {
    return p.nbTaches === 0 ? 0 : Math.round((p.nbTerminees / p.nbTaches) * 100);
  }

  statutOffreCss(s: StatutOffre)    { return STATUT_OFFRE_CSS[s]; }
  statutOffreLabel(s: StatutOffre)  { return STATUT_OFFRE_LABELS[s]; }
  typeContratLabel(t: TypeContrat)  { return TYPE_CONTRAT_LABELS[t]; }
  catCss(c: CategorieTache)         { return CAT_CSS[c]; }
  catLabel(c: CategorieTache)       { return CATEGORIE_TACHE_LABELS[c]; }

  openCreateModal() { this.error = ''; this.showModal = true; }
  closeModal()      { this.showModal = false; }

  openAddTache(p: PlanResponse) {
    this.selectedPlan = p;
    this.tacheForm = { titre: '', categorie: 'ADMIN', ordre: p.taches.length + 1 };
    this.error = '';
    this.showTacheModal = true;
  }
  closeTacheModal() { this.showTacheModal = false; this.selectedPlan = null; }

  onChangeStatutOffre(o: OffreResponse, event: Event) {
    const statut = (event.target as HTMLSelectElement).value as StatutOffre;
    this.svc.updateStatutOffre(o.id, statut).subscribe({
      next: updated => {
        const idx = this.offres.findIndex(x => x.id === o.id);
        if (idx >= 0) this.offres[idx] = updated;
        this.cdr.markForCheck();
      }
    });
  }

  submitOffre() {
    if (!this.offreForm.titre.trim()) { this.error = 'Le titre est obligatoire.'; return; }
    this.saving = true; this.error = '';
    this.svc.createOffre({ ...this.offreForm, offreId: undefined } as any).subscribe({
      next: o => { this.offres.unshift(o); this.saving = false; this.showModal = false; this.offreForm = { titre: '', typeContrat: 'CDI', nbPostes: 1 }; this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.error = 'Erreur lors de la création.'; }
    });
  }

  deleteOffre(o: OffreResponse) {
    if (!confirm(`Supprimer l'offre "${o.titre}" ?`)) return;
    this.svc.deleteOffre(o.id).subscribe({ next: () => { this.offres = this.offres.filter(x => x.id !== o.id); this.cdr.markForCheck(); } });
  }

  submitCandidature() {
    if (!this.candidForm.nomCandidat?.trim()) { this.error = 'Nom obligatoire.'; return; }
    this.saving = true; this.error = '';
    const req: CandidatureRequest = {
      nomCandidat:    this.candidForm.nomCandidat,
      emailCandidat:  this.candidForm.emailCandidat || undefined,
      telephone:      this.candidForm.telephone     || undefined,
      offreId:        this.candidForm.offreId       || undefined,
      notes:          this.candidForm.notes         || undefined,
    };
    this.svc.createCandidature(req).subscribe({
      next: c => { this.candidatures.unshift(c); this.saving = false; this.showModal = false; this.candidForm = { nomCandidat: '' }; this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.error = 'Erreur lors de l\'ajout.'; }
    });
  }

  avancerStatut(c: CandidatureResponse, statut: StatutCandidature) {
    this.svc.avancerStatut(c.id, statut).subscribe({
      next: updated => {
        const idx = this.candidatures.findIndex(x => x.id === c.id);
        if (idx >= 0) this.candidatures[idx] = updated;
        this.cdr.markForCheck();
      }
    });
  }

  deleteCandidature(c: CandidatureResponse) {
    if (!confirm(`Supprimer la candidature de "${c.nomCandidat}" ?`)) return;
    this.svc.deleteCandidature(c.id).subscribe({ next: () => { this.candidatures = this.candidatures.filter(x => x.id !== c.id); this.cdr.markForCheck(); } });
  }

  submitPlan() {
    if (!this.planForm.collaborateurId?.trim()) { this.error = 'ID collaborateur obligatoire.'; return; }
    this.saving = true; this.error = '';
    this.svc.createPlan(this.planForm).subscribe({
      next: p => { this.plans.unshift(p); this.saving = false; this.showModal = false; this.planForm = { collaborateurId: '' }; this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.error = 'Erreur lors de la création.'; }
    });
  }

  deletePlan(p: PlanResponse) {
    if (!confirm(`Supprimer le plan "${p.titre}" ?`)) return;
    this.svc.deletePlan(p.id).subscribe({ next: () => { this.plans = this.plans.filter(x => x.id !== p.id); this.cdr.markForCheck(); } });
  }

  submitTache() {
    if (!this.tacheForm.titre.trim()) { this.error = 'Titre obligatoire.'; return; }
    if (!this.selectedPlan) return;
    this.saving = true; this.error = '';
    this.svc.addTache(this.selectedPlan.id, this.tacheForm).subscribe({
      next: updated => {
        const idx = this.plans.findIndex(x => x.id === updated.id);
        if (idx >= 0) this.plans[idx] = updated;
        this.saving = false; this.showTacheModal = false; this.selectedPlan = null;
        this.cdr.markForCheck();
      },
      error: () => { this.saving = false; this.error = 'Erreur.'; }
    });
  }

  toggleTache(p: PlanResponse, tacheId: string) {
    this.svc.toggleTache(p.id, tacheId).subscribe({
      next: updated => {
        const idx = this.plans.findIndex(x => x.id === updated.id);
        if (idx >= 0) this.plans[idx] = updated;
        this.cdr.markForCheck();
      }
    });
  }

  deleteTache(p: PlanResponse, tacheId: string) {
    this.svc.deleteTache(p.id, tacheId).subscribe({
      next: () => {
        const plan = this.plans.find(x => x.id === p.id);
        if (plan) {
          plan.taches = plan.taches.filter(t => t.id !== tacheId);
          plan.nbTaches = plan.taches.length;
        }
        this.cdr.markForCheck();
      }
    });
  }
}
