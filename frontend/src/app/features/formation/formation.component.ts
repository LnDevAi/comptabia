import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormationService } from '../../core/services/formation.service';
import { AuthService } from '../../core/services/auth.service';
import {
  FormationResponse, FormationSaveRequest, FormationUpdateRequest,
  SessionResponse, SessionUpdateRequest,
  InscriptionResponse, BilanCollaborateur,
  StatutFormation, StatutSession, StatutInscription,
  DOMAINES
} from '../../core/models/formation.model';

const STATUTS_FORMATION: { val: StatutFormation; label: string; css: string }[] = [
  { val: 'PLANIFIE',  label: 'Planifié',   css: 'bg-gray-100 text-gray-700' },
  { val: 'EN_COURS',  label: 'En cours',   css: 'bg-blue-100 text-blue-700' },
  { val: 'REALISE',   label: 'Réalisé',    css: 'bg-green-100 text-green-700' },
  { val: 'ANNULE',    label: 'Annulé',     css: 'bg-red-100 text-red-500' },
];

const STATUTS_SESSION: { val: StatutSession; label: string; css: string }[] = [
  { val: 'PLANIFIEE', label: 'Planifiée',  css: 'bg-gray-100 text-gray-700' },
  { val: 'EN_COURS',  label: 'En cours',   css: 'bg-blue-100 text-blue-700' },
  { val: 'TERMINEE',  label: 'Terminée',   css: 'bg-green-100 text-green-700' },
  { val: 'ANNULEE',   label: 'Annulée',    css: 'bg-red-100 text-red-500' },
];

const STATUTS_INSCRIPTION: { val: StatutInscription; label: string; css: string }[] = [
  { val: 'INSCRIT',   label: 'Inscrit',    css: 'bg-gray-100 text-gray-700' },
  { val: 'PRESENT',   label: 'Présent',    css: 'bg-blue-100 text-blue-700' },
  { val: 'ABSENT',    label: 'Absent',     css: 'bg-red-100 text-red-500' },
  { val: 'CERTIFIE',  label: 'Certifié',   css: 'bg-green-100 text-green-700' },
];

