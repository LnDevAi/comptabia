import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef,
  OnDestroy, OnInit, inject, signal, ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { DashboardRhService } from '../../core/services/dashboard-rh.service';
import { ComparatifRh, ComparatifSection, DashboardRh, MOIS_LABELS, PaiesMensuel } from '../../core/models/dashboard-rh.model';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-rh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, DecimalPipe, RouterModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header + tabs -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Tableau de bord RH</h1>
      <p class="text-xs text-gray-400 mt-0.5">Vue consolidée de tous les modules RH</p>
    </div>
    <div class="flex items-center gap-3">
      <div class="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
        <button (click)="activeTab = 'dashboard'"
                [class]="activeTab === 'dashboard'
                  ? 'px-3 py-1.5 bg-blue-600 text-white font-medium'
                  : 'px-3 py-1.5 text-gray-600 hover:bg-gray-50'">
          Vue générale
        </button>
        <button (click)="loadComparatif()"
                [class]="activeTab === 'comparatif'
                  ? 'px-3 py-1.5 bg-blue-600 text-white font-medium'
                  : 'px-3 py-1.5 text-gray-600 hover:bg-gray-50'">
          Comparatif N / N-1
        </button>
      </div>
      <button (click)="activeTab === 'dashboard' ? load() : loadComparatif(true)"
              class="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
        Actualiser
      </button>
    </div>
  </div>

  <!-- ═══════════════ VUE GÉNÉRALE ═══════════════ -->
  @if (activeTab === 'dashboard') {

    @if (loading()) {
      <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
    } @else if (data()) {

      <!-- Effectifs + Paie -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

        <!-- Effectifs -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Collaborateurs actifs</p>
              <p class="text-3xl font-bold text-gray-800 mt-1">{{ data()!.effectifs.nbActifs }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 text-lg">
              👥
            </div>
          </div>
          <a routerLink="/dashboard/paie"
             class="text-xs text-blue-600 hover:underline mt-3 inline-block">Voir la paie →</a>
        </div>

        <!-- Paie du mois -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">
                Masse salariale — {{ moisLabel(data()!.paie.mois) }} {{ data()!.paie.exercice }}
              </p>
              @if (data()!.paie.disponible) {
                <p class="text-2xl font-bold text-gray-800 mt-1">
                  {{ data()!.paie.masseSalarialeBrute | number:'1.0-0' }}
                  <span class="text-sm font-normal text-gray-400">XOF</span>
                </p>
                <p class="text-xs text-gray-500 mt-0.5">
                  Net à payer : {{ data()!.paie.netAPayer | number:'1.0-0' }} XOF
                  · {{ data()!.paie.nbSalaries }} salariés
                </p>
              } @else {
                <p class="text-sm text-gray-400 mt-2">Aucune feuille de paie disponible</p>
              }
            </div>
            <div class="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center text-green-600 text-lg">
              💰
            </div>
          </div>
          @if (data()!.paie.disponible) {
            <p class="text-xs text-gray-400 mt-2">
              Cotis. patronales : {{ data()!.paie.cotisationsPatronales | number:'1.0-0' }} XOF
            </p>
          }
        </div>

        <!-- Congés -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Congés</p>
              <div class="mt-2 space-y-1">
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-amber-400 inline-block"></span>
                  <span class="text-sm text-gray-700">
                    <strong class="text-gray-900">{{ data()!.conges.enAttente }}</strong>
                    en attente d'approbation
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-2 h-2 rounded-full bg-blue-400 inline-block"></span>
                  <span class="text-sm text-gray-700">
                    <strong class="text-gray-900">{{ data()!.conges.enCours }}</strong>
                    en cours aujourd'hui
                  </span>
                </div>
              </div>
            </div>
            <div class="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600 text-lg">
              🏖️
            </div>
          </div>
          <a routerLink="/dashboard/conges"
             class="text-xs text-blue-600 hover:underline mt-3 inline-block">Gérer les congés →</a>
        </div>

        <!-- Notes de frais -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide font-medium">Notes de frais</p>
              @if (data()!.notesFrais.enAttente > 0) {
                <p class="text-2xl font-bold text-amber-600 mt-1">{{ data()!.notesFrais.enAttente }}</p>
                <p class="text-xs text-gray-500 mt-0.5">
                  en attente · {{ data()!.notesFrais.montantEnAttente | number:'1.0-0' }} XOF
                </p>
              } @else {
                <p class="text-2xl font-bold text-green-600 mt-1">0</p>
                <p class="text-xs text-green-600 mt-0.5">Aucune en attente</p>
              }
            </div>
            <div class="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 text-lg">
              🧾
            </div>
          </div>
          <a routerLink="/dashboard/notes-frais"
             class="text-xs text-blue-600 hover:underline mt-3 inline-block">Voir les notes →</a>
        </div>
      </div>

      <!-- Ligne 2 : Discipline, Formation, Évaluations -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">

        <!-- Discipline -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700">Discipline & Sanctions</h3>
            <div class="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-600">⚖️</div>
          </div>
          <div class="flex items-end gap-3">
            <span class="text-4xl font-bold"
                  [class]="data()!.discipline.dossiersEnCours > 0 ? 'text-red-600' : 'text-green-600'">
              {{ data()!.discipline.dossiersEnCours }}
            </span>
            <span class="text-sm text-gray-500 mb-1">dossier{{ data()!.discipline.dossiersEnCours !== 1 ? 's' : '' }} en cours</span>
          </div>
          @if (data()!.discipline.dossiersEnCours > 0) {
            <div class="mt-2 bg-red-50 rounded-lg px-3 py-1.5">
              <p class="text-xs text-red-700 font-medium">Action requise — dossiers ouverts</p>
            </div>
          } @else {
            <div class="mt-2 bg-green-50 rounded-lg px-3 py-1.5">
              <p class="text-xs text-green-700 font-medium">Aucun dossier actif</p>
            </div>
          }
          <a routerLink="/dashboard/discipline"
             class="text-xs text-blue-600 hover:underline mt-3 inline-block">Voir les dossiers →</a>
        </div>

        <!-- Formation -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700">Formation professionnelle</h3>
            <div class="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">🎓</div>
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">Sessions en cours</span>
              <span class="text-lg font-bold text-indigo-700">{{ data()!.formation.sessionsEnCours }}</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-1.5">
              <div class="bg-indigo-500 h-1.5 rounded-full"
                   [style.width.%]="data()!.formation.sessionsEnCours > 0 ? 100 : 0"></div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">Inscriptions actives</span>
              <span class="text-base font-semibold text-gray-700">{{ data()!.formation.inscriptionsActives }}</span>
            </div>
          </div>
          <a routerLink="/dashboard/formation"
             class="text-xs text-blue-600 hover:underline mt-3 inline-block">Gérer les formations →</a>
        </div>

        <!-- Évaluations -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-gray-700">Évaluations collaborateurs</h3>
            <div class="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">⭐</div>
          </div>
          <div class="flex items-end gap-3">
            <span class="text-4xl font-bold"
                  [class]="data()!.evaluations.enAttente > 0 ? 'text-amber-600' : 'text-green-600'">
              {{ data()!.evaluations.enAttente }}
            </span>
            <span class="text-sm text-gray-500 mb-1">
              évaluation{{ data()!.evaluations.enAttente !== 1 ? 's' : '' }} à valider
            </span>
          </div>
          @if (data()!.evaluations.enAttente > 0) {
            <div class="mt-2 bg-amber-50 rounded-lg px-3 py-1.5">
              <p class="text-xs text-amber-700 font-medium">Évaluations soumises en attente de validation</p>
            </div>
          } @else {
            <div class="mt-2 bg-green-50 rounded-lg px-3 py-1.5">
              <p class="text-xs text-green-700 font-medium">Aucune évaluation en attente</p>
            </div>
          }
          <a routerLink="/dashboard/evaluations"
             class="text-xs text-blue-600 hover:underline mt-3 inline-block">Voir les évaluations →</a>
        </div>
      </div>

      <!-- Alertes consolidées -->
      @if (hasAlertes()) {
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 class="text-sm font-semibold text-amber-800 mb-2">Alertes RH en attente</h3>
          <div class="space-y-1">
            @if (data()!.conges.enAttente > 0) {
              <div class="flex items-center gap-2 text-xs text-amber-700">
                <span class="text-amber-500">•</span>
                <strong>{{ data()!.conges.enAttente }}</strong> demande{{ data()!.conges.enAttente !== 1 ? 's' : '' }} de congé en attente
                <a routerLink="/dashboard/conges" class="underline hover:text-amber-900 ml-1">→ Approuver</a>
              </div>
            }
            @if (data()!.notesFrais.enAttente > 0) {
              <div class="flex items-center gap-2 text-xs text-amber-700">
                <span class="text-amber-500">•</span>
                <strong>{{ data()!.notesFrais.enAttente }}</strong> note{{ data()!.notesFrais.enAttente !== 1 ? 's' : '' }} de frais à rembourser ({{ data()!.notesFrais.montantEnAttente | number:'1.0-0' }} XOF)
                <a routerLink="/dashboard/notes-frais" class="underline hover:text-amber-900 ml-1">→ Traiter</a>
              </div>
            }
            @if (data()!.evaluations.enAttente > 0) {
              <div class="flex items-center gap-2 text-xs text-amber-700">
                <span class="text-amber-500">•</span>
                <strong>{{ data()!.evaluations.enAttente }}</strong> évaluation{{ data()!.evaluations.enAttente !== 1 ? 's' : '' }} soumise{{ data()!.evaluations.enAttente !== 1 ? 's' : '' }} à valider
                <a routerLink="/dashboard/evaluations" class="underline hover:text-amber-900 ml-1">→ Valider</a>
              </div>
            }
            @if (data()!.discipline.dossiersEnCours > 0) {
              <div class="flex items-center gap-2 text-xs text-red-700">
                <span class="text-red-500">•</span>
                <strong>{{ data()!.discipline.dossiersEnCours }}</strong> dossier{{ data()!.discipline.dossiersEnCours !== 1 ? 's' : '' }} disciplinaire{{ data()!.discipline.dossiersEnCours !== 1 ? 's' : '' }} en cours
                <a routerLink="/dashboard/discipline" class="underline hover:text-red-900 ml-1">→ Voir</a>
              </div>
            }
          </div>
        </div>
      }

    }
  }

  <!-- ═══════════════ COMPARATIF N / N-1 ═══════════════ -->
  @if (activeTab === 'comparatif') {

    <!-- Sélecteur d'année -->
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600 font-medium">Année N :</label>
      <select [(ngModel)]="anneeComparatif" (change)="loadComparatif(true)"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
        @for (a of anneesDisponibles; track a) {
          <option [value]="a">{{ a }}</option>
        }
      </select>
      <span class="text-xs text-gray-400">comparé à {{ anneeComparatif - 1 }}</span>
    </div>

    @if (loadingComp()) {
      <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
    } @else if (comparatif()) {

      <!-- 4 KPI cards de comparaison -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <!-- Masse salariale -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Masse salariale brute</p>
          <div class="space-y-2">
            <div class="flex justify-between items-baseline">
              <span class="text-xs font-medium text-blue-700">{{ comparatif()!.anneeN }}</span>
              <span class="text-lg font-bold text-gray-800">{{ comparatif()!.masseSalariale.valeurN | number:'1.0-0' }}</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-gray-400">{{ comparatif()!.anneeN1 }}</span>
              <span class="text-sm text-gray-500">{{ comparatif()!.masseSalariale.valeurN1 | number:'1.0-0' }}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100">
            <span [class]="badgeClass(comparatif()!.masseSalariale)">
              {{ variationLabel(comparatif()!.masseSalariale) }}
            </span>
          </div>
        </div>

        <!-- Net à payer -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Net à payer cumulé</p>
          <div class="space-y-2">
            <div class="flex justify-between items-baseline">
              <span class="text-xs font-medium text-blue-700">{{ comparatif()!.anneeN }}</span>
              <span class="text-lg font-bold text-gray-800">{{ comparatif()!.netAPayer.valeurN | number:'1.0-0' }}</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-gray-400">{{ comparatif()!.anneeN1 }}</span>
              <span class="text-sm text-gray-500">{{ comparatif()!.netAPayer.valeurN1 | number:'1.0-0' }}</span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100">
            <span [class]="badgeClass(comparatif()!.netAPayer)">
              {{ variationLabel(comparatif()!.netAPayer) }}
            </span>
          </div>
        </div>

        <!-- Congés -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Congés approuvés</p>
          <div class="space-y-2">
            <div class="flex justify-between items-baseline">
              <span class="text-xs font-medium text-blue-700">{{ comparatif()!.anneeN }}</span>
              <span class="text-lg font-bold text-gray-800">
                {{ comparatif()!.congesJours.valeurN | number:'1.0-0' }} j
                <span class="text-xs font-normal text-gray-400">({{ comparatif()!.congesNb.valeurN | number:'1.0-0' }})</span>
              </span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-gray-400">{{ comparatif()!.anneeN1 }}</span>
              <span class="text-sm text-gray-500">
                {{ comparatif()!.congesJours.valeurN1 | number:'1.0-0' }} j
                <span class="text-xs text-gray-400">({{ comparatif()!.congesNb.valeurN1 | number:'1.0-0' }})</span>
              </span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100">
            <span [class]="badgeClass(comparatif()!.congesJours)">
              {{ variationLabel(comparatif()!.congesJours) }}
            </span>
          </div>
        </div>

        <!-- Notes de frais -->
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide font-medium mb-3">Notes de frais remboursées</p>
          <div class="space-y-2">
            <div class="flex justify-between items-baseline">
              <span class="text-xs font-medium text-blue-700">{{ comparatif()!.anneeN }}</span>
              <span class="text-lg font-bold text-gray-800">
                {{ comparatif()!.notesFraisMontant.valeurN | number:'1.0-0' }}
                <span class="text-xs font-normal text-gray-400">({{ comparatif()!.notesFraisNb.valeurN | number:'1.0-0' }})</span>
              </span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-xs text-gray-400">{{ comparatif()!.anneeN1 }}</span>
              <span class="text-sm text-gray-500">
                {{ comparatif()!.notesFraisMontant.valeurN1 | number:'1.0-0' }}
                <span class="text-xs text-gray-400">({{ comparatif()!.notesFraisNb.valeurN1 | number:'1.0-0' }})</span>
              </span>
            </div>
          </div>
          <div class="mt-3 pt-3 border-t border-gray-100">
            <span [class]="badgeClass(comparatif()!.notesFraisMontant)">
              {{ variationLabel(comparatif()!.notesFraisMontant) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Charts comparatif -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">
            Évolution mensuelle — Masse salariale brute
            <span class="text-xs font-normal text-gray-400 ml-1">({{ comparatif()!.anneeN }} vs {{ comparatif()!.anneeN1 }})</span>
          </h3>
          <div class="relative h-72">
            <canvas #massaCanvas></canvas>
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-3">
            Indicateurs clés — {{ comparatif()!.anneeN }} vs {{ comparatif()!.anneeN1 }}
          </h3>
          <div class="relative h-72">
            <canvas #kpiCanvas></canvas>
          </div>
        </div>
      </div>

      <!-- Tableau détaillé mensuel -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100">
          <h3 class="text-sm font-semibold text-gray-700">Détail mensuel paie — {{ comparatif()!.anneeN }}</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-gray-50 text-gray-500 uppercase tracking-wide">
                <th class="px-4 py-2 text-left font-medium">Mois</th>
                <th class="px-4 py-2 text-right font-medium">Salariés</th>
                <th class="px-4 py-2 text-right font-medium">Masse brute N</th>
                <th class="px-4 py-2 text-right font-medium">Net à payer N</th>
                <th class="px-4 py-2 text-right font-medium">Masse brute N-1</th>
                <th class="px-4 py-2 text-right font-medium">Variation</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (mois of moisRange; track mois) {
                @let rowN = getMoisRow(comparatif()!.paiesMensuellesN, mois);
                @let rowN1 = getMoisRow(comparatif()!.paiesMensuellesN1, mois);
                <tr class="hover:bg-gray-50">
                  <td class="px-4 py-2 font-medium text-gray-700">{{ moisLabel(mois) }}</td>
                  <td class="px-4 py-2 text-right text-gray-600">{{ rowN?.nbSalaries ?? '—' }}</td>
                  <td class="px-4 py-2 text-right text-gray-800 font-medium">
                    {{ rowN ? (rowN.masseBrute | number:'1.0-0') : '—' }}
                  </td>
                  <td class="px-4 py-2 text-right text-gray-600">
                    {{ rowN ? (rowN.netAPayer | number:'1.0-0') : '—' }}
                  </td>
                  <td class="px-4 py-2 text-right text-gray-400">
                    {{ rowN1 ? (rowN1.masseBrute | number:'1.0-0') : '—' }}
                  </td>
                  <td class="px-4 py-2 text-right">
                    @if (rowN && rowN1) {
                      @let diff = rowN.masseBrute - rowN1.masseBrute;
                      <span [class]="diff >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">
                        {{ diff >= 0 ? '+' : '' }}{{ diff | number:'1.0-0' }}
                      </span>
                    } @else {
                      <span class="text-gray-300">—</span>
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
  `
})
export class DashboardRhComponent implements OnInit, OnDestroy {

  private svc = inject(DashboardRhService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('massaCanvas') massaCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('kpiCanvas')   kpiCanvasRef!: ElementRef<HTMLCanvasElement>;

  private massaChart?: Chart;
  private kpiChart?: Chart;

  loading      = signal(true);
  loadingComp  = signal(false);
  data         = signal<DashboardRh | null>(null);
  comparatif   = signal<ComparatifRh | null>(null);
  activeTab    = 'dashboard';

  anneeComparatif = new Date().getFullYear();
  anneesDisponibles = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  moisRange = [1,2,3,4,5,6,7,8,9,10,11,12];

  ngOnInit() { this.load(); }

  ngOnDestroy() {
    this.massaChart?.destroy();
    this.kpiChart?.destroy();
  }

  load() {
    this.loading.set(true);
    this.svc.get().subscribe({
      next: d => {
        this.data.set(d);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => this.loading.set(false)
    });
  }

  loadComparatif(force = false) {
    this.activeTab = 'comparatif';
    if (this.comparatif() && !force) {
      Promise.resolve().then(() => this.buildCharts());
      return;
    }
    this.massaChart?.destroy(); this.massaChart = undefined;
    this.kpiChart?.destroy();   this.kpiChart   = undefined;
    this.loadingComp.set(true);
    this.svc.getComparatif(this.anneeComparatif).subscribe({
      next: c => {
        this.comparatif.set(c);
        this.loadingComp.set(false);
        this.cdr.markForCheck();
        Promise.resolve().then(() => this.buildCharts());
      },
      error: () => this.loadingComp.set(false)
    });
  }

  private buildCharts() {
    this.buildMassaChart();
    this.buildKpiChart();
  }

  private buildMassaChart() {
    const c = this.comparatif();
    if (!c || !this.massaCanvasRef) return;
    this.massaChart?.destroy();
    const labels = this.moisRange.map(m => this.moisCourt(m));
    const dataN  = this.moisRange.map(m => this.getValMois(c.paiesMensuellesN,  m));
    const dataN1 = this.moisRange.map(m => this.getValMois(c.paiesMensuellesN1, m));
    this.massaChart = new Chart(this.massaCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: String(c.anneeN),
            data: dataN,
            backgroundColor: 'rgba(59,130,246,0.7)',
            borderColor: 'rgba(59,130,246,1)',
            borderWidth: 1,
          },
          {
            label: String(c.anneeN1),
            data: dataN1,
            backgroundColor: 'rgba(209,213,219,0.6)',
            borderColor: 'rgba(156,163,175,0.8)',
            borderWidth: 1,
          },
          {
            type: 'line' as const,
            label: 'Net ' + c.anneeN,
            data: this.moisRange.map(m => this.getMoisRow(c.paiesMensuellesN, m)?.netAPayer ?? 0),
            borderColor: 'rgba(34,197,94,0.85)',
            borderWidth: 2,
            pointRadius: 3,
            fill: false,
            yAxisID: 'y',
          } as any,
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { font: { size: 10 } }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: v => this.fmtK(Number(v)) } },
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${this.fmtK(ctx.parsed.y ?? 0)}` } },
        }
      }
    });
  }

  private buildKpiChart() {
    const c = this.comparatif();
    if (!c || !this.kpiCanvasRef) return;
    this.kpiChart?.destroy();
    const labels = ['Masse salariale', 'Net à payer', 'Notes de frais'];
    const dataN  = [c.masseSalariale.valeurN,   c.netAPayer.valeurN,   c.notesFraisMontant.valeurN];
    const dataN1 = [c.masseSalariale.valeurN1,  c.netAPayer.valeurN1,  c.notesFraisMontant.valeurN1];
    this.kpiChart = new Chart(this.kpiCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: String(c.anneeN),  data: dataN,  backgroundColor: 'rgba(59,130,246,0.7)', borderWidth: 0 },
          { label: String(c.anneeN1), data: dataN1, backgroundColor: 'rgba(209,213,219,0.6)', borderWidth: 0 },
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { font: { size: 11 } }, grid: { display: false } },
          y: { beginAtZero: true, ticks: { font: { size: 10 }, callback: v => this.fmtK(Number(v)) } },
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, boxWidth: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${this.fmtK(ctx.parsed.y ?? 0)}` } },
        }
      }
    });
  }

  fmtK(v: number): string {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + ' K';
    return v.toFixed(0);
  }

  hasAlertes(): boolean {
    const d = this.data();
    if (!d) return false;
    return d.conges.enAttente > 0
        || d.notesFrais.enAttente > 0
        || d.evaluations.enAttente > 0
        || d.discipline.dossiersEnCours > 0;
  }

  moisLabel(m: number): string { return MOIS_LABELS[m] ?? ''; }
  moisCourt(m: number): string { return (MOIS_LABELS[m] ?? '').substring(0, 3); }

  badgeClass(s: ComparatifSection): string {
    const base = 'text-xs font-medium px-2 py-0.5 rounded-full ';
    if (s.variationPourcent === 0) return base + 'bg-gray-100 text-gray-600';
    return s.variationPourcent > 0
      ? base + 'bg-green-100 text-green-700'
      : base + 'bg-red-100 text-red-700';
  }

  variationLabel(s: ComparatifSection): string {
    const sign = s.variationPourcent >= 0 ? '+' : '';
    return `${sign}${s.variationPourcent.toFixed(1)}%`;
  }

  getValMois(rows: PaiesMensuel[], mois: number): number {
    return rows.find(r => r.mois === mois)?.masseBrute ?? 0;
  }

  getMoisRow(rows: PaiesMensuel[], mois: number): PaiesMensuel | undefined {
    return rows.find(r => r.mois === mois);
  }

  maxMasse(): number {
    if (!this.comparatif()) return 1;
    const c = this.comparatif()!;
    const allN  = this.moisRange.map(m => this.getValMois(c.paiesMensuellesN,  m));
    const allN1 = this.moisRange.map(m => this.getValMois(c.paiesMensuellesN1, m));
    return Math.max(...allN, ...allN1, 1);
  }

  barWidth(val: number, max: number): number {
    return max === 0 ? 0 : Math.round((val / max) * 100);
  }
}
