import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisciplineService } from '../../core/services/discipline.service';
import {
  DossierResponse, DossierSaveRequest, DossierUpdateRequest,
  EtapeSaveRequest, HistoriqueCollaborateur,
  TypeSanction, StatutDossier, TypeEtape
} from '../../core/models/discipline.model';

const SANCTIONS: { val: TypeSanction; label: string; css: string; gravite: number }[] = [
  { val: 'AVERTISSEMENT', label: 'Avertissement', css: 'bg-yellow-100 text-yellow-700', gravite: 1 },
  { val: 'BLAME',         label: 'Blâme',         css: 'bg-orange-100 text-orange-700', gravite: 2 },
  { val: 'MISE_A_PIED',   label: 'Mise à pied',   css: 'bg-red-100 text-red-600',       gravite: 3 },
  { val: 'LICENCIEMENT',  label: 'Licenciement',  css: 'bg-red-200 text-red-800',       gravite: 4 },
];

const STATUTS: { val: StatutDossier; label: string; css: string }[] = [
  { val: 'EN_COURS', label: 'En cours', css: 'bg-blue-100 text-blue-700' },
  { val: 'CLOTURE',  label: 'Clôturé',  css: 'bg-gray-100 text-gray-600' },
  { val: 'ANNULE',   label: 'Annulé',   css: 'bg-gray-100 text-gray-400' },
];

const ETAPES: { val: TypeEtape; label: string; icon: string }[] = [
  { val: 'CONVOCATION', label: 'Convocation à entretien',   icon: '📩' },
  { val: 'ENTRETIEN',   label: 'Entretien préalable',       icon: '🗣️' },
  { val: 'DECISION',    label: 'Notification de décision',  icon: '📋' },
  { val: 'CLOTURE',     label: 'Clôture du dossier',        icon: '✅' },
];

