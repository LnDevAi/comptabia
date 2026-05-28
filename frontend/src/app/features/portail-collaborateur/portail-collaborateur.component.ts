import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { PortailService } from '../../core/services/portail.service';
import {
  PortailTableau, PortailConge, PortailPret, PortailPointage
} from '../../core/models/portail.model';
import { TYPE_PRET_LABELS, STATUT_PRET_LABELS, MOIS_LABELS } from '../../core/models/pret.model';

type Tab = 'accueil' | 'conges' | 'notes' | 'prets' | 'pointages';

const CONGE_STATUT_CSS: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-600',
  SOUMISE:   'bg-amber-100 text-amber-700',
  APPROUVEE: 'bg-green-100 text-green-700',
  REJETEE:   'bg-red-100 text-red-700',
};

const CONGE_STATUT_LABELS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  SOUMISE:   'En attente',
  APPROUVEE: 'Approuvé',
  REJETEE:   'Rejeté',
};

const NOTE_STATUT_CSS: Record<string, string> = {
  BROUILLON:  'bg-gray-100 text-gray-600',
  SOUMISE:    'bg-amber-100 text-amber-700',
  APPROUVEE:  'bg-blue-100 text-blue-700',
  REJETEE:    'bg-red-100 text-red-700',
  REMBOURSEE: 'bg-green-100 text-green-700',
};

const POINTAGE_CSS: Record<string, string> = {
  NORMAL:       'bg-green-100 text-green-700',
  RETARD:       'bg-red-100 text-red-700',
  DEMI_JOURNEE: 'bg-amber-100 text-amber-700',
};

