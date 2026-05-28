import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CongeService } from '../../core/services/conge.service';
import { AuthService } from '../../core/services/auth.service';
import {
  CongeResponse, CongeCalendrierItem,
  TypeConge, StatutConge, CongeSaveRequest
} from '../../core/models/conge.model';

const TYPE_INFO: Record<TypeConge, { label: string; color: string }> = {
  ANNUEL:       { label: 'Congé annuel',      color: 'bg-blue-100 text-blue-700' },
  MALADIE:      { label: 'Maladie',           color: 'bg-red-100 text-red-700' },
  SANS_SOLDE:   { label: 'Sans solde',        color: 'bg-gray-100 text-gray-700' },
  EXCEPTIONNEL: { label: 'Exceptionnel',      color: 'bg-purple-100 text-purple-700' },
  MATERNITE:    { label: 'Maternité',         color: 'bg-pink-100 text-pink-700' },
  PATERNITE:    { label: 'Paternité',         color: 'bg-indigo-100 text-indigo-700' },
};

const CAL_COLORS: string[] = [
  'bg-blue-200 text-blue-800',
  'bg-green-200 text-green-800',
  'bg-purple-200 text-purple-800',
  'bg-orange-200 text-orange-800',
  'bg-pink-200 text-pink-800',
  'bg-indigo-200 text-indigo-800',
  'bg-teal-200 text-teal-800',
  'bg-yellow-200 text-yellow-800',
];

interface CalDay {
  date: Date | null;
  items: (CongeCalendrierItem & { colorClass: string })[];
}

