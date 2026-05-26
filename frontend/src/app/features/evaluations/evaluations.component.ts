import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EvaluationService } from '../../core/services/evaluation.service';
import { AuthService } from '../../core/services/auth.service';
import {
  ObjectifResponse, EvaluationResponse, LigneResponse,
  StatutEvaluation, PeriodeEvaluation,
  ObjectifSaveRequest, LigneSaveRequest
} from '../../core/models/evaluation.model';

const PERIODES: PeriodeEvaluation[] = ['ANNUEL', 'S1', 'S2', 'T1', 'T2', 'T3', 'T4'];

@Component({
  selector: 'app-evaluations',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Évaluations des performances</h1>
      <p class="text-sm text-gray-500 mt-0.5">Objectifs, notation pondérée et entretiens d'évaluation</p>
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-600 font-medium">Année</label>
      <select [(ngModel)]="anneeFiltre" (ngModelChange)="onAnneeChange()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        @for (a of annees; track a) { <option [value]="a">{{ a }}</option> }
      </select>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1">
      <button (click)="tab = 'mes'" [class]="tabClass('mes')">Mes évaluations</button>
      @if (isAdmin) {
        <button (click)="tab = 'equipe'; chargerTout()" [class]="tabClass('equipe')">
          Équipe
          @if (soumisesCount > 0) {
            <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
              {{ soumisesCount }}
            </span>
          }
        </button>
        <button (click)="tab = 'objectifs'; chargerTousObjectifs()" [class]="tabClass('objectifs')">Objectifs</button>
      }
    </nav>
  </div>

  <!-- ── Tab: Mes évaluations ────────────────────────────────────────────── -->
  @if (tab === 'mes') {
    <div class="space-y-4">
      <!-- Mes objectifs summary -->
      @if (mesObjectifs.length > 0) {
        <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 class="text-sm font-semibold text-blue-800 mb-2">Mes objectifs {{ anneeFiltre }}</h3>
          <div class="flex flex-wrap gap-2">
            @for (o of mesObjectifs; track o.id) {
              <span class="px-2 py-1 bg-white border border-blue-200 rounded-lg text-xs text-blue-700">
                {{ o.titre }} <span class="font-bold">({{ o.poids }}%)</span>
              </span>
            }
          </div>
          <p class="text-xs text-blue-600 mt-2">
            Total pondération : <span class="font-bold">{{ totalPoids() }}%</span>
            @if (totalPoids() !== 100) {
              <span class="text-orange-600 ml-2">⚠ La somme doit atteindre 100%</span>
            }
          </p>
        </div>
      }

      @if (loading) {
        <div class="p-8 text-center text-gray-400 text-sm">Chargement…</div>
      } @else if (mesEvals.length === 0) {
        <div class="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p class="text-gray-400 text-sm">Aucune évaluation pour {{ anneeFiltre }}</p>
          <p class="text-gray-400 text-xs mt-1">Votre responsable créera votre fiche d'évaluation</p>
        </div>
      } @else {
        @for (ev of mesEvals; track ev.id) {
          <div class="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <!-- Eval header -->
            <div class="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <div class="flex items-center gap-3">
                <div>
                  <span class="font-semibold text-gray-800">{{ ev.periode }} {{ ev.annee }}</span>
                  <span class="ml-2 px-2 py-0.5 rounded-full text-xs font-semibold" [ngClass]="statutClass(ev.statut)">
                    {{ ev.statut }}
                  </span>
                </div>
                @if (ev.scoreGlobal !== null) {
                  <div class="flex items-center gap-1">
                    <div class="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                      <div class="h-2 rounded-full" [ngClass]="scoreColor(ev.scoreGlobal)"
                           [style.width.%]="(ev.scoreGlobal / 5) * 100"></div>
                    </div>
                    <span class="text-sm font-bold" [ngClass]="scoreTxtColor(ev.scoreGlobal)">
                      {{ ev.scoreGlobal | number:'1.1-2' }}/5
                    </span>
                  </div>
                }
              </div>
              <div class="flex gap-2">
                @if (ev.statut === 'BROUILLON') {
                  <button (click)="ouvrirSaisie(ev)"
                          class="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700">
                    Saisir mes notes
                  </button>
                  <button (click)="soumettre(ev)"
                          class="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700"
                          [disabled]="ev.lignes.length === 0">
                    Soumettre
                  </button>
                }
                @if (ev.statut !== 'BROUILLON') {
                  <button (click)="ouvrirDetail(ev)"
                          class="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200">
                    Voir détail
                  </button>
                }
              </div>
            </div>
            <!-- Lignes résumé -->
            @if (ev.lignes.length > 0) {
              <div class="px-5 py-3 space-y-2">
                @for (l of ev.lignes; track l.id) {
                  <div class="flex items-center gap-3">
                    <span class="text-xs text-gray-500 w-40 truncate">{{ l.objectifTitre }}</span>
                    <span class="text-xs text-gray-400">({{ l.objectifPoids }}%)</span>
                    <div class="flex gap-0.5">
                      @for (star of stars5; track star) {
                        <span class="text-sm" [ngClass]="star <= l.note ? 'text-yellow-400' : 'text-gray-200'">★</span>
                      }
                    </div>
                    <span class="text-xs font-medium text-gray-700">{{ l.note }}/5</span>
                    @if (l.commentaire) {
                      <span class="text-xs text-gray-400 italic truncate max-w-xs">{{ l.commentaire }}</span>
                    }
                  </div>
                }
              </div>
            }
            @if (ev.commentaireGlobal) {
              <div class="px-5 py-3 border-t border-gray-100 text-xs text-gray-600 italic bg-gray-50">
                "{{ ev.commentaireGlobal }}"
              </div>
            }
          </div>
        }
      }
    </div>
  }

  <!-- ── Tab: Équipe (ADMIN) ─────────────────────────────────────────────── -->
  @if (tab === 'equipe') {
    <div class="space-y-4">
      @if (isAdmin) {
        <div class="flex justify-end">
          <button (click)="openCreateEval()"
                  class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            + Créer une évaluation
          </button>
        </div>
      }
      @if (loadingEquipe) {
        <div class="p-8 text-center text-gray-400 text-sm">Chargement…</div>
      } @else if (toutesEvals.length === 0) {
        <div class="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
          Aucune évaluation pour {{ anneeFiltre }}
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-3 text-left">Collaborateur</th>
                <th class="px-4 py-3 text-left">Période</th>
                <th class="px-4 py-3 text-center">Score</th>
                <th class="px-4 py-3 text-center">Statut</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (ev of toutesEvals; track ev.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ ev.collaborateurNom }}</td>
                  <td class="px-4 py-3 text-gray-600">{{ ev.periode }} {{ ev.annee }}</td>
                  <td class="px-4 py-3 text-center">
                    @if (ev.scoreGlobal !== null) {
                      <span class="font-bold text-sm" [ngClass]="scoreTxtColor(ev.scoreGlobal)">
                        {{ ev.scoreGlobal | number:'1.1-2' }}/5
                      </span>
                    } @else {
                      <span class="text-gray-300">—</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [ngClass]="statutClass(ev.statut)">
                      {{ ev.statut }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right space-x-2">
                    <button (click)="ouvrirDetail(ev)"
                            class="text-xs text-blue-600 hover:text-blue-800 font-medium">Détail</button>
                    @if (ev.statut === 'SOUMISE') {
                      <button (click)="valider(ev)"
                              class="px-2 py-0.5 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium">
                        Valider
                      </button>
                    }
                    @if (ev.statut === 'BROUILLON') {
                      <button (click)="supprimerEval(ev)"
                              class="text-xs text-red-400 hover:text-red-600">Supprimer</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  }

  <!-- ── Tab: Objectifs (ADMIN) ─────────────────────────────────────────── -->
  @if (tab === 'objectifs') {
    <div class="space-y-4">
      <div class="flex justify-end">
        <button (click)="openObjectifForm(null)"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Ajouter un objectif
        </button>
      </div>
      @if (loadingObjectifs) {
        <div class="p-8 text-center text-gray-400 text-sm">Chargement…</div>
      } @else if (tousObjectifs.length === 0) {
        <div class="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
          Aucun objectif défini pour {{ anneeFiltre }}
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-3 text-left">Collaborateur</th>
                <th class="px-4 py-3 text-left">Objectif</th>
                <th class="px-4 py-3 text-left">Description</th>
                <th class="px-4 py-3 text-center">Poids</th>
                <th class="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (o of tousObjectifs; track o.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-gray-700">{{ o.collaborateurNom }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800">{{ o.titre }}</td>
                  <td class="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{{ o.description || '—' }}</td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-xs">{{ o.poids }}%</span>
                  </td>
                  <td class="px-4 py-3 text-right space-x-2">
                    <button (click)="openObjectifForm(o)"
                            class="text-xs text-blue-600 hover:text-blue-800 font-medium">Modifier</button>
                    <button (click)="supprimerObjectif(o)"
                            class="text-xs text-red-400 hover:text-red-600 font-medium">Supprimer</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  }

</div>

<!-- ── Modal: Saisie des notes ──────────────────────────────────────────── -->
@if (showSaisie && evalEnCours) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-semibold text-gray-900">
          Saisie des notes — {{ evalEnCours.periode }} {{ evalEnCours.annee }}
        </h2>
        <p class="text-xs text-gray-500 mt-0.5">{{ evalEnCours.collaborateurNom }}</p>
      </div>
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        @for (l of saisieForm; track l.objectifId) {
          <div class="bg-gray-50 rounded-xl p-4 space-y-2">
            <div class="flex items-center justify-between">
              <span class="font-medium text-gray-800 text-sm">{{ l.objectifTitre }}</span>
              <span class="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-bold">{{ l.objectifPoids }}%</span>
            </div>
            <!-- Star rating -->
            <div class="flex items-center gap-3">
              <div class="flex gap-1">
                @for (star of stars5; track star) {
                  <button (click)="l.note = star"
                          class="text-2xl transition-colors"
                          [ngClass]="star <= l.note ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'">
                    ★
                  </button>
                }
              </div>
              <span class="text-sm font-bold text-gray-700">{{ l.note }}/5</span>
            </div>
            <input type="text" [(ngModel)]="l.commentaire"
                   class="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs"
                   placeholder="Commentaire (optionnel)">
          </div>
        }
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Commentaire global</label>
          <textarea [(ngModel)]="saisieCommentaire" rows="2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Observations générales…"></textarea>
        </div>
        <!-- Score preview -->
        <div class="flex items-center gap-2 text-sm text-gray-600">
          <span>Score estimé :</span>
          <span class="font-bold text-lg" [ngClass]="scoreTxtColor(scorePreview())">
            {{ scorePreview() | number:'1.1-2' }}/5
          </span>
        </div>
      </div>
      @if (saisieErr) {
        <p class="mx-6 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ saisieErr }}</p>
      }
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
        <button (click)="showSaisie = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="enregistrerSaisie()"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          {{ saisieSaving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ── Modal: Détail évaluation ─────────────────────────────────────────── -->
@if (showDetail && evalDetail) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
      <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            Évaluation {{ evalDetail.periode }} {{ evalDetail.annee }}
          </h2>
          <p class="text-xs text-gray-500">{{ evalDetail.collaborateurNom }}</p>
        </div>
        <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [ngClass]="statutClass(evalDetail.statut)">
          {{ evalDetail.statut }}
        </span>
      </div>
      <div class="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        @for (l of evalDetail.lignes; track l.id) {
          <div class="flex items-center gap-3">
            <span class="text-sm text-gray-700 flex-1">{{ l.objectifTitre }}</span>
            <span class="text-xs text-gray-400">({{ l.objectifPoids }}%)</span>
            <div class="flex gap-0.5">
              @for (star of stars5; track star) {
                <span class="text-sm" [ngClass]="star <= l.note ? 'text-yellow-400' : 'text-gray-200'">★</span>
              }
            </div>
            <span class="text-sm font-bold text-gray-700 w-8">{{ l.note }}/5</span>
          </div>
        }
        @if (evalDetail.commentaireGlobal) {
          <div class="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 italic border-l-4 border-blue-300">
            {{ evalDetail.commentaireGlobal }}
          </div>
        }
        @if (evalDetail.scoreGlobal !== null) {
          <div class="flex items-center gap-3 pt-2 border-t border-gray-100">
            <span class="text-sm text-gray-600 font-medium">Score global :</span>
            <span class="text-2xl font-bold" [ngClass]="scoreTxtColor(evalDetail.scoreGlobal)">
              {{ evalDetail.scoreGlobal | number:'1.1-2' }}/5
            </span>
            <span class="text-xs text-gray-400">{{ scoreLabel(evalDetail.scoreGlobal) }}</span>
          </div>
        }
      </div>
      <div class="px-6 py-4 border-t border-gray-200 flex justify-end">
        <button (click)="showDetail = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Fermer</button>
      </div>
    </div>
  </div>
}

<!-- ── Modal: Objectif ───────────────────────────────────────────────────── -->
@if (showObjectifForm) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">
        {{ editObjectifId ? 'Modifier l\'objectif' : 'Nouvel objectif' }}
      </h2>
      <div class="space-y-3">
        @if (!editObjectifId) {
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Collaborateur</label>
            <select [(ngModel)]="objectifCollabId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="">— Sélectionner —</option>
              @for (c of collaborateurs; track c.id) {
                <option [value]="c.id">{{ c.nom }}</option>
              }
            </select>
          </div>
        }
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Intitulé <span class="text-red-500">*</span></label>
          <input type="text" [(ngModel)]="objectifForm.titre"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                 placeholder="Ex: Atteindre les objectifs de vente">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea [(ngModel)]="objectifForm.description" rows="2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Détails et critères de réussite…"></textarea>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Poids (%) <span class="text-red-500">*</span></label>
            <input type="number" [(ngModel)]="objectifForm.poids" min="1" max="100"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Année</label>
            <select [(ngModel)]="objectifForm.annee" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              @for (a of annees; track a) { <option [value]="a">{{ a }}</option> }
            </select>
          </div>
        </div>
      </div>
      @if (objectifErr) {
        <p class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ objectifErr }}</p>
      }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="showObjectifForm = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="sauvegarderObjectif()"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          {{ savingObjectif ? 'Enregistrement…' : (editObjectifId ? 'Modifier' : 'Créer') }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ── Modal: Créer évaluation ───────────────────────────────────────────── -->
@if (showCreateEval) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Créer une évaluation</h2>
      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Collaborateur</label>
          <select [(ngModel)]="createEvalCollabId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">— Sélectionner —</option>
            @for (c of collaborateurs; track c.id) {
              <option [value]="c.id">{{ c.nom }}</option>
            }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Année</label>
            <select [(ngModel)]="createEvalAnnee" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              @for (a of annees; track a) { <option [value]="a">{{ a }}</option> }
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Période</label>
            <select [(ngModel)]="createEvalPeriode" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
              @for (p of periodes; track p) { <option [value]="p">{{ p }}</option> }
            </select>
          </div>
        </div>
      </div>
      @if (createEvalErr) {
        <p class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ createEvalErr }}</p>
      }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="showCreateEval = false" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="creerEvaluation()"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          Créer
        </button>
      </div>
    </div>
  </div>
}
`,
})
export class EvaluationsComponent implements OnInit {
  private svc  = inject(EvaluationService);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  readonly periodes = PERIODES;
  readonly stars5   = [1, 2, 3, 4, 5];

  tab: 'mes' | 'equipe' | 'objectifs' = 'mes';

  anneeFiltre: number;
  annees: number[];

  mesEvals:      EvaluationResponse[]  = [];
  toutesEvals:   EvaluationResponse[]  = [];
  mesObjectifs:  ObjectifResponse[]    = [];
  tousObjectifs: ObjectifResponse[]    = [];
  soumisesCount  = 0;

  loading         = false;
  loadingEquipe   = false;
  loadingObjectifs = false;

  // collaborateurs list (extracted from objectifs)
  collaborateurs: { id: string; nom: string }[] = [];

  // Saisie modal
  showSaisie     = false;
  evalEnCours:   EvaluationResponse | null = null;
  saisieForm:    (LigneSaveRequest & { objectifTitre: string; objectifPoids: number })[] = [];
  saisieCommentaire = '';
  saisieErr      = '';
  saisieSaving   = false;

  // Detail modal
  showDetail   = false;
  evalDetail:  EvaluationResponse | null = null;

  // Objectif form
  showObjectifForm = false;
  editObjectifId: string | null = null;
  objectifCollabId = '';
  objectifForm: ObjectifSaveRequest = { titre: '', description: null, poids: 20, annee: new Date().getFullYear() };
  objectifErr  = '';
  savingObjectif = false;

  // Create eval modal
  showCreateEval    = false;
  createEvalCollabId = '';
  createEvalAnnee:  number;
  createEvalPeriode: PeriodeEvaluation = 'ANNUEL';
  createEvalErr     = '';

  get isAdmin() { return this.auth.user()?.role === 'ADMIN'; }

  constructor() {
    const currentYear = new Date().getFullYear();
    this.anneeFiltre   = currentYear;
    this.createEvalAnnee = currentYear;
    this.annees = [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];
  }

  ngOnInit(): void {
    this.chargerMesEvals();
    this.chargerMesObjectifs();
  }

  onAnneeChange(): void {
    this.chargerMesEvals();
    this.chargerMesObjectifs();
    if (this.tab === 'equipe')   this.chargerTout();
    if (this.tab === 'objectifs') this.chargerTousObjectifs();
  }

  chargerMesEvals(): void {
    this.loading = true;
    this.svc.mesEvaluations().subscribe({
      next: d => {
        this.mesEvals = d.filter(e => e.annee === this.anneeFiltre);
        this.loading  = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  chargerMesObjectifs(): void {
    this.svc.mesObjectifs(this.anneeFiltre).subscribe({
      next: d => { this.mesObjectifs = d; this.cdr.markForCheck(); }
    });
  }

  chargerTout(): void {
    this.loadingEquipe = true;
    this.svc.allEvaluations().subscribe({
      next: d => {
        this.toutesEvals   = d.filter(e => e.annee === this.anneeFiltre);
        this.soumisesCount = this.toutesEvals.filter(e => e.statut === 'SOUMISE').length;
        this.loadingEquipe = false;
        this.extractCollaborateurs(d);
        this.cdr.markForCheck();
      },
      error: () => { this.loadingEquipe = false; this.cdr.markForCheck(); }
    });
  }

  chargerTousObjectifs(): void {
    this.loadingObjectifs = true;
    this.svc.allObjectifs(this.anneeFiltre).subscribe({
      next: d => {
        this.tousObjectifs    = d;
        this.loadingObjectifs = false;
        this.extractCollaborateurs(d);
        this.cdr.markForCheck();
      },
      error: () => { this.loadingObjectifs = false; this.cdr.markForCheck(); }
    });
  }

  private extractCollaborateurs(items: { collaborateurId: string; collaborateurNom: string }[]): void {
    const map = new Map<string, string>();
    for (const it of items) map.set(it.collaborateurId, it.collaborateurNom);
    this.collaborateurs = Array.from(map.entries()).map(([id, nom]) => ({ id, nom }));
  }

  tabClass(t: string): string {
    return this.tab === t
      ? 'px-4 py-2.5 text-sm font-medium text-blue-600 border-b-2 border-blue-600'
      : 'px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent';
  }

  statutClass(s: StatutEvaluation): string {
    return { BROUILLON: 'bg-gray-100 text-gray-600', SOUMISE: 'bg-orange-100 text-orange-700', VALIDEE: 'bg-green-100 text-green-700' }[s];
  }

  scoreColor(score: number): string {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-blue-500';
    if (score >= 2) return 'bg-orange-400';
    return 'bg-red-400';
  }

  scoreTxtColor(score: number): string {
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-blue-600';
    if (score >= 2) return 'text-orange-500';
    return 'text-red-500';
  }

  scoreLabel(score: number): string {
    if (score >= 4.5) return 'Exceptionnel';
    if (score >= 3.5) return 'Très bien';
    if (score >= 2.5) return 'Bien';
    if (score >= 1.5) return 'À améliorer';
    return 'Insuffisant';
  }

  totalPoids(): number { return this.mesObjectifs.reduce((s, o) => s + o.poids, 0); }

  scorePreview(): number {
    if (!this.saisieForm.length) return 0;
    let total = 0, poidsTotal = 0;
    for (const l of this.saisieForm) {
      total      += l.note * l.objectifPoids;
      poidsTotal += l.objectifPoids;
    }
    return poidsTotal ? total / poidsTotal : 0;
  }

  // ── Saisie ───────────────────────────────────────────────────────────────

  ouvrirSaisie(ev: EvaluationResponse): void {
    this.evalEnCours = ev;
    // Load objectifs for this collaborateur+annee to build form
    this.svc.mesObjectifs(ev.annee).subscribe({
      next: objectifs => {
        this.saisieForm = objectifs.map(o => {
          const existing = ev.lignes.find(l => l.objectifId === o.id);
          return { objectifId: o.id, objectifTitre: o.titre, objectifPoids: o.poids, note: existing?.note ?? 0, commentaire: existing?.commentaire ?? null };
        });
        this.saisieCommentaire = ev.commentaireGlobal ?? '';
        this.saisieErr  = '';
        this.showSaisie = true;
        this.cdr.markForCheck();
      }
    });
  }

  enregistrerSaisie(): void {
    this.saisieSaving = true;
    this.saisieErr    = '';
    const req = {
      commentaireGlobal: this.saisieCommentaire || null,
      lignes: this.saisieForm.map(l => ({ objectifId: l.objectifId, note: l.note, commentaire: l.commentaire }))
    };
    this.svc.saveLignes(this.evalEnCours!.id, req).subscribe({
      next: () => { this.saisieSaving = false; this.showSaisie = false; this.chargerMesEvals(); },
      error: (e: any) => { this.saisieSaving = false; this.saisieErr = e?.error?.message ?? 'Erreur.'; this.cdr.markForCheck(); }
    });
  }

  soumettre(ev: EvaluationResponse): void {
    this.svc.soumettre(ev.id).subscribe({ next: () => this.chargerMesEvals() });
  }

  valider(ev: EvaluationResponse): void {
    this.svc.valider(ev.id).subscribe({ next: () => this.chargerTout() });
  }

  supprimerEval(ev: EvaluationResponse): void {
    if (!confirm('Supprimer cette évaluation ?')) return;
    this.svc.delete(ev.id).subscribe({ next: () => this.chargerTout() });
  }

  ouvrirDetail(ev: EvaluationResponse): void {
    this.evalDetail  = ev;
    this.showDetail  = true;
  }

  // ── Objectifs ────────────────────────────────────────────────────────────

  openObjectifForm(o: ObjectifResponse | null): void {
    this.editObjectifId   = o?.id ?? null;
    this.objectifCollabId = o?.collaborateurId ?? '';
    this.objectifForm     = { titre: o?.titre ?? '', description: o?.description ?? null, poids: o?.poids ?? 20, annee: o?.annee ?? this.anneeFiltre };
    this.objectifErr      = '';
    this.showObjectifForm = true;
  }

  sauvegarderObjectif(): void {
    if (!this.objectifForm.titre.trim()) { this.objectifErr = 'L\'intitulé est obligatoire.'; return; }
    if (!this.editObjectifId && !this.objectifCollabId) { this.objectifErr = 'Sélectionner un collaborateur.'; return; }
    this.savingObjectif = true;
    this.objectifErr    = '';
    const obs = this.editObjectifId
      ? this.svc.updateObjectif(this.editObjectifId, this.objectifForm)
      : this.svc.createObjectif(this.objectifCollabId, this.objectifForm);
    obs.subscribe({
      next: () => { this.savingObjectif = false; this.showObjectifForm = false; this.chargerTousObjectifs(); },
      error: (e: any) => { this.savingObjectif = false; this.objectifErr = e?.error?.message ?? 'Erreur.'; this.cdr.markForCheck(); }
    });
  }

  supprimerObjectif(o: ObjectifResponse): void {
    if (!confirm(`Supprimer l'objectif "${o.titre}" ?`)) return;
    this.svc.deleteObjectif(o.id).subscribe({ next: () => this.chargerTousObjectifs() });
  }

  // ── Créer évaluation ─────────────────────────────────────────────────────

  openCreateEval(): void {
    if (!this.collaborateurs.length) this.chargerTousObjectifs();
    this.createEvalCollabId = '';
    this.createEvalAnnee    = this.anneeFiltre;
    this.createEvalPeriode  = 'ANNUEL';
    this.createEvalErr      = '';
    this.showCreateEval     = true;
  }

  creerEvaluation(): void {
    if (!this.createEvalCollabId) { this.createEvalErr = 'Sélectionner un collaborateur.'; return; }
    this.svc.create({ collaborateurId: this.createEvalCollabId, annee: this.createEvalAnnee, periode: this.createEvalPeriode }).subscribe({
      next: () => { this.showCreateEval = false; this.chargerTout(); },
      error: (e: any) => { this.createEvalErr = e?.error?.message ?? 'Erreur.'; this.cdr.markForCheck(); }
    });
  }
}