@Component({
  selector: 'app-discipline',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Discipline & Sanctions RH</h1>
      <p class="text-sm text-gray-500 mt-0.5">Gestion des procédures disciplinaires et suivi par collaborateur</p>
    </div>
    <button (click)="ouvrirCreer()"
            class="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
      + Nouveau dossier
    </button>
  </div>

  <!-- Compteurs rapides -->
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    @for (s of sanctions; track s.val) {
      <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
        <div class="text-2xl font-bold text-gray-900">{{ countByType(s.val) }}</div>
        <div [class]="'mt-1 px-2 py-0.5 rounded-full text-xs font-medium inline-block ' + s.css">{{ s.label }}</div>
      </div>
    }
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1">
      <button (click)="tab = 'dossiers'" [class]="tabClass('dossiers')">
        Dossiers
        @if (enCoursCount > 0) {
          <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-red-100 text-red-700">{{ enCoursCount }}</span>
        }
      </button>
      <button (click)="tab = 'historique'; chargerHistorique()" [class]="tabClass('historique')">
        Historique par collaborateur
      </button>
    </nav>
  </div>

  <!-- ── Dossiers ───────────────────────────────────────────────────────── -->
  @if (tab === 'dossiers') {
    <!-- Filtre statut -->
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">Afficher :</span>
      <button (click)="filtreStatut = null"
              [class]="'px-3 py-1 rounded-full text-xs font-medium transition-colors ' + (!filtreStatut ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600')">
        Tous ({{ dossiers.length }})
      </button>
      @for (s of statuts; track s.val) {
        <button (click)="filtreStatut = s.val"
                [class]="'px-3 py-1 rounded-full text-xs font-medium transition-colors ' + (filtreStatut === s.val ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600')">
          {{ s.label }} ({{ countByStatut(s.val) }})
        </button>
      }
    </div>

    @if (dossiersFiltres.length === 0) {
      <div class="bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col items-center justify-center py-16 text-gray-400">
        <svg class="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p class="text-sm">Aucun dossier disciplinaire.</p>
      </div>
    }

    <div class="space-y-3">
      @for (d of dossiersFiltres; track d.id) {
        <div class="bg-white rounded-xl border border-gray-200 hover:shadow-md transition-shadow"
             [class.border-red-200]="d.statut === 'EN_COURS' && gravite(d.typeSanction) >= 3">
          <div class="p-4">
            <div class="flex items-start justify-between gap-4 flex-wrap">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-semibold text-gray-900">{{ d.collaborateurNom }}</span>
                  <span [class]="'px-2 py-0.5 rounded-full text-xs font-bold ' + sanctionCss(d.typeSanction)">
                    {{ sanctionLabel(d.typeSanction) }}
                  </span>
                  <span [class]="'px-2 py-0.5 rounded-full text-xs font-medium ' + statutCss(d.statut)">
                    {{ statutLabel(d.statut) }}
                  </span>
                  @if (d.typeSanction === 'MISE_A_PIED' && d.dureeJours) {
                    <span class="text-xs text-red-600 font-medium">{{ d.dureeJours }} jour(s)</span>
                  }
                </div>
                <p class="text-sm text-gray-700 mt-1 font-medium">{{ d.motif }}</p>
                @if (d.description) {
                  <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ d.description }}</p>
                }
              </div>
              <div class="text-xs text-gray-400 shrink-0 text-right space-y-0.5">
                <div>Faits : {{ formatDate(d.dateFaits) }}</div>
                @if (d.dateConvocation) { <div>Convocation : {{ formatDate(d.dateConvocation) }}</div> }
                @if (d.dateEntretien)   { <div>Entretien : {{ formatDate(d.dateEntretien) }}</div> }
                @if (d.dateNotification){ <div>Notification : {{ formatDate(d.dateNotification) }}</div> }
              </div>
            </div>

            <!-- Timeline étapes -->
            @if (d.etapes.length > 0) {
              <div class="mt-3 flex items-center gap-2 flex-wrap">
                @for (e of d.etapes; track e.id) {
                  <div class="flex items-center gap-1 text-xs text-gray-500">
                    <span>{{ etapeIcon(e.typeEtape) }}</span>
                    <span>{{ etapeLabel(e.typeEtape) }}</span>
                    <span class="text-gray-300">{{ formatDate(e.dateEtape) }}</span>
                    @if (!$last) { <span class="text-gray-200 mx-1">→</span> }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3 px-4 py-2.5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
            <button (click)="ouvrirDetail(d)"
                    class="text-xs text-blue-600 hover:underline">Détail / Étapes</button>
            @if (d.statut === 'EN_COURS') {
              <button (click)="ouvrirModifier(d)"
                      class="text-xs text-gray-500 hover:underline">Modifier</button>
              <button (click)="cloturer(d.id)"
                      class="text-xs text-green-600 hover:underline">Clôturer</button>
            }
            <button (click)="supprimer(d.id)"
                    class="text-xs text-red-400 hover:underline ml-auto">Supprimer</button>
          </div>
        </div>
      }
    </div>
  }

  <!-- ── Historique par collaborateur ────────────────────────────────────── -->
  @if (tab === 'historique') {
    @if (historique.length === 0) {
      <p class="text-center text-gray-400 py-12">Aucun historique disponible.</p>
    }
    <div class="space-y-3">
      @for (h of historique; track h.collaborateurId) {
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <span class="font-semibold text-gray-900">{{ h.collaborateurNom }}</span>
              <span class="ml-2 text-xs text-gray-400">{{ h.nbDossiers }} dossier(s)</span>
            </div>
            @if (h.nbEnCours > 0) {
              <span class="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {{ h.nbEnCours }} en cours
              </span>
            } @else {
              <span class="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs">Aucun actif</span>
            }
          </div>
          <div class="flex flex-wrap gap-2">
            @for (r of h.dossiers; track r.id) {
              <div [class]="'flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs ' + sanctionCssLight(r.typeSanction)">
                <span [class]="'w-1.5 h-1.5 rounded-full ' + gravitePoint(r.typeSanction)"></span>
                <span class="font-medium">{{ sanctionLabel(r.typeSanction) }}</span>
                <span class="text-gray-400">{{ formatDate(r.dateFaits) }}</span>
                <span [class]="'ml-1 px-1.5 rounded-full ' + statutCss(r.statut)">{{ statutLabel(r.statut) }}</span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  }

</div>

<!-- ── Modal créer/modifier dossier ─────────────────────────────────────── -->
@if (modalDossier) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
      <h2 class="text-lg font-bold text-gray-900">{{ editId ? 'Modifier le dossier' : 'Nouveau dossier disciplinaire' }}</h2>

      @if (!editId) {
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Collaborateur (UUID)</label>
          <input [(ngModel)]="form.collaborateurId" class="input-field" placeholder="UUID du collaborateur">
        </div>
      }

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Type de sanction</label>
          <select [(ngModel)]="editId ? updateForm.typeSanction : form.typeSanction" class="input-field">
            @for (s of sanctions; track s.val) { <option [value]="s.val">{{ s.label }}</option> }
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Date des faits</label>
          <input [(ngModel)]="editId ? updateForm.dateFaits : form.dateFaits" type="date" class="input-field">
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Motif</label>
        <input [(ngModel)]="editId ? updateForm.motif : form.motif" class="input-field"
               placeholder="Ex: Absence injustifiée répétée">
      </div>

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Description détaillée</label>
        <textarea [(ngModel)]="editId ? updateForm.description : form.description" rows="3"
                  class="input-field resize-none" placeholder="Contexte, faits précis..."></textarea>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Date de convocation</label>
          <input [(ngModel)]="editId ? updateForm.dateConvocation : form.dateConvocation" type="date" class="input-field">
        </div>
        @if ((editId ? updateForm.typeSanction : form.typeSanction) === 'MISE_A_PIED') {
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Durée (jours)</label>
            <input [(ngModel)]="editId ? updateForm.dureeJours : form.dureeJours" type="number" min="1" class="input-field">
          </div>
        }
      </div>

      @if (editId) {
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date entretien</label>
            <input [(ngModel)]="updateForm.dateEntretien" type="date" class="input-field">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date notification</label>
            <input [(ngModel)]="updateForm.dateNotification" type="date" class="input-field">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Statut</label>
          <select [(ngModel)]="updateForm.statut" class="input-field">
            @for (s of statuts; track s.val) { <option [value]="s.val">{{ s.label }}</option> }
          </select>
        </div>
      }

      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Notes internes</label>
        <textarea [(ngModel)]="editId ? updateForm.notes : form.notes" rows="2"
                  class="input-field resize-none" placeholder="Observations confidentielles..."></textarea>
      </div>

      @if (erreur) { <p class="text-red-500 text-sm">{{ erreur }}</p> }

      <div class="flex justify-end gap-2 pt-2">
        <button (click)="fermerModals()" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Annuler</button>
        <button (click)="sauvegarder()" [disabled]="loading"
                class="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50">
          {{ loading ? '...' : 'Enregistrer' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ── Modal détail / étapes ─────────────────────────────────────────────── -->
@if (modalDetail && dossierActif) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-gray-900">{{ dossierActif.collaborateurNom }}</h2>
          <div class="flex items-center gap-2 mt-1">
            <span [class]="'px-2 py-0.5 rounded-full text-xs font-bold ' + sanctionCss(dossierActif.typeSanction)">
              {{ sanctionLabel(dossierActif.typeSanction) }}
            </span>
            <span [class]="'px-2 py-0.5 rounded-full text-xs font-medium ' + statutCss(dossierActif.statut)">
              {{ statutLabel(dossierActif.statut) }}
            </span>
          </div>
        </div>
        <button (click)="fermerModals()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      <!-- Détail dossier -->
      <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div><span class="text-gray-500 w-32 inline-block">Motif :</span><span class="font-medium">{{ dossierActif.motif }}</span></div>
        @if (dossierActif.description) {
          <div><span class="text-gray-500 w-32 inline-block">Description :</span><span>{{ dossierActif.description }}</span></div>
        }
        <div><span class="text-gray-500 w-32 inline-block">Date des faits :</span><span>{{ formatDate(dossierActif.dateFaits) }}</span></div>
        @if (dossierActif.dureeJours) {
          <div><span class="text-gray-500 w-32 inline-block">Durée sanction :</span><span class="text-red-600 font-medium">{{ dossierActif.dureeJours }} jour(s)</span></div>
        }
        @if (dossierActif.notes) {
          <div><span class="text-gray-500 w-32 inline-block">Notes :</span><span class="italic">{{ dossierActif.notes }}</span></div>
        }
      </div>

      <!-- Timeline procédure -->
      <div>
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Procédure disciplinaire</h3>
        <div class="relative">
          <div class="absolute left-4 top-0 bottom-0 w-px bg-gray-200"></div>
          <div class="space-y-3 pl-10">
            @for (e of dossierActif.etapes; track e.id) {
              <div class="relative">
                <div class="absolute -left-6 top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-sm flex items-center justify-center text-xs">
                </div>
                <div class="bg-white border border-gray-200 rounded-lg p-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-gray-800">{{ etapeIcon(e.typeEtape) }} {{ etapeLabel(e.typeEtape) }}</span>
                    <span class="text-xs text-gray-400">{{ formatDate(e.dateEtape) }}</span>
                  </div>
                  @if (e.description) {
                    <p class="text-xs text-gray-500 mt-1">{{ e.description }}</p>
                  }
                </div>
              </div>
            }
            @if (dossierActif.etapes.length === 0) {
              <p class="text-sm text-gray-400">Aucune étape enregistrée.</p>
            }
          </div>
        </div>
      </div>

      <!-- Ajouter une étape -->
      @if (dossierActif.statut === 'EN_COURS') {
        <div class="border-t border-gray-100 pt-4">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">Ajouter une étape</h3>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Type d'étape</label>
              <select [(ngModel)]="etapeForm.typeEtape" class="input-field">
                @for (e of etapes; track e.val) { <option [value]="e.val">{{ e.icon }} {{ e.label }}</option> }
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Date</label>
              <input [(ngModel)]="etapeForm.dateEtape" type="date" class="input-field">
            </div>
          </div>
          <div class="mt-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <input [(ngModel)]="etapeForm.description" class="input-field" placeholder="Précisions...">
          </div>
          <button (click)="ajouterEtape()" [disabled]="!etapeForm.typeEtape || !etapeForm.dateEtape"
                  class="mt-3 w-full py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50">
            Enregistrer l'étape
          </button>
        </div>
      }
    </div>
  </div>
}
`,
  styles: [`
    .input-field { @apply w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400; }
    .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  `]
})
export class DisciplineComponent implements OnInit {
  private svc = inject(DisciplineService);
  private cdr = inject(ChangeDetectorRef);

  tab: 'dossiers' | 'historique' = 'dossiers';
  sanctions = SANCTIONS;
  statuts = STATUTS;
  etapes = ETAPES;

  dossiers: DossierResponse[] = [];
  historique: HistoriqueCollaborateur[] = [];
  dossierActif: DossierResponse | null = null;
  filtreStatut: StatutDossier | null = null;

  modalDossier = false;
  modalDetail = false;
  editId: string | null = null;
  loading = false;
  erreur = '';

  form: DossierSaveRequest = this.emptyForm();
  updateForm: DossierUpdateRequest = {};
  etapeForm: EtapeSaveRequest = { typeEtape: 'CONVOCATION', dateEtape: '', description: null };

  get dossiersFiltres() {
    return this.filtreStatut ? this.dossiers.filter(d => d.statut === this.filtreStatut) : this.dossiers;
  }

  get enCoursCount() { return this.dossiers.filter(d => d.statut === 'EN_COURS').length; }

  ngOnInit() { this.charger(); }

  charger() {
    this.svc.findAll().subscribe({ next: d => { this.dossiers = d; this.cdr.markForCheck(); } });
  }

  chargerHistorique() {
    this.svc.historique().subscribe({ next: h => { this.historique = h; this.cdr.markForCheck(); } });
  }

  countByType(t: TypeSanction) { return this.dossiers.filter(d => d.typeSanction === t).length; }
  countByStatut(s: StatutDossier) { return this.dossiers.filter(d => d.statut === s).length; }

  ouvrirCreer() {
    this.editId = null;
    this.form = this.emptyForm();
    this.erreur = '';
    this.modalDossier = true;
  }

  ouvrirModifier(d: DossierResponse) {
    this.editId = d.id;
    this.updateForm = {
      typeSanction: d.typeSanction, motif: d.motif, description: d.description,
      dateFaits: d.dateFaits, dateConvocation: d.dateConvocation,
      dateEntretien: d.dateEntretien, dateNotification: d.dateNotification,
      dureeJours: d.dureeJours, statut: d.statut, notes: d.notes
    };
    this.erreur = '';
    this.modalDossier = true;
  }

  ouvrirDetail(d: DossierResponse) {
    this.dossierActif = d;
    this.etapeForm = { typeEtape: 'CONVOCATION', dateEtape: '', description: null };
    this.modalDetail = true;
  }

  sauvegarder() {
    this.loading = true; this.erreur = '';
    const obs = this.editId
      ? this.svc.update(this.editId, this.updateForm)
      : this.svc.create(this.form);
    obs.subscribe({
      next: () => { this.fermerModals(); this.charger(); },
      error: e => { this.erreur = e.error?.message || 'Erreur'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  cloturer(id: string) {
    if (!confirm('Clôturer ce dossier disciplinaire ?')) return;
    this.svc.cloture(id).subscribe({ next: () => this.charger() });
  }

  supprimer(id: string) {
    if (!confirm('Supprimer définitivement ce dossier ?')) return;
    this.svc.delete(id).subscribe({ next: () => this.charger() });
  }

  ajouterEtape() {
    if (!this.dossierActif || !this.etapeForm.typeEtape || !this.etapeForm.dateEtape) return;
    this.svc.addEtape(this.dossierActif.id, this.etapeForm).subscribe({
      next: e => {
        this.dossierActif!.etapes.push(e);
        this.etapeForm = { typeEtape: 'CONVOCATION', dateEtape: '', description: null };
        this.charger();
        this.cdr.markForCheck();
      }
    });
  }

  fermerModals() { this.modalDossier = false; this.modalDetail = false; this.loading = false; this.cdr.markForCheck(); }

  formatDate(d: string | null) { return d ? new Date(d).toLocaleDateString('fr-FR') : '—'; }

  gravite(t: TypeSanction) { return SANCTIONS.find(s => s.val === t)?.gravite ?? 0; }
  sanctionLabel(t: TypeSanction) { return SANCTIONS.find(s => s.val === t)?.label ?? t; }
  sanctionCss(t: TypeSanction) { return SANCTIONS.find(s => s.val === t)?.css ?? ''; }
  sanctionCssLight(t: TypeSanction) {
    const map: Record<TypeSanction, string> = {
      AVERTISSEMENT: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      BLAME:         'border-orange-200 bg-orange-50 text-orange-800',
      MISE_A_PIED:   'border-red-200 bg-red-50 text-red-800',
      LICENCIEMENT:  'border-red-300 bg-red-100 text-red-900',
    };
    return map[t] ?? '';
  }
  gravitePoint(t: TypeSanction) {
    const map: Record<TypeSanction, string> = {
      AVERTISSEMENT: 'bg-yellow-400',
      BLAME:         'bg-orange-400',
      MISE_A_PIED:   'bg-red-500',
      LICENCIEMENT:  'bg-red-700',
    };
    return map[t] ?? 'bg-gray-400';
  }
  statutLabel(s: StatutDossier) { return STATUTS.find(x => x.val === s)?.label ?? s; }
  statutCss(s: StatutDossier) { return STATUTS.find(x => x.val === s)?.css ?? ''; }
  etapeLabel(t: TypeEtape) { return ETAPES.find(e => e.val === t)?.label ?? t; }
  etapeIcon(t: TypeEtape) { return ETAPES.find(e => e.val === t)?.icon ?? ''; }

  tabClass(t: string) {
    const base = 'px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ';
    return this.tab === t
      ? base + 'text-red-600 border-b-2 border-red-600 bg-red-50'
      : base + 'text-gray-500 hover:text-gray-700';
  }

  private emptyForm(): DossierSaveRequest {
    return {
      collaborateurId: '', typeSanction: 'AVERTISSEMENT', motif: '',
      description: null, dateFaits: '', dateConvocation: null,
      dureeJours: null, notes: null
    };
  }
}