@Component({
  selector: 'app-conges',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Congés & absences</h1>
      <p class="text-sm text-gray-500 mt-0.5">Gestion des demandes de congé et suivi du calendrier d'absences</p>
    </div>
    <button (click)="openForm(null)"
            class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
      + Nouvelle demande
    </button>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1">
      <button (click)="tab = 'mes'" [class]="tabClass('mes')">
        Mes congés
        <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs"
              [ngClass]="tab === 'mes' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'">
          {{ mesConges.length }}
        </span>
      </button>
      @if (isAdmin) {
        <button (click)="tab = 'valider'; chargerSoumises()" [class]="tabClass('valider')">
          À valider
          @if (soumises.length > 0) {
            <span class="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">
              {{ soumises.length }}
            </span>
          }
        </button>
      }
      <button (click)="tab = 'calendrier'; chargerCalendrier()" [class]="tabClass('calendrier')">
        Calendrier
      </button>
    </nav>
  </div>

  <!-- Tab: Mes congés -->
  @if (tab === 'mes') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      @if (loading) {
        <div class="p-8 text-center text-gray-400 text-sm">Chargement…</div>
      } @else if (mesConges.length === 0) {
        <div class="p-8 text-center text-gray-400 text-sm">Aucune demande de congé</div>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-4 py-3 text-left">Type</th>
              <th class="px-4 py-3 text-left">Période</th>
              <th class="px-4 py-3 text-center">Jours ouvrés</th>
              <th class="px-4 py-3 text-left">Motif</th>
              <th class="px-4 py-3 text-center">Statut</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (c of mesConges; track c.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold" [ngClass]="typeColor(c.type)">
                    {{ c.typeIntitule }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {{ c.dateDebut | date:'dd/MM/yyyy' }} → {{ c.dateFin | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-4 py-3 text-center font-medium text-gray-800">{{ c.nombreJours }}j</td>
                <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ c.motif || '—' }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [ngClass]="statutClass(c.statut)">
                    {{ c.statut }}
                  </span>
                  @if (c.statut === 'REJETEE' && c.commentaireRejet) {
                    <button (click)="voirRejet(c)" class="ml-1 text-red-500 text-xs underline">voir motif</button>
                  }
                </td>
                <td class="px-4 py-3 text-right space-x-2">
                  @if (c.statut === 'BROUILLON') {
                    <button (click)="openForm(c)" class="text-blue-600 hover:text-blue-800 text-xs font-medium">Modifier</button>
                    <button (click)="soumettre(c)" class="text-green-600 hover:text-green-800 text-xs font-medium">Soumettre</button>
                    <button (click)="supprimer(c)" class="text-red-500 hover:text-red-700 text-xs font-medium">Supprimer</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  }

  <!-- Tab: À valider (ADMIN) -->
  @if (tab === 'valider') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      @if (loadingSoumises) {
        <div class="p-8 text-center text-gray-400 text-sm">Chargement…</div>
      } @else if (soumises.length === 0) {
        <div class="p-8 text-center text-gray-400 text-sm">Aucune demande en attente de validation</div>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th class="px-4 py-3 text-left">Collaborateur</th>
              <th class="px-4 py-3 text-left">Type</th>
              <th class="px-4 py-3 text-left">Période</th>
              <th class="px-4 py-3 text-center">Jours</th>
              <th class="px-4 py-3 text-left">Motif</th>
              <th class="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (c of soumises; track c.id) {
              <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 font-medium text-gray-800">{{ c.collaborateurNom }}</td>
                <td class="px-4 py-3">
                  <span class="px-2 py-0.5 rounded text-xs font-semibold" [ngClass]="typeColor(c.type)">
                    {{ c.typeIntitule }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-700">
                  {{ c.dateDebut | date:'dd/MM/yyyy' }} → {{ c.dateFin | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-4 py-3 text-center font-medium">{{ c.nombreJours }}j</td>
                <td class="px-4 py-3 text-gray-500 max-w-xs truncate">{{ c.motif || '—' }}</td>
                <td class="px-4 py-3 text-right space-x-2">
                  <button (click)="approuver(c)"
                          class="px-2 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-medium">
                    Approuver
                  </button>
                  <button (click)="openRejet(c)"
                          class="px-2 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium">
                    Rejeter
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  }

  <!-- Tab: Calendrier -->
  @if (tab === 'calendrier') {
    <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <!-- Month navigation -->
      <div class="flex items-center justify-between">
        <button (click)="prevMois()" class="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
          ‹
        </button>
        <h2 class="text-base font-semibold text-gray-800">
          {{ MOIS[calMois - 1] }} {{ calAnnee }}
        </h2>
        <button (click)="nextMois()" class="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
          ›
        </button>
      </div>

      @if (loadingCal) {
        <div class="p-8 text-center text-gray-400 text-sm">Chargement…</div>
      } @else {
        <!-- Day headers -->
        <div class="grid grid-cols-7 gap-px text-center text-xs font-medium text-gray-500 mb-1">
          @for (j of JOURS; track j) {
            <div class="py-1">{{ j }}</div>
          }
        </div>
        <!-- Calendar grid -->
        <div class="grid grid-cols-7 gap-px bg-gray-200">
          @for (day of calDays; track day) {
            <div class="bg-white min-h-16 p-1"
                 [ngClass]="day.date ? '' : 'bg-gray-50'">
              @if (day.date) {
                <div class="text-xs font-medium text-gray-500 mb-1">{{ day.date.getDate() }}</div>
                @for (item of day.items; track item.id) {
                  <div class="text-xs px-1 py-0.5 rounded truncate mb-0.5" [ngClass]="item.colorClass"
                       [title]="item.collaborateurNom + ' – ' + item.typeIntitule">
                    {{ item.collaborateurNom.split(' ')[0] }}
                  </div>
                }
              }
            </div>
          }
        </div>

        <!-- Legend -->
        @if (calItems.length > 0) {
          <div class="border-t pt-3">
            <p class="text-xs text-gray-500 mb-2 font-medium">Légende</p>
            <div class="flex flex-wrap gap-2">
              @for (entry of calLegend; track entry.nom) {
                <span class="text-xs px-2 py-0.5 rounded" [ngClass]="entry.colorClass">
                  {{ entry.nom }}
                </span>
              }
            </div>
          </div>
        }
      }
    </div>
  }

</div>

<!-- Modal: Formulaire demande -->
@if (showForm) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">
        {{ editId ? 'Modifier la demande' : 'Nouvelle demande de congé' }}
      </h2>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Type de congé</label>
          <select [(ngModel)]="form.type" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            @for (t of typeKeys; track t) {
              <option [value]="t">{{ TYPE_INFO[t].label }}</option>
            }
          </select>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date de début</label>
            <input type="date" [(ngModel)]="form.dateDebut"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date de fin</label>
            <input type="date" [(ngModel)]="form.dateFin"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Motif (optionnel)</label>
          <textarea [(ngModel)]="form.motif" rows="2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    placeholder="Raison de la demande…"></textarea>
        </div>
      </div>

      @if (formErr) {
        <p class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ formErr }}</p>
      }

      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closeForm()" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
          Annuler
        </button>
        <button (click)="sauvegarder()"
                class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          {{ saving ? 'Enregistrement…' : (editId ? 'Modifier' : 'Créer') }}
        </button>
      </div>
    </div>
  </div>
}

<!-- Modal: Rejeter -->
@if (showRejet) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Rejeter la demande</h2>
      <p class="text-sm text-gray-600">
        Demande de {{ rejetConge?.collaborateurNom }} ({{ rejetConge?.typeIntitule }})
      </p>
      <div>
        <label class="block text-xs font-medium text-gray-600 mb-1">Motif du rejet <span class="text-red-500">*</span></label>
        <textarea [(ngModel)]="rejetCommentaire" rows="3"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                  placeholder="Expliquer la raison du rejet…"></textarea>
      </div>
      @if (rejetErr) {
        <p class="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ rejetErr }}</p>
      }
      <div class="flex justify-end gap-3">
        <button (click)="closeRejet()" class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
          Annuler
        </button>
        <button (click)="confirmerRejet()"
                class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700">
          Rejeter
        </button>
      </div>
    </div>
  </div>
}

<!-- Modal: Voir motif rejet -->
@if (showMotifRejet) {
  <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h2 class="text-lg font-semibold text-gray-900">Motif du rejet</h2>
      <p class="text-sm text-gray-700 bg-red-50 border border-red-100 rounded-lg p-3">
        {{ motifRejetTexte || 'Aucun motif fourni.' }}
      </p>
      <div class="flex justify-end">
        <button (click)="showMotifRejet = false"
                class="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
          Fermer
        </button>
      </div>
    </div>
  </div>
}
`,
})
export class CongesComponent implements OnInit {
  private svc   = inject(CongeService);
  private auth  = inject(AuthService);
  private cdr   = inject(ChangeDetectorRef);

  readonly TYPE_INFO = TYPE_INFO;
  readonly MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin',
                   'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  readonly JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  typeKeys  = Object.keys(TYPE_INFO) as TypeConge[];

  tab: 'mes' | 'valider' | 'calendrier' = 'mes';

  mesConges: CongeResponse[]      = [];
  soumises:  CongeResponse[]      = [];
  calItems:  CongeCalendrierItem[] = [];
  calDays:   CalDay[]             = [];
  calLegend: { nom: string; colorClass: string }[] = [];

  loading         = false;
  loadingSoumises = false;
  loadingCal      = false;

  calAnnee: number;
  calMois:  number;

  showForm   = false;
  editId:    string | null = null;
  form: CongeSaveRequest = { type: 'ANNUEL', dateDebut: '', dateFin: '', motif: null };
  formErr    = '';
  saving     = false;

  showRejet        = false;
  rejetConge:      CongeResponse | null = null;
  rejetCommentaire = '';
  rejetErr         = '';

  showMotifRejet  = false;
  motifRejetTexte = '';

  get isAdmin()    { return this.auth.user()?.role === 'ADMIN'; }
  get isComptable(){ return this.auth.user()?.role === 'COMPTABLE'; }

  constructor() {
    const now = new Date();
    this.calAnnee = now.getFullYear();
    this.calMois  = now.getMonth() + 1;
  }

  ngOnInit(): void {
    this.chargerMesConges();
  }

  chargerMesConges(): void {
    this.loading = true;
    this.svc.mesConges().subscribe({
      next: d => { this.mesConges = d; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  chargerSoumises(): void {
    this.loadingSoumises = true;
    this.svc.soumises().subscribe({
      next: d => { this.soumises = d; this.loadingSoumises = false; this.cdr.markForCheck(); },
      error: () => { this.loadingSoumises = false; this.cdr.markForCheck(); }
    });
  }

  chargerCalendrier(): void {
    this.loadingCal = true;
    this.svc.calendrier(this.calAnnee, this.calMois).subscribe({
      next: items => {
        this.calItems = items;
        this.buildCalendar(items);
        this.loadingCal = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingCal = false; this.cdr.markForCheck(); }
    });
  }

  prevMois(): void {
    if (this.calMois === 1) { this.calMois = 12; this.calAnnee--; }
    else this.calMois--;
    this.chargerCalendrier();
  }

  nextMois(): void {
    if (this.calMois === 12) { this.calMois = 1; this.calAnnee++; }
    else this.calMois++;
    this.chargerCalendrier();
  }

  private buildCalendar(items: CongeCalendrierItem[]): void {
    // Assign stable colors per collaborateur
    const colorMap = new Map<string, string>();
    let ci = 0;
    for (const item of items) {
      if (!colorMap.has(item.collaborateurNom)) {
        colorMap.set(item.collaborateurNom, CAL_COLORS[ci % CAL_COLORS.length]);
        ci++;
      }
    }

    const firstDay = new Date(this.calAnnee, this.calMois - 1, 1);
    const daysInMonth = new Date(this.calAnnee, this.calMois, 0).getDate();
    // Monday=0 offset
    let startOffset = (firstDay.getDay() + 6) % 7;

    const days: CalDay[] = [];
    for (let i = 0; i < startOffset; i++) days.push({ date: null, items: [] });

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(this.calAnnee, this.calMois - 1, d);
      const dateStr = `${this.calAnnee}-${String(this.calMois).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayItems = items
        .filter(it => it.dateDebut <= dateStr && it.dateFin >= dateStr)
        .map(it => ({ ...it, colorClass: colorMap.get(it.collaborateurNom) ?? CAL_COLORS[0] }));
      days.push({ date, items: dayItems });
    }

    // Fill trailing cells to complete last row
    while (days.length % 7 !== 0) days.push({ date: null, items: [] });

    this.calDays = days;
    this.calLegend = Array.from(colorMap.entries()).map(([nom, colorClass]) => ({ nom, colorClass }));
  }

  tabClass(t: string): string {
    return this.tab === t
      ? 'px-4 py-2.5 text-sm font-medium text-blue-600 border-b-2 border-blue-600'
      : 'px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent';
  }

  typeColor(t: TypeConge): string  { return TYPE_INFO[t]?.color ?? 'bg-gray-100 text-gray-700'; }

  statutClass(s: StatutConge): string {
    return {
      BROUILLON:  'bg-gray-100 text-gray-600',
      SOUMISE:    'bg-orange-100 text-orange-700',
      APPROUVEE:  'bg-green-100 text-green-700',
      REJETEE:    'bg-red-100 text-red-700',
    }[s] ?? 'bg-gray-100 text-gray-600';
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  openForm(c: CongeResponse | null): void {
    this.editId  = c?.id ?? null;
    this.form    = {
      type:      c?.type      ?? 'ANNUEL',
      dateDebut: c?.dateDebut ?? '',
      dateFin:   c?.dateFin   ?? '',
      motif:     c?.motif     ?? null,
    };
    this.formErr  = '';
    this.showForm = true;
  }

  closeForm(): void { this.showForm = false; }

  sauvegarder(): void {
    if (!this.form.dateDebut || !this.form.dateFin) {
      this.formErr = 'Les dates sont obligatoires.'; return;
    }
    if (this.form.dateFin < this.form.dateDebut) {
      this.formErr = 'La date de fin doit être postérieure à la date de début.'; return;
    }
    this.saving = true;
    this.formErr = '';
    const obs = this.editId
      ? this.svc.update(this.editId, this.form)
      : this.svc.create(this.form);
    obs.subscribe({
      next: () => { this.saving = false; this.showForm = false; this.chargerMesConges(); },
      error: (e: any) => {
        this.saving  = false;
        this.formErr = e?.error?.message ?? 'Erreur lors de l\'enregistrement.';
        this.cdr.markForCheck();
      }
    });
  }

  soumettre(c: CongeResponse): void {
    this.svc.soumettre(c.id).subscribe({
      next: () => this.chargerMesConges()
    });
  }

  supprimer(c: CongeResponse): void {
    if (!confirm(`Supprimer cette demande de ${c.typeIntitule} ?`)) return;
    this.svc.delete(c.id).subscribe({ next: () => this.chargerMesConges() });
  }

  // ── Approbation ──────────────────────────────────────────────────────────

  approuver(c: CongeResponse): void {
    this.svc.approuver(c.id).subscribe({ next: () => this.chargerSoumises() });
  }

  openRejet(c: CongeResponse): void {
    this.rejetConge      = c;
    this.rejetCommentaire = '';
    this.rejetErr        = '';
    this.showRejet       = true;
  }

  closeRejet(): void { this.showRejet = false; this.rejetConge = null; }

  confirmerRejet(): void {
    if (!this.rejetCommentaire.trim()) {
      this.rejetErr = 'Le motif du rejet est obligatoire.'; return;
    }
    this.svc.rejeter(this.rejetConge!.id, { commentaire: this.rejetCommentaire }).subscribe({
      next: () => { this.showRejet = false; this.chargerSoumises(); },
      error: (e: any) => {
        this.rejetErr = e?.error?.message ?? 'Erreur lors du rejet.';
        this.cdr.markForCheck();
      }
    });
  }

  voirRejet(c: CongeResponse): void {
    this.motifRejetTexte = c.commentaireRejet ?? '';
    this.showMotifRejet  = true;
  }
}
