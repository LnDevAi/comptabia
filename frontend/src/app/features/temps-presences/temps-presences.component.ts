import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TempsPresenceService } from '../../core/services/temps-presence.service';
import {
  PointageResponse, AbsenceResponse, EtatMensuel,
  PointageType, AbsenceType, AbsenceStatut,
  ABSENCE_TYPE_LABELS, MOIS_LABELS
} from '../../core/models/temps-presence.model';

type Tab = 'pointages' | 'absences' | 'etat';

const TYPE_CLASSES: Record<PointageType, string> = {
  NORMAL:       'bg-green-100 text-green-700',
  RETARD:       'bg-red-100 text-red-700',
  DEMI_JOURNEE: 'bg-amber-100 text-amber-700',
};
const STATUT_ABS_CLASSES: Record<AbsenceStatut, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  APPROUVEE:  'bg-green-100 text-green-700',
  REJETEE:    'bg-red-100 text-red-700',
};

@Component({
  selector: 'app-temps-presences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Temps & Présences</h1>
      <p class="text-xs text-gray-400 mt-0.5">Pointages journaliers · Absences · État mensuel</p>
    </div>
    <div class="flex items-center gap-2">
      <select [(ngModel)]="filterMois" (ngModelChange)="onPeriodeChange()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (m of moisOptions; track m.val) {
          <option [value]="m.val">{{ m.label }}</option>
        }
      </select>
      <select [(ngModel)]="filterAnnee" (ngModelChange)="onPeriodeChange()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (a of anneeOptions; track a) {
          <option [value]="a">{{ a }}</option>
        }
      </select>
    </div>
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 border-b border-gray-200">
    @for (t of tabs; track t.key) {
      <button (click)="activeTab.set(t.key)"
              class="px-4 py-2 text-sm font-medium border-b-2 transition"
              [class]="activeTab() === t.key
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'">
        {{ t.label }}
        @if (t.key === 'pointages') { <span class="ml-1.5 text-xs text-gray-400">({{ pointages().length }})</span> }
        @if (t.key === 'absences')  { <span class="ml-1.5 text-xs text-gray-400">({{ absences().length }})</span> }
      </button>
    }
  </div>

  <!-- ── TAB POINTAGES ── -->
  @if (activeTab() === 'pointages') {
    <div class="space-y-4">
      <div class="flex justify-end">
        <button (click)="showPointageModal.set(true)"
                class="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Saisir un pointage
        </button>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
      } @else if (pointages().length === 0) {
        <div class="flex items-center justify-center h-32 text-gray-400 text-sm">
          Aucun pointage pour cette période
        </div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-2.5 text-left">Collaborateur</th>
                <th class="px-4 py-2.5 text-left">Date</th>
                <th class="px-4 py-2.5 text-center">Arrivée</th>
                <th class="px-4 py-2.5 text-center">Départ</th>
                <th class="px-4 py-2.5 text-center">Heures</th>
                <th class="px-4 py-2.5 text-center">Type</th>
                <th class="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (p of pointages(); track p.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ p.collaborateurNom }}</td>
                  <td class="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                    {{ p.datePointage | date:'EEE dd/MM/yyyy':'':'fr' }}
                  </td>
                  <td class="px-4 py-3 text-center font-mono text-xs text-gray-700">{{ p.heureArrivee }}</td>
                  <td class="px-4 py-3 text-center font-mono text-xs">
                    @if (p.heureDepart) {
                      <span class="text-gray-700">{{ p.heureDepart }}</span>
                    } @else {
                      <button (click)="openDepartModal(p)"
                              class="text-xs text-blue-600 hover:underline">Saisir départ</button>
                    }
                  </td>
                  <td class="px-4 py-3 text-center font-mono text-xs">
                    @if (p.heuresTravaillees != null) {
                      <span class="text-gray-700">{{ p.heuresTravaillees | number:'1.1-1' }}h</span>
                    } @else {
                      <span class="text-gray-300">—</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="typeClass(p.type)">
                      {{ p.type === 'NORMAL' ? 'Normal' : p.type === 'RETARD' ? 'Retard' : 'Demi-journée' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <button (click)="deletePointage(p.id)"
                            class="text-xs text-red-400 hover:text-red-600">Suppr.</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  }

  <!-- ── TAB ABSENCES ── -->
  @if (activeTab() === 'absences') {
    <div class="space-y-4">
      <div class="flex justify-end">
        <button (click)="showAbsenceModal.set(true)"
                class="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          + Déclarer une absence
        </button>
      </div>

      @if (absences().length === 0) {
        <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Aucune absence enregistrée</div>
      } @else {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-2.5 text-left">Collaborateur</th>
                <th class="px-4 py-2.5 text-left">Type</th>
                <th class="px-4 py-2.5 text-right">Début</th>
                <th class="px-4 py-2.5 text-right">Fin</th>
                <th class="px-4 py-2.5 text-center">Justificatif</th>
                <th class="px-4 py-2.5 text-center">Statut</th>
                <th class="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (a of absences(); track a.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ a.collaborateurNom }}</td>
                  <td class="px-4 py-3 text-gray-600 text-xs">{{ absTypeLabel(a.typeAbsence) }}</td>
                  <td class="px-4 py-3 text-right text-xs text-gray-600 whitespace-nowrap">
                    {{ a.dateDebut | date:'dd/MM/yyyy' }}
                  </td>
                  <td class="px-4 py-3 text-right text-xs text-gray-600 whitespace-nowrap">
                    {{ a.dateFin | date:'dd/MM/yyyy' }}
                  </td>
                  <td class="px-4 py-3 text-center text-xs">
                    @if (a.justificatif) { <span class="text-green-600">✓ Oui</span> }
                    @else { <span class="text-gray-400">Non</span> }
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                          [class]="statutAbsClass(a.statut)">
                      {{ a.statut === 'EN_ATTENTE' ? 'En attente' : a.statut === 'APPROUVEE' ? 'Approuvée' : 'Rejetée' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <div class="flex items-center justify-end gap-1">
                      @if (a.statut === 'EN_ATTENTE') {
                        <button (click)="approuver(a.id)" class="text-xs text-green-600 hover:underline">Approuver</button>
                        <span class="text-gray-300">|</span>
                        <button (click)="rejeter(a.id)"   class="text-xs text-red-500 hover:underline">Rejeter</button>
                        <span class="text-gray-300">|</span>
                      }
                      <button (click)="deleteAbsence(a.id)" class="text-xs text-red-400 hover:text-red-600">Suppr.</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  }

  <!-- ── TAB ÉTAT MENSUEL ── -->
  @if (activeTab() === 'etat') {
    @if (etatLoading()) {
      <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
    } @else if (!etat()) {
      <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Aucune donnée</div>
    } @else if (etat()!.collaborateurs.length === 0) {
      <div class="flex items-center justify-center h-32 text-gray-400 text-sm">
        Aucun pointage ni absence pour {{ moisLabel(etat()!.mois) }} {{ etat()!.annee }}
      </div>
    } @else {
      <div class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-700">
          État mensuel — {{ moisLabel(etat()!.mois) }} {{ etat()!.annee }}
        </h3>
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-2.5 text-left">Collaborateur</th>
                <th class="px-4 py-2.5 text-right">Jours travaillés</th>
                <th class="px-4 py-2.5 text-right">Total heures</th>
                <th class="px-4 py-2.5 text-center">Retards</th>
                <th class="px-4 py-2.5 text-center">Absences</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (c of etat()!.collaborateurs; track c.collaborateurId) {
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ c.collaborateurNom }}</td>
                  <td class="px-4 py-3 text-right font-mono text-sm font-semibold text-gray-800">
                    {{ c.nbJoursTravailles }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono text-sm text-gray-700">
                    {{ c.totalHeures | number:'1.1-1' }}h
                  </td>
                  <td class="px-4 py-3 text-center">
                    @if (c.nbRetards > 0) {
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        {{ c.nbRetards }}
                      </span>
                    } @else {
                      <span class="text-green-500 text-xs">0</span>
                    }
                  </td>
                  <td class="px-4 py-3 text-center">
                    @if (c.nbAbsences > 0) {
                      <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                        {{ c.nbAbsences }}
                      </span>
                    } @else {
                      <span class="text-gray-400 text-xs">0</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    }
  }

</div>

<!-- ── MODAL POINTAGE ── -->
@if (showPointageModal()) {
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
      <div class="bg-blue-700 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <span class="font-semibold text-sm">Saisir un pointage</span>
        <button (click)="showPointageModal.set(false)" class="text-blue-200 hover:text-white text-xs">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Collaborateur *</label>
          <select [(ngModel)]="ptgForm.collaborateurId"
                  class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Sélectionner —</option>
            @for (u of collaborateurs(); track u.id) {
              <option [value]="u.id">{{ u.nom }}</option>
            }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date *</label>
            <input type="date" [(ngModel)]="ptgForm.datePointage"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Heure arrivée *</label>
            <input type="time" [(ngModel)]="ptgForm.heureArrivee"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Heure départ <span class="text-gray-400">(optionnel)</span></label>
          <input type="time" [(ngModel)]="ptgForm.heureDepart"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <input type="text" [(ngModel)]="ptgForm.notes" placeholder="Optionnel"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        @if (formError()) { <p class="text-red-600 text-sm">{{ formError() }}</p> }
        <div class="flex gap-3 justify-end">
          <button (click)="showPointageModal.set(false)"
                  class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg">Annuler</button>
          <button (click)="savePointage()" [disabled]="saving()"
                  class="px-6 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ saving() ? '…' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}

<!-- ── MODAL SAISIE DÉPART ── -->
@if (showDepartModal()) {
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-sm">
      <div class="bg-gray-700 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <span class="font-semibold text-sm">Saisir l'heure de départ</span>
        <button (click)="showDepartModal.set(false)" class="text-gray-300 hover:text-white text-xs">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <p class="text-sm text-gray-600">{{ editingPointage()?.collaborateurNom }} —
          {{ editingPointage()?.datePointage | date:'dd/MM/yyyy' }}</p>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Heure de départ *</label>
          <input type="time" [(ngModel)]="departTime"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div class="flex gap-3 justify-end">
          <button (click)="showDepartModal.set(false)"
                  class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg">Annuler</button>
          <button (click)="saveDepart()" [disabled]="saving()"
                  class="px-6 py-1.5 bg-gray-700 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50">
            {{ saving() ? '…' : 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}

<!-- ── MODAL ABSENCE ── -->
@if (showAbsenceModal()) {
  <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md">
      <div class="bg-amber-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
        <span class="font-semibold text-sm">Déclarer une absence</span>
        <button (click)="showAbsenceModal.set(false)" class="text-amber-100 hover:text-white text-xs">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Collaborateur *</label>
          <select [(ngModel)]="absForm.collaborateurId"
                  class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="">— Sélectionner —</option>
            @for (u of collaborateurs(); track u.id) {
              <option [value]="u.id">{{ u.nom }}</option>
            }
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date début *</label>
            <input type="date" [(ngModel)]="absForm.dateDebut"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date fin *</label>
            <input type="date" [(ngModel)]="absForm.dateFin"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Type d'absence *</label>
          <select [(ngModel)]="absForm.typeAbsence"
                  class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
            <option value="MALADIE">Maladie</option>
            <option value="ACCIDENT_TRAVAIL">Accident de travail</option>
            <option value="SANS_SOLDE">Sans solde</option>
            <option value="AUTRE">Autre</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <input type="checkbox" id="justificatif" [(ngModel)]="absForm.justificatif"
                 class="rounded border-gray-300">
          <label for="justificatif" class="text-sm text-gray-700">Justificatif fourni</label>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <input type="text" [(ngModel)]="absForm.notes" placeholder="Optionnel"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400">
        </div>
        @if (formError()) { <p class="text-red-600 text-sm">{{ formError() }}</p> }
        <div class="flex gap-3 justify-end">
          <button (click)="showAbsenceModal.set(false)"
                  class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg">Annuler</button>
          <button (click)="saveAbsence()" [disabled]="saving()"
                  class="px-6 py-1.5 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50">
            {{ saving() ? '…' : 'Enregistrer' }}
          </button>
        </div>
      </div>
    </div>
  </div>
}
  `
})
export class TempsPresencesComponent implements OnInit {

  private svc = inject(TempsPresenceService);
  private cdr = inject(ChangeDetectorRef);

  tabs = [
    { key: 'pointages' as Tab, label: 'Pointages' },
    { key: 'absences'  as Tab, label: 'Absences' },
    { key: 'etat'      as Tab, label: 'État mensuel' },
  ];
  activeTab = signal<Tab>('pointages');

  loading     = signal(false);
  saving      = signal(false);
  etatLoading = signal(false);
  formError   = signal<string | null>(null);

  pointages = signal<PointageResponse[]>([]);
  absences  = signal<AbsenceResponse[]>([]);
  etat      = signal<EtatMensuel | null>(null);

  collaborateurs = signal<{ id: string; nom: string }[]>([]);

  filterMois  = new Date().getMonth() + 1;
  filterAnnee = new Date().getFullYear();

  showPointageModal = signal(false);
  showDepartModal   = signal(false);
  showAbsenceModal  = signal(false);
  editingPointage   = signal<PointageResponse | null>(null);
  departTime        = '';

  ptgForm = this.emptyPtgForm();
  absForm = this.emptyAbsForm();

  moisOptions = Array.from({ length: 12 }, (_, i) => ({ val: i + 1, label: MOIS_LABELS[i + 1] }));
  anneeOptions = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

  ngOnInit() {
    this.loadPointages();
    this.loadAbsences();
    this.loadEtat();
    this.loadCollaborateurs();
  }

  onPeriodeChange() {
    this.loadPointages();
    this.loadEtat();
  }

  private loadPointages() {
    this.loading.set(true);
    this.svc.findPointages(this.filterMois, this.filterAnnee).subscribe({
      next: d => { this.pointages.set(d); this.loading.set(false); this.cdr.markForCheck(); },
      error: () => this.loading.set(false)
    });
  }

  private loadAbsences() {
    this.svc.findAbsences().subscribe({ next: d => { this.absences.set(d); this.cdr.markForCheck(); } });
  }

  private loadEtat() {
    this.etatLoading.set(true);
    this.svc.etatMensuel(this.filterMois, this.filterAnnee).subscribe({
      next: d => { this.etat.set(d); this.etatLoading.set(false); this.cdr.markForCheck(); },
      error: () => this.etatLoading.set(false)
    });
  }

  private loadCollaborateurs() {
    // Utilise les pointages existants comme source de collaborateurs connus
    // En production, appeler un endpoint /api/utilisateurs
    this.svc.findPointages(this.filterMois, this.filterAnnee).subscribe({
      next: pts => {
        const map = new Map<string, string>();
        pts.forEach(p => map.set(p.collaborateurId, p.collaborateurNom));
        this.collaborateurs.set([...map.entries()].map(([id, nom]) => ({ id, nom })));
      }
    });
  }

  openDepartModal(p: PointageResponse) {
    this.editingPointage.set(p);
    this.departTime = '';
    this.showDepartModal.set(true);
  }

  savePointage() {
    if (!this.ptgForm.collaborateurId) { this.formError.set('Sélectionnez un collaborateur.'); return; }
    if (!this.ptgForm.datePointage)    { this.formError.set('La date est obligatoire.'); return; }
    if (!this.ptgForm.heureArrivee)    { this.formError.set("L'heure d'arrivée est obligatoire."); return; }
    this.saving.set(true);
    this.formError.set(null);
    this.svc.createPointage({
      ...this.ptgForm,
      heureDepart: this.ptgForm.heureDepart || null
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.showPointageModal.set(false);
        this.ptgForm = this.emptyPtgForm();
        this.loadPointages(); this.loadEtat();
      },
      error: (e: any) => { this.formError.set(e?.error?.message ?? 'Erreur'); this.saving.set(false); }
    });
  }

  saveDepart() {
    if (!this.departTime) { return; }
    this.saving.set(true);
    this.svc.patchPointage(this.editingPointage()!.id, this.departTime).subscribe({
      next: () => {
        this.saving.set(false);
        this.showDepartModal.set(false);
        this.loadPointages(); this.loadEtat();
      },
      error: () => this.saving.set(false)
    });
  }

  saveAbsence() {
    if (!this.absForm.collaborateurId) { this.formError.set('Sélectionnez un collaborateur.'); return; }
    if (!this.absForm.dateDebut || !this.absForm.dateFin) { this.formError.set('Les dates sont obligatoires.'); return; }
    this.saving.set(true);
    this.formError.set(null);
    this.svc.createAbsence(this.absForm).subscribe({
      next: () => {
        this.saving.set(false);
        this.showAbsenceModal.set(false);
        this.absForm = this.emptyAbsForm();
        this.loadAbsences();
      },
      error: (e: any) => { this.formError.set(e?.error?.message ?? 'Erreur'); this.saving.set(false); }
    });
  }

  deletePointage(id: string) {
    if (!confirm('Supprimer ce pointage ?')) return;
    this.svc.deletePointage(id).subscribe({ next: () => { this.loadPointages(); this.loadEtat(); } });
  }

  approuver(id: string) {
    this.svc.approuver(id).subscribe({ next: () => this.loadAbsences() });
  }

  rejeter(id: string) {
    this.svc.rejeter(id).subscribe({ next: () => this.loadAbsences() });
  }

  deleteAbsence(id: string) {
    if (!confirm('Supprimer cette absence ?')) return;
    this.svc.deleteAbsence(id).subscribe({ next: () => this.loadAbsences() });
  }

  typeClass(t: PointageType):      string { return TYPE_CLASSES[t] ?? 'bg-gray-100 text-gray-600'; }
  statutAbsClass(s: AbsenceStatut): string { return STATUT_ABS_CLASSES[s] ?? 'bg-gray-100 text-gray-600'; }
  absTypeLabel(t: AbsenceType):    string { return ABSENCE_TYPE_LABELS[t] ?? t; }
  moisLabel(m: number):            string { return MOIS_LABELS[m] ?? ''; }

  private emptyPtgForm() {
    return {
      collaborateurId: '',
      datePointage:    new Date().toISOString().substring(0, 10),
      heureArrivee:    '08:00',
      heureDepart:     '',
      notes:           ''
    };
  }

  private emptyAbsForm() {
    return {
      collaborateurId: '',
      dateDebut:       new Date().toISOString().substring(0, 10),
      dateFin:         new Date().toISOString().substring(0, 10),
      typeAbsence:     'MALADIE' as AbsenceType,
      justificatif:    false,
      notes:           ''
    };
  }
}
