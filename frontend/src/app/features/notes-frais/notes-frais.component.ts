import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, ElementRef, ViewChild, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { NoteFraisService } from '../../core/services/note-frais.service';
import { AuthService } from '../../core/services/auth.service';
import {
  NoteFraisResume, NoteFraisResponse,
  NoteFraisSaveRequest, CategorieNoteFrais, StatutNoteFrais, NoteFraisStats
} from '../../core/models/note-frais.model';

Chart.register(...registerables);

const CAT_INFO: Record<CategorieNoteFrais, { label: string; compte: string; color: string }> = {
  TRANSPORT:     { label: 'Transport',     compte: '6252', color: 'bg-blue-100 text-blue-700' },
  HEBERGEMENT:   { label: 'Hébergement',   compte: '6251', color: 'bg-purple-100 text-purple-700' },
  REPAS:         { label: 'Repas',         compte: '6254', color: 'bg-green-100 text-green-700' },
  COMMUNICATION: { label: 'Communication', compte: '626',  color: 'bg-orange-100 text-orange-700' },
  AUTRE:         { label: 'Autre',         compte: '628',  color: 'bg-gray-100 text-gray-700' },
};

@Component({
  selector: 'app-notes-frais',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Notes de frais</h1>
      <p class="text-sm text-gray-500 mt-0.5">Soumission, approbation et remboursement des frais professionnels</p>
    </div>
    <button (click)="openForm()"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
      + Nouvelle note
    </button>
  </div>

  <!-- Catégories legend -->
  <div class="grid grid-cols-5 gap-2">
    @for (c of catKeys; track c) {
      <div class="bg-white border border-gray-200 rounded-xl p-2.5 text-center">
        <span class="px-2 py-0.5 rounded text-xs font-bold" [ngClass]="catInfo(c).color">{{ c }}</span>
        <p class="text-xs text-gray-500 mt-1 font-mono">{{ catInfo(c).compte }}</p>
      </div>
    }
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1">
      <button (click)="tab = 'mes'" [class]="tabClass('mes')">
        Mes notes
        <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
              [ngClass]="tab === 'mes' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">
          {{ mesNotes.length }}
        </span>
      </button>
      @if (isAdmin || isComptable) {
        <button (click)="tab = 'soumises'; chargerSoumises()" [class]="tabClass('soumises')">
          À valider
          @if (soumises.length > 0) {
            <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
                  [ngClass]="tab === 'soumises' ? 'bg-orange-100 text-orange-700' : 'bg-orange-100 text-orange-600'">
              {{ soumises.length }}
            </span>
          }
        </button>
        <button (click)="tab = 'toutes'; chargerToutes()" [class]="tabClass('toutes')">Toutes les notes</button>
        <button (click)="tab = 'stats'; chargerStats()" [class]="tabClass('stats')">Statistiques</button>
      }
    </nav>
  </div>

  <!-- Tab: Mes notes -->
  @if (tab === 'mes') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      @if (loading) {
        <p class="text-sm text-gray-400 text-center py-10">Chargement…</p>
      } @else if (mesNotes.length === 0) {
        <p class="text-sm text-gray-400 text-center py-10">Aucune note de frais. Cliquez sur "+ Nouvelle note" pour commencer.</p>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-2 text-left">Titre</th>
              <th class="px-4 py-2 text-center">Catégorie</th>
              <th class="px-4 py-2 text-right">Montant</th>
              <th class="px-4 py-2 text-center">Période</th>
              <th class="px-4 py-2 text-center">Statut</th>
              <th class="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (n of mesNotes; track n.id) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-2 font-medium text-gray-800">{{ n.titre }}</td>
                <td class="px-4 py-2 text-center">
                  <span class="px-2 py-0.5 rounded text-xs font-medium" [ngClass]="catInfo(n.categorie).color">
                    {{ catInfo(n.categorie).label }}
                  </span>
                </td>
                <td class="px-4 py-2 text-right font-semibold text-gray-900">{{ fmt(n.montant) }}</td>
                <td class="px-4 py-2 text-center text-xs text-gray-500">
                  {{ n.dateDebut | date:'dd/MM/yy' }} → {{ n.dateFin | date:'dd/MM/yy' }}
                </td>
                <td class="px-4 py-2 text-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [ngClass]="statutClass(n.statut)">
                    {{ n.statut }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center">
                  <div class="flex items-center justify-center gap-1">
                    @if (n.statut === 'BROUILLON') {
                      <button (click)="editNote(n)"
                              class="px-2 py-1 text-xs rounded border border-gray-300 hover:bg-gray-50">
                        Modifier
                      </button>
                      <button (click)="soumettre(n)"
                              class="px-2 py-1 text-xs rounded border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium">
                        Soumettre
                      </button>
                      <button (click)="supprimer(n.id)"
                              class="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50">
                        ✕
                      </button>
                    }
                    @if (n.statut === 'SOUMISE') {
                      <span class="text-xs text-blue-600 font-medium">En attente</span>
                    }
                    @if (n.statut === 'APPROUVEE') {
                      <span class="text-xs text-green-600 font-medium">Approuvée ✓</span>
                    }
                    @if (n.statut === 'REJETEE') {
                      <button (click)="voirRejet(n)"
                              class="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50">
                        Voir motif
                      </button>
                    }
                    @if (n.statut === 'REMBOURSEE') {
                      <span class="text-xs text-teal-600 font-medium">Remboursée ✓</span>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  }

  <!-- Tab: À valider (Admin) -->
  @if (tab === 'soumises') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      @if (loadingSoumises) {
        <p class="text-sm text-gray-400 text-center py-10">Chargement…</p>
      } @else if (soumises.length === 0) {
        <p class="text-sm text-gray-400 text-center py-10">Aucune note en attente de validation.</p>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-2 text-left">Collaborateur</th>
              <th class="px-4 py-2 text-left">Titre</th>
              <th class="px-4 py-2 text-center">Catégorie</th>
              <th class="px-4 py-2 text-right">Montant</th>
              <th class="px-4 py-2 text-center">Période</th>
              <th class="px-4 py-2 text-center">Soumise le</th>
              <th class="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (n of soumises; track n.id) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-2 font-medium text-gray-700">{{ n.collaborateurNom }}</td>
                <td class="px-4 py-2 text-gray-800">{{ n.titre }}</td>
                <td class="px-4 py-2 text-center">
                  <span class="px-2 py-0.5 rounded text-xs font-medium" [ngClass]="catInfo(n.categorie).color">
                    {{ catInfo(n.categorie).label }}
                  </span>
                </td>
                <td class="px-4 py-2 text-right font-semibold text-gray-900">{{ fmt(n.montant) }}</td>
                <td class="px-4 py-2 text-center text-xs text-gray-500">
                  {{ n.dateDebut | date:'dd/MM/yy' }} → {{ n.dateFin | date:'dd/MM/yy' }}
                </td>
                <td class="px-4 py-2 text-center text-xs text-gray-400">
                  {{ n.createdAt | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-4 py-2 text-center">
                  <div class="flex items-center justify-center gap-1">
                    @if (isAdmin) {
                      <button (click)="approuver(n)"
                              class="px-2 py-1 text-xs rounded border border-green-300 text-green-700 hover:bg-green-50 font-medium">
                        Approuver
                      </button>
                      <button (click)="openRejet(n)"
                              class="px-2 py-1 text-xs rounded border border-red-300 text-red-700 hover:bg-red-50 font-medium">
                        Rejeter
                      </button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  }

  <!-- Tab: Toutes les notes -->
  @if (tab === 'toutes') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      @if (loadingToutes) {
        <p class="text-sm text-gray-400 text-center py-10">Chargement…</p>
      } @else if (toutes.length === 0) {
        <p class="text-sm text-gray-400 text-center py-10">Aucune note de frais.</p>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-2 text-left">Collaborateur</th>
              <th class="px-4 py-2 text-left">Titre</th>
              <th class="px-4 py-2 text-center">Catégorie</th>
              <th class="px-4 py-2 text-right">Montant</th>
              <th class="px-4 py-2 text-center">Statut</th>
              <th class="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (n of toutes; track n.id) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-2 text-gray-700">{{ n.collaborateurNom }}</td>
                <td class="px-4 py-2 font-medium text-gray-800">{{ n.titre }}</td>
                <td class="px-4 py-2 text-center">
                  <span class="px-2 py-0.5 rounded text-xs font-medium" [ngClass]="catInfo(n.categorie).color">
                    {{ catInfo(n.categorie).label }}
                  </span>
                </td>
                <td class="px-4 py-2 text-right font-semibold text-gray-900">{{ fmt(n.montant) }}</td>
                <td class="px-4 py-2 text-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [ngClass]="statutClass(n.statut)">
                    {{ n.statut }}
                  </span>
                </td>
                <td class="px-4 py-2 text-center">
                  @if (n.statut === 'APPROUVEE' && (isAdmin || isComptable)) {
                    <button (click)="rembourser(n)"
                            class="px-2 py-1 text-xs rounded border border-teal-300 text-teal-700 hover:bg-teal-50 font-medium">
                      Rembourser
                    </button>
                  }
                  @if (n.statut === 'REMBOURSEE') {
                    <span class="text-xs text-teal-600">Remboursée ✓</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  }

  <!-- Tab: Statistiques -->
  @if (tab === 'stats') {
    <div class="space-y-5">
      <!-- Exercice selector -->
      <div class="flex items-center gap-2 justify-end">
        <label class="text-xs text-gray-500">Exercice :</label>
        <select [(ngModel)]="selectedExercice" (change)="chargerStats()"
                class="border border-gray-200 rounded-lg px-2 py-1 text-sm">
          @for (y of exercices; track y) {
            <option [value]="y">{{ y }}</option>
          }
        </select>
      </div>

      <!-- KPI cards -->
      @if (statsData) {
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500">Total notes</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ statsData.totalNotes }}</p>
            <p class="text-xs text-gray-400 mt-1">exercice {{ statsData.exercice }}</p>
          </div>
          <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <p class="text-xs text-blue-700">Montant soumis</p>
            <p class="text-xl font-bold text-blue-800 mt-1">{{ fmt(statsData.montantSoumis) }}</p>
            <p class="text-xs text-blue-400 mt-1">{{ statsData.soumises }} note(s)</p>
          </div>
          <div class="bg-green-50 rounded-xl border border-green-200 p-4">
            <p class="text-xs text-green-700">Montant approuvé</p>
            <p class="text-xl font-bold text-green-800 mt-1">{{ fmt(statsData.montantApprouve) }}</p>
            <p class="text-xs text-green-400 mt-1">{{ statsData.approuvees }} note(s)</p>
          </div>
          <div class="bg-teal-50 rounded-xl border border-teal-200 p-4">
            <p class="text-xs text-teal-700">Montant remboursé</p>
            <p class="text-xl font-bold text-teal-800 mt-1">{{ fmt(statsData.montantRembourse) }}</p>
            <p class="text-xs text-teal-400 mt-1">{{ statsData.remboursees }} note(s)</p>
          </div>
        </div>

        <!-- Charts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Répartition par catégorie (montant)</h3>
            <canvas #catCanvas height="180"></canvas>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <h3 class="text-sm font-semibold text-gray-700 mb-3">Remboursements mensuels</h3>
            <canvas #mensuelCanvas height="180"></canvas>
          </div>
        </div>
      } @else if (loadingStats) {
        <div class="text-center py-10 text-gray-400 text-sm">Chargement des statistiques…</div>
      }
    </div>
  }

  <!-- Toast -->
  @if (toast) {
    <div class="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium shadow-lg z-50"
         [ngClass]="toastError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'">
      {{ toast }}
    </div>
  }

  <!-- Modal: formulaire note -->
  @if (showForm) {
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
         (click)="closeForm()">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4"
           (click)="$event.stopPropagation()">
        <h2 class="text-lg font-semibold text-gray-900">
          {{ editId ? 'Modifier la note' : 'Nouvelle note de frais' }}
        </h2>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Titre *</label>
            <input [(ngModel)]="form.titre" type="text" placeholder="Ex: Déplacement client Paris"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Catégorie *</label>
              <select [(ngModel)]="form.categorie"
                      class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
                @for (c of catKeys; track c) {
                  <option [value]="c">{{ catInfo(c).label }} ({{ catInfo(c).compte }})</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Montant (XOF) *</label>
              <input [(ngModel)]="form.montant" type="number" min="0" step="1"
                     class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Date début *</label>
              <input [(ngModel)]="form.dateDebut" type="date"
                     class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Date fin *</label>
              <input [(ngModel)]="form.dateFin" type="date"
                     class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea [(ngModel)]="form.description" rows="2"
                      placeholder="Détails du déplacement, justificatifs…"
                      class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"></textarea>
          </div>
        </div>

        <!-- Aperçu schéma comptable -->
        <div class="bg-gray-50 rounded-lg px-3 py-2 text-xs font-mono text-gray-600">
          Approbation : DR {{ catInfo(form.categorie).compte }} / CR 421 Personnel<br>
          Remboursement : DR 421 Personnel / CR 521 Banque
        </div>

        @if (formError) {
          <p class="text-sm text-red-600">{{ formError }}</p>
        }

        <div class="flex justify-end gap-2 pt-1">
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

  <!-- Modal: rejet -->
  @if (showRejet) {
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
         (click)="closeRejet()">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4"
           (click)="$event.stopPropagation()">
        <h2 class="text-lg font-semibold text-gray-900">Rejeter la note de frais</h2>
        <p class="text-sm text-gray-600">Note : <strong>{{ rejetNote?.titre }}</strong></p>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Motif du rejet *</label>
          <textarea [(ngModel)]="rejetCommentaire" rows="3"
                    placeholder="Indiquez le motif du rejet…"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"></textarea>
        </div>

        @if (rejetError) {
          <p class="text-sm text-red-600">{{ rejetError }}</p>
        }

        <div class="flex justify-end gap-2">
          <button (click)="closeRejet()"
                  class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Annuler
          </button>
          <button (click)="confirmerRejet()" [disabled]="saving"
                  class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {{ saving ? 'Traitement…' : 'Rejeter' }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- Modal: voir motif rejet -->
  @if (showMotifRejet) {
    <div class="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
         (click)="showMotifRejet = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-3"
           (click)="$event.stopPropagation()">
        <h2 class="text-base font-semibold text-gray-900">Motif du rejet</h2>
        <p class="text-sm text-gray-700 bg-red-50 rounded-lg p-3">{{ motifRejetTexte || 'Aucun motif précisé.' }}</p>
        <div class="flex justify-end">
          <button (click)="showMotifRejet = false"
                  class="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
            Fermer
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `
})
export class NotesFraisComponent implements OnInit, OnDestroy {

  @ViewChild('catCanvas')     catCanvasRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('mensuelCanvas') mensuelCanvasRef!: ElementRef<HTMLCanvasElement>;

  private svc  = inject(NoteFraisService);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  readonly catKeys: CategorieNoteFrais[] = ['TRANSPORT', 'HEBERGEMENT', 'REPAS', 'COMMUNICATION', 'AUTRE'];

  get isAdmin():    boolean { return this.auth.user()?.role === 'ADMIN'; }
  get isComptable(): boolean { return this.auth.user()?.role === 'COMPTABLE'; }

  tab: 'mes' | 'soumises' | 'toutes' | 'stats' = 'mes';

  // Stats / charts
  statsData:       NoteFraisStats | null = null;
  loadingStats     = false;
  selectedExercice = new Date().getFullYear();
  exercices        = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  private catChart?:     Chart;
  private mensuelChart?: Chart;

  mesNotes:      NoteFraisResume[] = [];
  soumises:      NoteFraisResume[] = [];
  toutes:        NoteFraisResume[] = [];
  loading        = false;
  loadingSoumises = false;
  loadingToutes  = false;

  showForm  = false;
  editId:   string | null = null;
  saving    = false;
  formError = '';

  form: NoteFraisSaveRequest = this.emptyForm();

  showRejet      = false;
  rejetNote:     NoteFraisResume | null = null;
  rejetCommentaire = '';
  rejetError     = '';

  showMotifRejet  = false;
  motifRejetTexte = '';

  toast      = '';
  toastError = false;

  ngOnInit() {
    this.chargerMesNotes();
    if (this.isAdmin || this.isComptable) {
      this.chargerSoumises();
    }
  }

  chargerMesNotes() {
    this.loading = true;
    this.svc.mesNotes().subscribe({
      next: d => { this.mesNotes = d; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); }
    });
  }

  chargerSoumises() {
    this.loadingSoumises = true;
    this.svc.soumises().subscribe({
      next: d => { this.soumises = d; this.loadingSoumises = false; this.cdr.detectChanges(); },
      error: () => { this.loadingSoumises = false; this.cdr.detectChanges(); }
    });
  }

  chargerToutes() {
    this.loadingToutes = true;
    this.svc.findAll().subscribe({
      next: d => { this.toutes = d; this.loadingToutes = false; this.cdr.detectChanges(); },
      error: () => { this.loadingToutes = false; this.cdr.detectChanges(); }
    });
  }

  openForm() {
    this.editId    = null;
    this.form      = this.emptyForm();
    this.formError = '';
    this.showForm  = true;
  }

  editNote(n: NoteFraisResume) {
    this.editId = n.id;
    this.svc.findOne(n.id).subscribe(full => {
      this.form = {
        titre:       full.titre,
        categorie:   full.categorie,
        description: full.description,
        montant:     full.montant as unknown as number,
        dateDebut:   full.dateDebut,
        dateFin:     full.dateFin
      };
      this.formError = '';
      this.showForm  = true;
      this.cdr.detectChanges();
    });
  }

  closeForm() { this.showForm = false; }

  save() {
    if (!this.form.titre || !this.form.montant || !this.form.dateDebut || !this.form.dateFin) {
      this.formError = 'Veuillez remplir tous les champs obligatoires.';
      return;
    }
    this.saving = true;
    const obs = this.editId
      ? this.svc.update(this.editId, this.form)
      : this.svc.create(this.form);

    obs.subscribe({
      next: () => {
        this.saving   = false;
        this.showForm = false;
        this.chargerMesNotes();
        this.showToast(this.editId ? 'Note mise à jour' : 'Note créée');
        this.editId = null;
      },
      error: () => {
        this.saving    = false;
        this.formError = 'Une erreur est survenue.';
        this.cdr.detectChanges();
      }
    });
  }

  soumettre(n: NoteFraisResume) {
    if (!confirm(`Soumettre la note "${n.titre}" pour approbation ?`)) return;
    this.svc.soumettre(n.id).subscribe({
      next: updated => {
        this.updateMesNotes(updated);
        this.showToast('Note soumise pour approbation');
      },
      error: () => this.showToast('Erreur lors de la soumission', true)
    });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer cette note de frais ?')) return;
    this.svc.delete(id).subscribe(() => {
      this.mesNotes = this.mesNotes.filter(n => n.id !== id);
      this.showToast('Note supprimée');
      this.cdr.detectChanges();
    });
  }

  approuver(n: NoteFraisResume) {
    if (!confirm(`Approuver la note "${n.titre}" (${this.fmt(n.montant)}) de ${n.collaborateurNom} ?`)) return;
    this.svc.approuver(n.id).subscribe({
      next: () => {
        this.soumises = this.soumises.filter(s => s.id !== n.id);
        this.showToast('Note approuvée — écriture DR 6xxx/CR 421 générée');
        this.cdr.detectChanges();
      },
      error: () => this.showToast('Erreur lors de l\'approbation', true)
    });
  }

  openRejet(n: NoteFraisResume) {
    this.rejetNote        = n;
    this.rejetCommentaire = '';
    this.rejetError       = '';
    this.showRejet        = true;
  }

  closeRejet() { this.showRejet = false; this.rejetNote = null; }

  confirmerRejet() {
    if (!this.rejetCommentaire.trim()) {
      this.rejetError = 'Le motif du rejet est obligatoire.';
      return;
    }
    if (!this.rejetNote) return;
    this.saving = true;
    this.svc.rejeter(this.rejetNote.id, { commentaire: this.rejetCommentaire }).subscribe({
      next: () => {
        this.saving    = false;
        this.showRejet = false;
        this.soumises  = this.soumises.filter(s => s.id !== this.rejetNote!.id);
        this.rejetNote = null;
        this.showToast('Note rejetée');
        this.cdr.detectChanges();
      },
      error: () => {
        this.saving     = false;
        this.rejetError = 'Une erreur est survenue.';
        this.cdr.detectChanges();
      }
    });
  }

  rembourser(n: NoteFraisResume) {
    if (!confirm(`Rembourser "${n.titre}" (${this.fmt(n.montant)}) à ${n.collaborateurNom} ?`)) return;
    this.svc.rembourser(n.id).subscribe({
      next: updated => {
        const idx = this.toutes.findIndex(t => t.id === updated.id);
        if (idx >= 0) this.toutes[idx] = { ...this.toutes[idx], statut: 'REMBOURSEE' };
        this.showToast('Note remboursée — écriture DR 421/CR 521 générée');
        this.cdr.detectChanges();
      },
      error: () => this.showToast('Erreur lors du remboursement', true)
    });
  }

  voirRejet(n: NoteFraisResume) {
    this.svc.findOne(n.id).subscribe(full => {
      this.motifRejetTexte = full.commentaireRejet ?? '';
      this.showMotifRejet  = true;
      this.cdr.detectChanges();
    });
  }

  chargerStats() {
    this.loadingStats = true;
    this.svc.getStats(this.selectedExercice).subscribe({
      next: s => {
        this.statsData    = s;
        this.loadingStats = false;
        this.cdr.detectChanges();
        Promise.resolve().then(() => this.buildCharts());
      },
      error: () => { this.loadingStats = false; this.cdr.detectChanges(); }
    });
  }

  ngOnDestroy(): void {
    this.catChart?.destroy();
    this.mensuelChart?.destroy();
  }

  private buildCharts(): void {
    this.buildCatChart();
    this.buildMensuelChart();
  }

  private buildCatChart(): void {
    if (!this.catCanvasRef || !this.statsData) return;
    this.catChart?.destroy();
    const cats = this.statsData.parCategorie.filter(c => c.montant > 0);
    const colors: Record<string, string> = {
      TRANSPORT: '#3b82f6', HEBERGEMENT: '#8b5cf6',
      REPAS: '#22c55e', COMMUNICATION: '#f97316', AUTRE: '#6b7280'
    };
    this.catChart = new Chart(this.catCanvasRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: cats.map(c => CAT_INFO[c.categorie as CategorieNoteFrais]?.label ?? c.categorie),
        datasets: [{
          data: cats.map(c => c.montant),
          backgroundColor: cats.map(c => colors[c.categorie] ?? '#9ca3af'),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => ` ${this.fmt(ctx.parsed as number)}`
            }
          }
        },
        cutout: '60%'
      }
    });
  }

  private buildMensuelChart(): void {
    if (!this.mensuelCanvasRef || !this.statsData) return;
    this.mensuelChart?.destroy();
    const months = this.statsData.mensuel;
    this.mensuelChart = new Chart(this.mensuelCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels: months.map(m => m.label),
        datasets: [{
          label: 'Montant remboursé',
          data: months.map(m => m.montant),
          backgroundColor: 'rgba(20,184,166,0.7)',
          borderColor: '#14b8a6',
          borderWidth: 1,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { callback: (v: any) => this.fmtK(+v) } }
        }
      }
    });
  }

  private fmtK(v: number): string {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + 'K';
    return String(v);
  }

  catInfo(c: CategorieNoteFrais) { return CAT_INFO[c]; }

  tabClass(t: string): string {
    const base = 'px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1';
    return t === this.tab
      ? `${base} border-blue-600 text-blue-700`
      : `${base} border-transparent text-gray-500 hover:text-gray-700`;
  }

  statutClass(s: StatutNoteFrais): string {
    const map: Record<StatutNoteFrais, string> = {
      BROUILLON:  'bg-gray-100 text-gray-600',
      SOUMISE:    'bg-blue-100 text-blue-700',
      APPROUVEE:  'bg-green-100 text-green-700',
      REJETEE:    'bg-red-100 text-red-700',
      REMBOURSEE: 'bg-teal-100 text-teal-700',
    };
    return map[s] ?? 'bg-gray-100 text-gray-600';
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  private updateMesNotes(updated: NoteFraisResponse) {
    const idx = this.mesNotes.findIndex(n => n.id === updated.id);
    if (idx >= 0) this.mesNotes[idx] = { ...this.mesNotes[idx], statut: updated.statut };
    this.cdr.detectChanges();
  }

  private emptyForm(): NoteFraisSaveRequest {
    const today = new Date().toISOString().split('T')[0];
    return {
      titre: '', categorie: 'TRANSPORT', description: null,
      montant: 0, dateDebut: today, dateFin: today
    };
  }

  private showToast(msg: string, error = false) {
    this.toast      = msg;
    this.toastError = error;
    this.cdr.detectChanges();
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3500);
  }
}