@Component({
  selector: 'app-formation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Formation professionnelle</h1>
      <p class="text-sm text-gray-500 mt-0.5">Plan de formation, sessions, inscriptions et bilan des compétences</p>
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-600 font-medium">Année</label>
      <select [(ngModel)]="annee" (ngModelChange)="chargerFormations()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm">
        @for (a of annees; track a) { <option [value]="a">{{ a }}</option> }
      </select>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1">
      <button (click)="tab = 'plan'" [class]="tabClass('plan')">Plan de formation</button>
      <button (click)="tab = 'sessions'; chargerSessions()" [class]="tabClass('sessions')">Sessions</button>
      @if (isAdmin) {
        <button (click)="tab = 'bilan'; chargerBilan()" [class]="tabClass('bilan')">Bilan RH</button>
      }
      @if (!isAdmin) {
        <button (click)="tab = 'mes'" [class]="tabClass('mes')">Mes formations</button>
      }
    </nav>
  </div>

  <!-- ── Plan de formation ───────────────────────────────────────────────── -->
  @if (tab === 'plan') {
    <div class="space-y-4">
      @if (isAdmin) {
        <div class="flex justify-end">
          <button (click)="ouvrirCreerFormation()"
                  class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Nouvelle formation
          </button>
        </div>
      }
      @if (formations.length === 0) {
        <div class="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
          <svg class="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
          </svg>
          <p class="text-sm">Aucune formation planifiée pour {{ annee }}.</p>
        </div>
      }
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (f of formations; track f.id) {
          <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow space-y-3 cursor-pointer"
               (click)="ouvrirDetailFormation(f)">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-blue-600 uppercase tracking-wide">{{ f.domaine }}</p>
                <h3 class="font-semibold text-gray-900 mt-0.5 leading-snug">{{ f.titre }}</h3>
              </div>
              <span [class]="'shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ' + statutFormationCss(f.statut)">
                {{ statutFormationLabel(f.statut) }}
              </span>
            </div>
            @if (f.objectif) {
              <p class="text-xs text-gray-500 leading-relaxed line-clamp-2">{{ f.objectif }}</p>
            }
            <div class="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
              <span>{{ f.nbSessions }} session(s)</span>
              @if (f.budgetPrevu) {
                <span class="font-medium text-gray-600">{{ fmt(f.budgetPrevu) }} XOF</span>
              }
            </div>
            @if (isAdmin) {
              <div class="flex gap-2 pt-1" (click)="$event.stopPropagation()">
                <button (click)="ouvrirModifierFormation(f)"
                        class="text-xs text-blue-600 hover:underline">Modifier</button>
                <button (click)="supprimerFormation(f.id)"
                        class="text-xs text-red-500 hover:underline">Supprimer</button>
                <button (click)="ouvrirCreerSession(f)"
                        class="ml-auto text-xs text-indigo-600 hover:underline">+ Session</button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  }

  <!-- ── Sessions ───────────────────────────────────────────────────────── -->
  @if (tab === 'sessions') {
    <div class="space-y-4">
      @if (isAdmin) {
        <div class="flex justify-end">
          <button (click)="ouvrirCreerSession(null)"
                  class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            + Nouvelle session
          </button>
        </div>
      }
      @if (sessions.length === 0) {
        <p class="text-center text-gray-400 py-12">Aucune session planifiée.</p>
      }
      <div class="space-y-3">
        @for (s of sessions; track s.id) {
          <div class="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-gray-900">{{ s.formationTitre }}</span>
                  <span [class]="'px-2 py-0.5 rounded-full text-xs font-medium ' + statutSessionCss(s.statut)">
                    {{ statutSessionLabel(s.statut) }}
                  </span>
                </div>
                <div class="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                  <span>{{ formatDate(s.dateDebut) }} → {{ formatDate(s.dateFin) }}</span>
                  @if (s.lieu) { <span>📍 {{ s.lieu }}</span> }
                  @if (s.formateur) { <span>👤 {{ s.formateur }}</span> }
                </div>
              </div>
              <div class="flex items-center gap-4 text-sm shrink-0">
                <div class="text-center">
                  <div class="font-semibold text-gray-900">{{ s.nbInscrits }}/{{ s.nbPlaces }}</div>
                  <div class="text-xs text-gray-400">places</div>
                </div>
                @if (s.coutReel) {
                  <div class="text-center">
                    <div class="font-semibold text-gray-900">{{ fmt(s.coutReel) }}</div>
                    <div class="text-xs text-gray-400">XOF</div>
                  </div>
                }
              </div>
            </div>
            @if (isAdmin) {
              <div class="flex gap-3 mt-3 pt-3 border-t border-gray-100">
                <button (click)="voirInscriptions(s)"
                        class="text-xs text-blue-600 hover:underline">Participants ({{ s.nbInscrits }})</button>
                <button (click)="ouvrirModifierSession(s)"
                        class="text-xs text-gray-500 hover:underline">Modifier</button>
                <button (click)="supprimerSession(s.id)"
                        class="text-xs text-red-500 hover:underline">Supprimer</button>
              </div>
            }
          </div>
        }
      </div>
    </div>
  }

  <!-- ── Mes formations ─────────────────────────────────────────────────── -->
  @if (tab === 'mes') {
    <div class="space-y-3">
      @if (mesInscriptions.length === 0) {
        <p class="text-center text-gray-400 py-12">Vous n'êtes inscrit à aucune formation.</p>
      }
      @for (i of mesInscriptions; track i.id) {
        <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-4">
          <div>
            <div class="font-medium text-gray-900">{{ i.sessionId }}</div>
            <div class="text-xs text-gray-400 mt-0.5">Inscrit le {{ formatDate(i.createdAt) }}</div>
          </div>
          <div class="flex items-center gap-3">
            @if (i.note != null) {
              <span class="text-sm font-bold text-blue-700">{{ i.note }}/20</span>
            }
            <span [class]="'px-2.5 py-1 rounded-full text-xs font-medium ' + statutInscriptionCss(i.statut)">
              {{ statutInscriptionLabel(i.statut) }}
            </span>
          </div>
        </div>
      }
    </div>
  }

  <!-- ── Bilan RH ───────────────────────────────────────────────────────── -->
  @if (tab === 'bilan' && isAdmin) {
    <div class="space-y-4">
      @if (bilan.length === 0) {
        <p class="text-center text-gray-400 py-12">Aucun bilan disponible — aucune inscription enregistrée.</p>
      }
      <div class="overflow-auto rounded-xl border border-gray-200">
        <table class="w-full text-sm text-left">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-3">Collaborateur</th>
              <th class="px-4 py-3 text-center">Formations</th>
              <th class="px-4 py-3 text-center">Certifications</th>
              <th class="px-4 py-3">Domaines formés</th>
              <th class="px-4 py-3 text-center">Note moy. /20</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (b of bilan; track b.collaborateurId) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-900">{{ b.collaborateurNom }}</td>
                <td class="px-4 py-3 text-center text-gray-700">{{ b.nbFormations }}</td>
                <td class="px-4 py-3 text-center">
                  @if (b.nbCertifications > 0) {
                    <span class="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      {{ b.nbCertifications }} ✓
                    </span>
                  } @else {
                    <span class="text-gray-400">—</span>
                  }
                </td>
                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    @for (d of b.domainesFormes; track d) {
                      <span class="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{{ d }}</span>
                    }
                  </div>
                </td>
                <td class="px-4 py-3 text-center font-semibold text-gray-900">
                  {{ b.noteMoyenne != null ? b.noteMoyenne : '—' }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  }

</div>

<!-- ── Modal formation ───────────────────────────────────────────────────── -->
@if (modalFormation) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
      <h2 class="text-lg font-bold text-gray-900">{{ editFormationId ? 'Modifier la formation' : 'Nouvelle formation' }}</h2>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Titre</label>
        <input [(ngModel)]="fForm.titre" class="input-field" placeholder="Ex: Formation SYSCOHADA 2025">
      </div>
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Domaine</label>
          <select [(ngModel)]="fForm.domaine" class="input-field">
            <option value="">— Choisir —</option>
            @for (d of domaines; track d) { <option [value]="d">{{ d }}</option> }
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Année</label>
          <input [(ngModel)]="fForm.annee" type="number" class="input-field" [value]="annee">
        </div>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Objectif</label>
        <textarea [(ngModel)]="fForm.objectif" rows="2" class="input-field resize-none"
                  placeholder="Décrire l'objectif pédagogique..."></textarea>
      </div>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Budget prévisionnel (XOF)</label>
        <input [(ngModel)]="fForm.budgetPrevu" type="number" class="input-field" placeholder="0">
      </div>
      @if (editFormationId) {
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Statut</label>
          <select [(ngModel)]="fUpdateForm.statut" class="input-field">
            @for (s of statutsFormation; track s.val) { <option [value]="s.val">{{ s.label }}</option> }
          </select>
        </div>
      }
      @if (erreur) { <p class="text-red-500 text-sm">{{ erreur }}</p> }
      <div class="flex justify-end gap-2 pt-2">
        <button (click)="fermerModals()" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="sauvegarderFormation()" [disabled]="loading"
                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
          {{ loading ? '...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ── Modal session ─────────────────────────────────────────────────────── -->
@if (modalSession) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
      <h2 class="text-lg font-bold text-gray-900">{{ editSessionId ? 'Modifier la session' : 'Nouvelle session' }}</h2>
      @if (!editSessionId) {
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Formation</label>
          <select [(ngModel)]="sForm.formationId" class="input-field">
            <option value="">— Choisir —</option>
            @for (f of formations; track f.id) { <option [value]="f.id">{{ f.titre }}</option> }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date début</label>
            <input [(ngModel)]="sForm.dateDebut" type="date" class="input-field">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
            <input [(ngModel)]="sForm.dateFin" type="date" class="input-field">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Lieu</label>
            <input [(ngModel)]="sForm.lieu" class="input-field" placeholder="Salle / Ville">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Formateur</label>
            <input [(ngModel)]="sForm.formateur" class="input-field" placeholder="Nom du formateur">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Nb de places</label>
            <input [(ngModel)]="sForm.nbPlaces" type="number" class="input-field" placeholder="10">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Coût réel (XOF)</label>
            <input [(ngModel)]="sForm.coutReel" type="number" class="input-field" placeholder="0">
          </div>
        </div>
      } @else {
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Statut</label>
          <select [(ngModel)]="sUpdateForm.statut" class="input-field">
            @for (s of statutsSession; track s.val) { <option [value]="s.val">{{ s.label }}</option> }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date début</label>
            <input [(ngModel)]="sUpdateForm.dateDebut" type="date" class="input-field">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date fin</label>
            <input [(ngModel)]="sUpdateForm.dateFin" type="date" class="input-field">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Lieu</label>
            <input [(ngModel)]="sUpdateForm.lieu" class="input-field">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Coût réel (XOF)</label>
            <input [(ngModel)]="sUpdateForm.coutReel" type="number" class="input-field">
          </div>
        </div>
      }
      @if (erreur) { <p class="text-red-500 text-sm">{{ erreur }}</p> }
      <div class="flex justify-end gap-2 pt-2">
        <button (click)="fermerModals()" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="sauvegarderSession()" [disabled]="loading"
                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
          {{ loading ? '...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ── Modal inscriptions ────────────────────────────────────────────────── -->
@if (modalInscriptions && sessionActive) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-gray-900">Participants — {{ sessionActive.formationTitre }}</h2>
        <button (click)="fermerModals()" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
      </div>
      <p class="text-sm text-gray-500">
        {{ formatDate(sessionActive.dateDebut) }} → {{ formatDate(sessionActive.dateFin) }}
        &nbsp;·&nbsp; {{ inscriptions.length }}/{{ sessionActive.nbPlaces }} places
      </p>

      <!-- Ajouter un inscrit -->
      <div class="flex gap-2">
        <input [(ngModel)]="nouvelInscritId" class="input-field flex-1" placeholder="UUID du collaborateur">
        <button (click)="ajouterInscrit()" [disabled]="!nouvelInscritId"
                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 shrink-0">
          Inscrire
        </button>
      </div>

      <div class="divide-y divide-gray-100 max-h-72 overflow-y-auto">
        @for (i of inscriptions; track i.id) {
          <div class="flex items-center justify-between py-2.5 gap-3">
            <span class="font-medium text-gray-900 flex-1">{{ i.collaborateurNom }}</span>
            <div class="flex items-center gap-2">
              <select [(ngModel)]="i.statut" (ngModelChange)="modifierInscription(i)"
                      class="text-xs border border-gray-200 rounded px-2 py-1">
                @for (s of statutsInscription; track s.val) { <option [value]="s.val">{{ s.label }}</option> }
              </select>
              <input [(ngModel)]="i.note" type="number" min="0" max="20" step="0.5"
                     (change)="modifierInscription(i)"
                     class="w-16 text-xs border border-gray-200 rounded px-2 py-1 text-center"
                     placeholder="/20">
              <button (click)="retirerInscrit(i.id)" class="text-red-400 hover:text-red-600 text-xs">Retirer</button>
            </div>
          </div>
        }
        @if (inscriptions.length === 0) {
          <p class="py-6 text-center text-gray-400 text-sm">Aucun participant inscrit.</p>
        }
      </div>
    </div>
  </div>
}
`,
  styles: [`
    .input-field { @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class FormationComponent implements OnInit {
  private svc = inject(FormationService);
  private auth = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  tab: 'plan' | 'sessions' | 'mes' | 'bilan' = 'plan';
  annee = new Date().getFullYear();
  annees = Array.from({ length: 5 }, (_, i) => this.annee - 1 + i);
  domaines = DOMAINES;
  statutsFormation = STATUTS_FORMATION;
  statutsSession = STATUTS_SESSION;
  statutsInscription = STATUTS_INSCRIPTION;

  formations: FormationResponse[] = [];
  sessions: SessionResponse[] = [];
  mesInscriptions: InscriptionResponse[] = [];
  inscriptions: InscriptionResponse[] = [];
  bilan: BilanCollaborateur[] = [];

  modalFormation = false;
  modalSession = false;
  modalInscriptions = false;
  sessionActive: SessionResponse | null = null;

  editFormationId: string | null = null;
  editSessionId: string | null = null;
  loading = false;
  erreur = '';
  nouvelInscritId = '';

  fForm: FormationSaveRequest = this.emptyFForm();
  fUpdateForm: FormationUpdateRequest = {};
  sForm: any = this.emptySForm();
  sUpdateForm: SessionUpdateRequest = {};

  get isAdmin() { return this.auth.user()?.role === 'ADMIN'; }

  ngOnInit() {
    this.chargerFormations();
    if (!this.isAdmin) this.chargerMesFormations();
  }

  chargerFormations() {
    this.svc.findByAnnee(this.annee).subscribe({ next: d => { this.formations = d; this.cdr.markForCheck(); } });
  }

  chargerSessions() {
    this.svc.findSessions().subscribe({ next: d => { this.sessions = d; this.cdr.markForCheck(); } });
  }

  chargerMesFormations() {
    this.svc.mesFormations().subscribe({ next: d => { this.mesInscriptions = d; this.cdr.markForCheck(); } });
  }

  chargerBilan() {
    this.svc.bilan().subscribe({ next: d => { this.bilan = d; this.cdr.markForCheck(); } });
  }

  ouvrirDetailFormation(f: FormationResponse) {
    this.tab = 'sessions';
    this.chargerSessions();
  }

  // ── Formation CRUD ────────────────────────────────────────────────────────

  ouvrirCreerFormation() {
    this.editFormationId = null;
    this.fForm = this.emptyFForm();
    this.fForm.annee = this.annee;
    this.erreur = '';
    this.modalFormation = true;
  }

  ouvrirModifierFormation(f: FormationResponse) {
    this.editFormationId = f.id;
    this.fForm = { titre: f.titre, domaine: f.domaine, objectif: f.objectif, annee: f.annee, budgetPrevu: f.budgetPrevu };
    this.fUpdateForm = { titre: f.titre, domaine: f.domaine, objectif: f.objectif, budgetPrevu: f.budgetPrevu, statut: f.statut };
    this.erreur = '';
    this.modalFormation = true;
  }

  sauvegarderFormation() {
    this.loading = true; this.erreur = '';
    const obs = this.editFormationId
      ? this.svc.updateFormation(this.editFormationId, this.fUpdateForm)
      : this.svc.createFormation(this.fForm);
    obs.subscribe({
      next: () => { this.fermerModals(); this.chargerFormations(); },
      error: e => { this.erreur = e.error?.message || 'Erreur'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  supprimerFormation(id: string) {
    if (!confirm('Supprimer cette formation et toutes ses sessions ?')) return;
    this.svc.deleteFormation(id).subscribe({ next: () => this.chargerFormations() });
  }

  // ── Session CRUD ──────────────────────────────────────────────────────────

  ouvrirCreerSession(f: FormationResponse | null) {
    this.editSessionId = null;
    this.sForm = this.emptySForm();
    if (f) this.sForm.formationId = f.id;
    this.erreur = '';
    this.modalSession = true;
  }

  ouvrirModifierSession(s: SessionResponse) {
    this.editSessionId = s.id;
    this.sUpdateForm = {
      dateDebut: s.dateDebut, dateFin: s.dateFin, lieu: s.lieu,
      formateur: s.formateur, nbPlaces: s.nbPlaces, coutReel: s.coutReel, statut: s.statut
    };
    this.erreur = '';
    this.modalSession = true;
  }

  sauvegarderSession() {
    this.loading = true; this.erreur = '';
    const obs = this.editSessionId
      ? this.svc.updateSession(this.editSessionId, this.sUpdateForm)
      : this.svc.createSession(this.sForm);
    obs.subscribe({
      next: () => { this.fermerModals(); this.chargerSessions(); },
      error: e => { this.erreur = e.error?.message || 'Erreur'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  supprimerSession(id: string) {
    if (!confirm('Supprimer cette session ?')) return;
    this.svc.deleteSession(id).subscribe({ next: () => this.chargerSessions() });
  }

  // ── Inscriptions ──────────────────────────────────────────────────────────

  voirInscriptions(s: SessionResponse) {
    this.sessionActive = s;
    this.nouvelInscritId = '';
    this.svc.findInscriptions(s.id).subscribe({
      next: d => { this.inscriptions = d; this.modalInscriptions = true; this.cdr.markForCheck(); }
    });
  }

  ajouterInscrit() {
    if (!this.sessionActive || !this.nouvelInscritId) return;
    this.svc.inscrire(this.sessionActive.id, this.nouvelInscritId).subscribe({
      next: i => { this.inscriptions.push(i); this.nouvelInscritId = ''; this.cdr.markForCheck(); },
      error: e => { alert(e.error?.message || 'Erreur inscription'); }
    });
  }

  modifierInscription(i: InscriptionResponse) {
    this.svc.updateInscription(i.id, { statut: i.statut, note: i.note, commentaire: i.commentaire }).subscribe();
  }

  retirerInscrit(id: string) {
    if (!confirm('Retirer ce participant ?')) return;
    this.svc.desinscrire(id).subscribe({
      next: () => { this.inscriptions = this.inscriptions.filter(i => i.id !== id); this.cdr.markForCheck(); }
    });
  }

  fermerModals() {
    this.modalFormation = false;
    this.modalSession = false;
    this.modalInscriptions = false;
    this.loading = false;
    this.cdr.markForCheck();
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  fmt(v: number | null) {
    if (v == null) return '—';
    return new Intl.NumberFormat('fr-FR').format(v);
  }

  formatDate(d: string) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }

  statutFormationLabel(s: StatutFormation) { return STATUTS_FORMATION.find(x => x.val === s)?.label ?? s; }
  statutFormationCss(s: StatutFormation) { return STATUTS_FORMATION.find(x => x.val === s)?.css ?? ''; }
  statutSessionLabel(s: StatutSession) { return STATUTS_SESSION.find(x => x.val === s)?.label ?? s; }
  statutSessionCss(s: StatutSession) { return STATUTS_SESSION.find(x => x.val === s)?.css ?? ''; }
  statutInscriptionLabel(s: StatutInscription) { return STATUTS_INSCRIPTION.find(x => x.val === s)?.label ?? s; }
  statutInscriptionCss(s: StatutInscription) { return STATUTS_INSCRIPTION.find(x => x.val === s)?.css ?? ''; }

  tabClass(t: string) {
    const base = 'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ';
    return this.tab === t
      ? base + 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
      : base + 'text-gray-500 hover:text-gray-700';
  }

  private emptyFForm(): FormationSaveRequest {
    return { titre: '', domaine: '', objectif: null, annee: this.annee, budgetPrevu: null };
  }

  private emptySForm() {
    return { formationId: '', dateDebut: '', dateFin: '', lieu: null, formateur: null, nbPlaces: 10, coutReel: null };
  }
}
