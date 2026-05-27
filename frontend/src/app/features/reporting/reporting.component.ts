import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef,
  OnDestroy, OnInit, inject, signal, ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);
import { ReportingService } from '../../core/services/reporting.service';
import {
  SyntheseRh, RapportConges, RapportPresences,
  RapportNotesFrais, RapportPrets, MOIS_LABELS
} from '../../core/models/reporting.model';

type Tab = 'synthese' | 'conges' | 'presences' | 'notes' | 'prets';

@Component({
  selector: 'app-reporting',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Reporting & Exports</h1>
      <p class="text-xs text-gray-400 mt-0.5">Tableaux consolidés · Export CSV</p>
    </div>
    <button (click)="exportCSV()"
            class="bg-emerald-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-emerald-700 transition flex items-center gap-2">
      <span>↓</span> Exporter CSV
    </button>
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
    @for (t of tabs; track t.key) {
      <button (click)="selectTab(t.key)"
              class="px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap"
              [class]="activeTab() === t.key
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'">
        {{ t.label }}
      </button>
    }
  </div>

  <!-- ══ SYNTHÈSE ══════════════════════════════════════════════════════════ -->
  @if (activeTab() === 'synthese') {
    @if (synthese) {
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        @for (kpi of kpis; track kpi.label) {
          <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-center">
            <p class="text-2xl font-bold" [class]="kpi.color">{{ kpi.value }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ kpi.label }}</p>
          </div>
        }
      </div>
      <!-- Chart alertes -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Indicateurs RH</h2>
        <canvas #syntheseCanvas height="120"></canvas>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Alertes</h2>
        <ul class="space-y-1.5 text-sm">
          @if (synthese.congesEnAttente > 0) {
            <li class="flex items-center gap-2 text-amber-700"><span class="text-base">⏳</span> {{ synthese.congesEnAttente }} demande(s) de congé en attente d'approbation</li>
          }
          @if (synthese.notesFraisEnAttente > 0) {
            <li class="flex items-center gap-2 text-amber-700"><span class="text-base">💰</span> {{ synthese.notesFraisEnAttente }} note(s) de frais en attente ({{ synthese.montantNotesFraisEnAttente | number:'1.0-0' }} FCFA)</li>
          }
          @if (synthese.documentsExpirant30j > 0) {
            <li class="flex items-center gap-2 text-red-700"><span class="text-base">📄</span> {{ synthese.documentsExpirant30j }} document(s) expire(nt) dans 30j</li>
          }
          @if (synthese.absencesEnAttente > 0) {
            <li class="flex items-center gap-2 text-amber-700"><span class="text-base">🏥</span> {{ synthese.absencesEnAttente }} absence(s) en attente d'approbation</li>
          }
          @if (synthese.congesEnAttente === 0 && synthese.notesFraisEnAttente === 0 && synthese.documentsExpirant30j === 0 && synthese.absencesEnAttente === 0) {
            <li class="text-green-600 flex items-center gap-2"><span>✓</span> Aucune alerte active</li>
          }
        </ul>
      </div>
    } @else {
      <p class="text-sm text-gray-400 text-center py-10">Chargement...</p>
    }
  }

  <!-- ══ CONGÉS ═══════════════════════════════════════════════════════════ -->
  @if (activeTab() === 'conges') {
    <div class="flex items-center gap-3">
      <label class="text-xs text-gray-500">Année :</label>
      <select [(ngModel)]="filterAnnee" (ngModelChange)="loadConges()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
        @for (a of anneeOptions; track a) { <option [value]="a">{{ a }}</option> }
      </select>
    </div>
    @if (rapportConges) {
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
          <p class="text-xl font-bold text-gray-800">{{ rapportConges.nbTotal }}</p>
          <p class="text-xs text-gray-400">Total demandes</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
          <p class="text-xl font-bold text-green-600">{{ rapportConges.nbApprouves }}</p>
          <p class="text-xs text-gray-400">Approuvées</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
          <p class="text-xl font-bold text-blue-600">{{ rapportConges.totalJours }}</p>
          <p class="text-xs text-gray-400">Jours approuvés</p>
        </div>
      </div>
      <!-- Chart statuts congés -->
      <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Répartition par statut</h2>
        <canvas #congesCanvas height="140"></canvas>
      </div>

      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Collaborateur</th>
              <th class="px-4 py-3 text-left font-medium">Type</th>
              <th class="px-4 py-3 text-left font-medium">Début</th>
              <th class="px-4 py-3 text-left font-medium">Fin</th>
              <th class="px-4 py-3 text-right font-medium">Jours</th>
              <th class="px-4 py-3 text-center font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (l of rapportConges.lignes; track $index) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-2.5 text-gray-700">{{ l.collaborateur }}</td>
                <td class="px-4 py-2.5 text-gray-500">{{ l.type }}</td>
                <td class="px-4 py-2.5 text-gray-500">{{ l.dateDebut }}</td>
                <td class="px-4 py-2.5 text-gray-500">{{ l.dateFin }}</td>
                <td class="px-4 py-2.5 text-right text-gray-700 font-medium">{{ l.nombreJours }}</td>
                <td class="px-4 py-2.5 text-center">
                  <span class="text-xs px-2 py-0.5 rounded-full" [class]="statutCssCg(l.statut)">{{ l.statut }}</span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="text-sm text-gray-400 text-center py-10">Chargement...</p>
    }
  }

  <!-- ══ PRÉSENCES ════════════════════════════════════════════════════════ -->
  @if (activeTab() === 'presences') {
    <div class="flex items-center gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <label class="text-xs text-gray-500">Mois :</label>
        <select [(ngModel)]="filterMois" (ngModelChange)="loadPresences()"
                class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
          @for (m of moisOptions; track m.val) { <option [value]="m.val">{{ m.label }}</option> }
        </select>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-gray-500">Année :</label>
        <select [(ngModel)]="filterAnnee" (ngModelChange)="loadPresences()"
                class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
          @for (a of anneeOptions; track a) { <option [value]="a">{{ a }}</option> }
        </select>
      </div>
    </div>
    @if (rapportPresences) {
      @if (rapportPresences.lignes.length === 0) {
        <p class="text-sm text-gray-400 text-center py-10">Aucun pointage pour cette période.</p>
      } @else {
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th class="px-4 py-3 text-left font-medium">Collaborateur</th>
                <th class="px-4 py-3 text-right font-medium">Jours travaillés</th>
                <th class="px-4 py-3 text-right font-medium">Retards</th>
                <th class="px-4 py-3 text-right font-medium">Absences</th>
                <th class="px-4 py-3 text-right font-medium">Total heures</th>
              </tr>
            </thead>
            <tbody>
              @for (l of rapportPresences.lignes; track $index) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="px-4 py-2.5 text-gray-700">{{ l.collaborateur }}</td>
                  <td class="px-4 py-2.5 text-right text-gray-700">{{ l.nbJoursTravailles }}</td>
                  <td class="px-4 py-2.5 text-right" [class]="l.nbRetards > 0 ? 'text-red-600 font-medium' : 'text-gray-500'">{{ l.nbRetards }}</td>
                  <td class="px-4 py-2.5 text-right" [class]="l.nbAbsences > 0 ? 'text-amber-600 font-medium' : 'text-gray-500'">{{ l.nbAbsences }}</td>
                  <td class="px-4 py-2.5 text-right text-gray-700 font-medium">{{ l.totalHeures | number:'1.1-1' }} h</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else {
      <p class="text-sm text-gray-400 text-center py-10">Chargement...</p>
    }
  }

  <!-- ══ NOTES DE FRAIS ═══════════════════════════════════════════════════ -->
  @if (activeTab() === 'notes') {
    <div class="flex items-center gap-3">
      <label class="text-xs text-gray-500">Année :</label>
      <select [(ngModel)]="filterAnnee" (ngModelChange)="loadNotes()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
        @for (a of anneeOptions; track a) { <option [value]="a">{{ a }}</option> }
      </select>
    </div>
    @if (rapportNotes) {
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
          <p class="text-xl font-bold text-gray-800">{{ rapportNotes.nbTotal }}</p>
          <p class="text-xs text-gray-400">Total notes</p>
        </div>
        <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm col-span-2">
          <p class="text-xl font-bold text-emerald-600">{{ rapportNotes.montantTotal | number:'1.0-0' }} FCFA</p>
          <p class="text-xs text-gray-400">Montant approuvé + remboursé</p>
        </div>
      </div>
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Collaborateur</th>
              <th class="px-4 py-3 text-left font-medium">Catégorie</th>
              <th class="px-4 py-3 text-left font-medium">Titre</th>
              <th class="px-4 py-3 text-right font-medium">Montant</th>
              <th class="px-4 py-3 text-center font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (l of rapportNotes.lignes; track $index) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-2.5 text-gray-700">{{ l.collaborateur }}</td>
                <td class="px-4 py-2.5 text-gray-500 text-xs">{{ l.categorie }}</td>
                <td class="px-4 py-2.5 text-gray-600">{{ l.titre }}</td>
                <td class="px-4 py-2.5 text-right font-medium text-gray-800">{{ l.montant | number:'1.0-0' }}</td>
                <td class="px-4 py-2.5 text-center"><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{{ l.statut }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="text-sm text-gray-400 text-center py-10">Chargement...</p>
    }
  }

  <!-- ══ PRÊTS ═════════════════════════════════════════════════════════════ -->
  @if (activeTab() === 'prets') {
    @if (rapportPrets) {
      <div class="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <span class="text-lg">💳</span>
        <p class="text-sm text-amber-800">
          Encours total des prêts actifs : <strong>{{ rapportPrets.totalEncours | number:'1.0-0' }} FCFA</strong>
        </p>
      </div>
      <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-gray-500 text-xs">
            <tr>
              <th class="px-4 py-3 text-left font-medium">Collaborateur</th>
              <th class="px-4 py-3 text-left font-medium">Type</th>
              <th class="px-4 py-3 text-right font-medium">Montant</th>
              <th class="px-4 py-3 text-center font-medium">Écheances</th>
              <th class="px-4 py-3 text-right font-medium">Restant dû</th>
              <th class="px-4 py-3 text-center font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            @for (l of rapportPrets.lignes; track $index) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-2.5 text-gray-700">{{ l.collaborateur }}</td>
                <td class="px-4 py-2.5 text-gray-500 text-xs">{{ l.type }}</td>
                <td class="px-4 py-2.5 text-right text-gray-700">{{ l.montant | number:'1.0-0' }}</td>
                <td class="px-4 py-2.5 text-center text-gray-500">{{ l.nbPrelevees }}/{{ l.nbEcheances }}</td>
                <td class="px-4 py-2.5 text-right font-medium" [class]="l.restantDu > 0 ? 'text-red-600' : 'text-green-600'">
                  {{ l.restantDu | number:'1.0-0' }}
                </td>
                <td class="px-4 py-2.5 text-center"><span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{{ l.statut }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="text-sm text-gray-400 text-center py-10">Chargement...</p>
    }
  }

</div>
`,
})
export class ReportingComponent implements OnInit, OnDestroy {
  private svc = inject(ReportingService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('syntheseCanvas') syntheseCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('congesCanvas')   congesCanvasRef!:   ElementRef<HTMLCanvasElement>;
  private syntheseChart?: Chart;
  private congesChart?: Chart;

  activeTab = signal<Tab>('synthese');

  synthese:        SyntheseRh       | null = null;
  rapportConges:   RapportConges    | null = null;
  rapportPresences: RapportPresences | null = null;
  rapportNotes:    RapportNotesFrais | null = null;
  rapportPrets:    RapportPrets     | null = null;

  filterAnnee = new Date().getFullYear();
  filterMois  = new Date().getMonth() + 1;

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'synthese',   label: 'Synthèse RH' },
    { key: 'conges',     label: 'Congés' },
    { key: 'presences',  label: 'Présences' },
    { key: 'notes',      label: 'Notes de frais' },
    { key: 'prets',      label: 'Prêts' },
  ];

  readonly anneeOptions = [new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2];
  readonly moisOptions  = MOIS_LABELS.slice(1).map((l, i) => ({ val: i + 1, label: l }));

  get kpis() {
    if (!this.synthese) return [];
    return [
      { label: 'Collaborateurs',  value: this.synthese.nbCollaborateurs,   color: 'text-blue-600'   },
      { label: 'Congés en att.',  value: this.synthese.congesEnAttente,     color: 'text-amber-600'  },
      { label: 'Notes en att.',   value: this.synthese.notesFraisEnAttente, color: 'text-amber-600'  },
      { label: 'Prêts en cours',  value: this.synthese.pretsEnCours,        color: 'text-indigo-600' },
      { label: 'Docs expirant',   value: this.synthese.documentsExpirant30j,color: 'text-red-500'    },
      { label: 'Offres ouvertes', value: this.synthese.recrutementOuvert,   color: 'text-green-600'  },
      { label: 'Onboarding',      value: this.synthese.onboardingEnCours,   color: 'text-teal-600'   },
    ];
  }

  ngOnInit() { this.selectTab('synthese'); }

  ngOnDestroy() {
    this.syntheseChart?.destroy();
    this.congesChart?.destroy();
  }

  selectTab(tab: Tab) {
    this.activeTab.set(tab);
    switch (tab) {
      case 'synthese':
        if (!this.synthese) {
          this.svc.synthese().subscribe({ next: d => {
            this.synthese = d; this.cdr.markForCheck();
            Promise.resolve().then(() => this.buildSyntheseChart());
          }});
        } else {
          Promise.resolve().then(() => this.buildSyntheseChart());
        }
        break;
      case 'conges':     this.loadConges(); break;
      case 'presences':  this.loadPresences(); break;
      case 'notes':      this.loadNotes(); break;
      case 'prets':      if (!this.rapportPrets) { this.svc.prets().subscribe({ next: d => { this.rapportPrets = d; this.cdr.markForCheck(); } }); } break;
    }
  }

  loadConges() {
    this.rapportConges = null;
    this.congesChart?.destroy(); this.congesChart = undefined;
    this.svc.conges(this.filterAnnee).subscribe({ next: d => {
      this.rapportConges = d; this.cdr.markForCheck();
      Promise.resolve().then(() => this.buildCongesChart());
    }});
  }
  loadPresences() { this.rapportPresences = null; this.svc.presences(this.filterMois, this.filterAnnee).subscribe({ next: d => { this.rapportPresences = d; this.cdr.markForCheck(); } }); }
  loadNotes()     { this.rapportNotes = null; this.svc.notesFrais(this.filterAnnee).subscribe({ next: d => { this.rapportNotes = d; this.cdr.markForCheck(); } }); }

  statutCssCg(s: string) {
    const m: Record<string, string> = {
      APPROUVEE: 'bg-green-100 text-green-700', REJETEE: 'bg-red-100 text-red-700',
      SOUMISE: 'bg-amber-100 text-amber-700', BROUILLON: 'bg-gray-100 text-gray-600'
    };
    return m[s] ?? 'bg-gray-100 text-gray-600';
  }

  private buildSyntheseChart() {
    if (!this.synthese || !this.syntheseCanvasRef) return;
    this.syntheseChart?.destroy();
    const s = this.synthese;
    const labels = ['Congés att.', 'Notes att.', 'Prêts', 'Docs exp.', 'Recrutement', 'Onboarding'];
    const values = [s.congesEnAttente, s.notesFraisEnAttente, s.pretsEnCours, s.documentsExpirant30j, s.recrutementOuvert, s.onboardingEnCours];
    const colors = ['#f59e0b','#f59e0b','#6366f1','#ef4444','#10b981','#14b8a6'];
    this.syntheseChart = new Chart(this.syntheseCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Indicateurs RH', data: values, backgroundColor: colors, borderRadius: 4 }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#f3f4f6' } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  private buildCongesChart() {
    if (!this.rapportConges || !this.congesCanvasRef) return;
    this.congesChart?.destroy();
    const lignes = this.rapportConges.lignes;
    const counts: Record<string, number> = { APPROUVEE: 0, SOUMISE: 0, REJETEE: 0, BROUILLON: 0 };
    lignes.forEach(l => { if (counts[l.statut] !== undefined) counts[l.statut]++; else counts[l.statut] = 1; });
    const labels = Object.keys(counts).filter(k => counts[k] > 0);
    const data   = labels.map(k => counts[k]);
    const palette: Record<string, string> = { APPROUVEE: '#22c55e', SOUMISE: '#f59e0b', REJETEE: '#ef4444', BROUILLON: '#9ca3af' };
    const colors = labels.map(k => palette[k] ?? '#6b7280');
    this.congesChart = new Chart(this.congesCanvasRef.nativeElement, {
      type: 'doughnut',
      data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2 }] },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 12 } } },
        cutout: '65%'
      }
    });
  }

  exportCSV() {
    const tab = this.activeTab();
    let rows: string[][] = [];
    let filename = 'export.csv';

    if (tab === 'synthese' && this.synthese) {
      rows = [
        ['Indicateur', 'Valeur'],
        ['Collaborateurs actifs', String(this.synthese.nbCollaborateurs)],
        ['Congés en attente', String(this.synthese.congesEnAttente)],
        ['Absences en attente', String(this.synthese.absencesEnAttente)],
        ['Notes de frais en attente', String(this.synthese.notesFraisEnAttente)],
        ['Montant notes en attente (FCFA)', String(this.synthese.montantNotesFraisEnAttente)],
        ['Prêts en cours', String(this.synthese.pretsEnCours)],
        ['Encours prêts (FCFA)', String(this.synthese.encoursPrets)],
        ['Documents expirant 30j', String(this.synthese.documentsExpirant30j)],
        ['Offres recrutement ouvertes', String(this.synthese.recrutementOuvert)],
        ['Plans onboarding en cours', String(this.synthese.onboardingEnCours)],
      ];
      filename = `synthese-rh-${new Date().toISOString().slice(0,10)}.csv`;
    } else if (tab === 'conges' && this.rapportConges) {
      rows = [['Collaborateur', 'Type', 'Date début', 'Date fin', 'Jours', 'Statut'],
        ...this.rapportConges.lignes.map(l => [l.collaborateur, l.type, l.dateDebut, l.dateFin, String(l.nombreJours), l.statut])];
      filename = `conges-${this.filterAnnee}.csv`;
    } else if (tab === 'presences' && this.rapportPresences) {
      rows = [['Collaborateur', 'Jours travaillés', 'Retards', 'Absences', 'Total heures'],
        ...this.rapportPresences.lignes.map(l => [l.collaborateur, String(l.nbJoursTravailles), String(l.nbRetards), String(l.nbAbsences), String(l.totalHeures)])];
      filename = `presences-${MOIS_LABELS[this.filterMois]}-${this.filterAnnee}.csv`;
    } else if (tab === 'notes' && this.rapportNotes) {
      rows = [['Collaborateur', 'Catégorie', 'Titre', 'Montant', 'Date', 'Statut'],
        ...this.rapportNotes.lignes.map(l => [l.collaborateur, l.categorie, l.titre, String(l.montant), l.dateDebut, l.statut])];
      filename = `notes-frais-${this.filterAnnee}.csv`;
    } else if (tab === 'prets' && this.rapportPrets) {
      rows = [['Collaborateur', 'Type', 'Montant', 'Échéances', 'Prélevées', 'Restant dû', 'Statut'],
        ...this.rapportPrets.lignes.map(l => [l.collaborateur, l.type, String(l.montant), String(l.nbEcheances), String(l.nbPrelevees), String(l.restantDu), l.statut])];
      filename = `prets-${new Date().toISOString().slice(0,10)}.csv`;
    }

    if (rows.length === 0) return;
    const bom  = '﻿';
    const csv  = bom + rows.map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }
}