@Component({
  selector: 'app-portail-collaborateur',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, DatePipe, DecimalPipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Mon espace collaborateur</h1>
    <p class="text-xs text-gray-400 mt-0.5">Consultez vos données RH personnelles</p>
  </div>

  @if (loading) {
    <p class="text-sm text-gray-400 text-center py-16">Chargement...</p>
  } @else if (tableau) {

    <!-- Onglets -->
    <div class="flex gap-1 border-b border-gray-200 overflow-x-auto">
      @for (t of tabs; track t.key) {
        <button (click)="activeTab.set(t.key)"
                class="px-4 py-2 text-sm font-medium border-b-2 transition whitespace-nowrap"
                [class]="activeTab() === t.key
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'">
          {{ t.label }}
        </button>
      }
    </div>

    <!-- ══ Accueil ══════════════════════════════════════════════════════════ -->
    @if (activeTab() === 'accueil') {
      <div class="grid gap-4 md:grid-cols-2">
        <!-- Profil card -->
        <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl font-bold">
              {{ tableau.profil.nom.charAt(0).toUpperCase() }}
            </div>
            <div>
              <p class="font-semibold text-gray-800">{{ tableau.profil.nom }}</p>
              <p class="text-xs text-gray-500">{{ tableau.profil.email }}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block"
                    [class]="roleCss(tableau.profil.role)">
                {{ tableau.profil.role }}
              </span>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
            <p>Entreprise : <span class="text-gray-700 font-medium">{{ tableau.profil.nomEntreprise }}</span></p>
            @if (tableau.profil.createdAt) {
              <p>Membre depuis : {{ tableau.profil.createdAt | date:'dd/MM/yyyy' }}</p>
            }
          </div>
        </div>

        <!-- Récap KPI -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <p class="text-2xl font-bold text-amber-600">{{ congesEnAttente }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Congé(s) en attente</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <p class="text-2xl font-bold text-green-600">{{ congesApprouves }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Congé(s) approuvé(s)</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <p class="text-2xl font-bold text-indigo-600">{{ notesEnAttente }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Note(s) de frais</p>
          </div>
          <div class="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-center">
            <p class="text-2xl font-bold text-violet-600">{{ pretsEnCours }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Prêt(s) en cours</p>
          </div>
        </div>
      </div>

      <!-- Activité récente (3 derniers pointages) -->
      @if (tableau.pointages.length > 0) {
        <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <h2 class="text-sm font-semibold text-gray-700 mb-3">Pointages récents</h2>
          <div class="space-y-2">
            @for (p of tableau.pointages.slice(0, 5); track p.id) {
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">{{ p.datePointage | date:'EEE dd/MM' }}</span>
                <div class="flex items-center gap-2">
                  @if (p.heureArrivee) {
                    <span class="text-gray-400 text-xs">{{ p.heureArrivee }} - {{ p.heureDepart ?? '...' }}</span>
                  }
                  <span class="text-xs px-2 py-0.5 rounded-full" [class]="pointageCss(p.type)">
                    {{ pointageLabel(p.type) }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>
      }
    }

    <!-- ══ Congés ══════════════════════════════════════════════════════════ -->
    @if (activeTab() === 'conges') {
      @if (tableau.conges.length === 0) {
        <div class="text-center py-12 text-gray-400 text-sm">Aucun congé enregistré.</div>
      } @else {
        <div class="space-y-2">
          @for (c of tableau.conges; track c.id) {
            <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
              <div class="space-y-0.5">
                <p class="text-sm font-medium text-gray-800">{{ congeTypeLabel(c.type) }}</p>
                <p class="text-xs text-gray-400">
                  {{ c.dateDebut | date:'dd/MM/yyyy' }} → {{ c.dateFin | date:'dd/MM/yyyy' }}
                  · {{ c.nombreJours }} j
                </p>
                @if (c.motif) { <p class="text-xs text-gray-400 italic">{{ c.motif }}</p> }
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    [class]="congeStatutCss(c.statut)">
                {{ congeStatutLabel(c.statut) }}
              </span>
            </div>
          }
        </div>
      }
    }

    <!-- ══ Notes de frais ══════════════════════════════════════════════════ -->
    @if (activeTab() === 'notes') {
      @if (tableau.notesFrais.length === 0) {
        <div class="text-center py-12 text-gray-400 text-sm">Aucune note de frais.</div>
      } @else {
        <div class="space-y-2">
          @for (n of tableau.notesFrais; track n.id) {
            <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
              <div class="space-y-0.5">
                <p class="text-sm font-medium text-gray-800">{{ n.titre }}</p>
                <p class="text-xs text-gray-400">
                  {{ n.dateDebut | date:'dd/MM/yyyy' }} → {{ n.dateFin | date:'dd/MM/yyyy' }}
                </p>
                <p class="text-xs text-indigo-600 font-medium">{{ n.montant | number:'1.0-0' }} FCFA</p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                    [class]="noteStatutCss(n.statut)">
                {{ n.statut }}
              </span>
            </div>
          }
        </div>
      }
    }

    <!-- ══ Prêts ════════════════════════════════════════════════════════════ -->
    @if (activeTab() === 'prets') {
      @if (tableau.prets.length === 0) {
        <div class="text-center py-12 text-gray-400 text-sm">Aucun prêt ni avance.</div>
      } @else {
        <div class="space-y-3">
          @for (p of tableau.prets; track p.id) {
            <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-2">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-semibold text-gray-800">
                    {{ typesPret[p.typePret] }} — {{ p.montant | number:'1.0-0' }} FCFA
                  </p>
                  <p class="text-xs text-gray-400">{{ p.nbEcheances }} × {{ p.montantEcheance | number:'1.0-0' }} FCFA · Début {{ p.dateDebut | date:'dd/MM/yyyy' }}</p>
                </div>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class]="pretStatutCss(p.statut)">
                  {{ pretStatutLabel(p.statut) }}
                </span>
              </div>
              @if (p.statut === 'EN_COURS' || p.statut === 'SOLDE') {
                <div>
                  <div class="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{{ p.nbPrelevees }} / {{ p.nbEcheances }} prélevées</span>
                    <span>{{ pretProgress(p) }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-1.5">
                    <div class="h-1.5 rounded-full"
                         [class]="p.statut === 'SOLDE' ? 'bg-green-500' : 'bg-violet-500'"
                         [style.width]="pretProgress(p) + '%'"></div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    }

    <!-- ══ Pointages ════════════════════════════════════════════════════════ -->
    @if (activeTab() === 'pointages') {
      @if (tableau.pointages.length === 0) {
        <div class="text-center py-12 text-gray-400 text-sm">Aucun pointage sur les 3 derniers mois.</div>
      } @else {
        <div class="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th class="px-4 py-3 text-left font-medium">Date</th>
                <th class="px-4 py-3 text-left font-medium">Arrivée</th>
                <th class="px-4 py-3 text-left font-medium">Départ</th>
                <th class="px-4 py-3 text-right font-medium">Heures</th>
                <th class="px-4 py-3 text-center font-medium">Type</th>
              </tr>
            </thead>
            <tbody>
              @for (p of tableau.pointages; track p.id) {
                <tr class="border-t border-gray-100">
                  <td class="px-4 py-2.5 text-gray-700">{{ p.datePointage | date:'EEE dd/MM/yyyy' }}</td>
                  <td class="px-4 py-2.5 text-gray-600">{{ p.heureArrivee ?? '—' }}</td>
                  <td class="px-4 py-2.5 text-gray-600">{{ p.heureDepart ?? '—' }}</td>
                  <td class="px-4 py-2.5 text-right text-gray-700 font-medium">
                    {{ p.heuresTravaillees != null ? (p.heuresTravaillees | number:'1.1-1') + ' h' : '—' }}
                  </td>
                  <td class="px-4 py-2.5 text-center">
                    <span class="text-xs px-2 py-0.5 rounded-full" [class]="pointageCss(p.type)">
                      {{ pointageLabel(p.type) }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }

  }
</div>
`,
})
export class PortailCollaborateurComponent implements OnInit {
  private svc = inject(PortailService);
  private cdr = inject(ChangeDetectorRef);

  tableau: PortailTableau | null = null;
  loading = true;
  activeTab = signal<Tab>('accueil');

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'accueil',    label: 'Accueil' },
    { key: 'conges',     label: 'Mes congés' },
    { key: 'notes',      label: 'Mes notes de frais' },
    { key: 'prets',      label: 'Mes prêts' },
    { key: 'pointages',  label: 'Mes pointages' },
  ];

  readonly typesPret = TYPE_PRET_LABELS;

  get congesEnAttente() { return this.tableau?.conges.filter(c => c.statut === 'SOUMISE').length ?? 0; }
  get congesApprouves() { return this.tableau?.conges.filter(c => c.statut === 'APPROUVEE').length ?? 0; }
  get notesEnAttente()  { return this.tableau?.notesFrais.filter(n => n.statut === 'SOUMISE').length ?? 0; }
  get pretsEnCours()    { return this.tableau?.prets.filter(p => p.statut === 'EN_COURS').length ?? 0; }

  ngOnInit() {
    this.svc.getTableau().subscribe({
      next: t => { this.tableau = t; this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  roleCss(role: string) {
    return role === 'ADMIN' ? 'bg-red-100 text-red-700' :
           role === 'COMPTABLE' ? 'bg-blue-100 text-blue-700' :
           'bg-gray-100 text-gray-600';
  }

  congeTypeLabel(type: string) {
    const map: Record<string, string> = {
      ANNUEL: 'Congé annuel', MALADIE: 'Maladie', SANS_SOLDE: 'Sans solde',
      EXCEPTIONNEL: 'Exceptionnel', MATERNITE: 'Maternité', PATERNITE: 'Paternité'
    };
    return map[type] ?? type;
  }
  congeStatutCss(s: string)   { return CONGE_STATUT_CSS[s]    ?? 'bg-gray-100 text-gray-600'; }
  congeStatutLabel(s: string) { return CONGE_STATUT_LABELS[s] ?? s; }
  noteStatutCss(s: string)    { return NOTE_STATUT_CSS[s]     ?? 'bg-gray-100 text-gray-600'; }
  pointageCss(t: string)      { return POINTAGE_CSS[t]        ?? 'bg-gray-100 text-gray-600'; }
  pointageLabel(t: string) {
    return t === 'NORMAL' ? 'Normal' : t === 'RETARD' ? 'Retard' : 'Demi-journée';
  }
  pretStatutCss(s: string) {
    const m: Record<string, string> = {
      EN_ATTENTE: 'bg-amber-100 text-amber-700', APPROUVE: 'bg-blue-100 text-blue-700',
      EN_COURS: 'bg-indigo-100 text-indigo-700', SOLDE: 'bg-green-100 text-green-700',
      REFUSE: 'bg-red-100 text-red-700'
    };
    return m[s] ?? 'bg-gray-100 text-gray-600';
  }
  pretStatutLabel(s: string)           { return STATUT_PRET_LABELS[s as keyof typeof STATUT_PRET_LABELS] ?? s; }
  pretProgress(p: PortailPret)         { return p.nbEcheances === 0 ? 0 : Math.round(p.nbPrelevees / p.nbEcheances * 100); }
}
