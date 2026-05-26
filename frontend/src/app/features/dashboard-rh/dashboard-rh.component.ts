import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardRhService } from '../../core/services/dashboard-rh.service';
import { DashboardRh, MOIS_LABELS } from '../../core/models/dashboard-rh.model';

@Component({
  selector: 'app-dashboard-rh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, DecimalPipe, RouterModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Tableau de bord RH</h1>
      <p class="text-xs text-gray-400 mt-0.5">Vue consolidée de tous les modules RH</p>
    </div>
    <button (click)="load()"
            class="px-3 py-1.5 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
      Actualiser
    </button>
  </div>

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
</div>
  `
})
export class DashboardRhComponent implements OnInit {

  private svc = inject(DashboardRhService);
  private cdr = inject(ChangeDetectorRef);

  loading = signal(true);
  data    = signal<DashboardRh | null>(null);

  ngOnInit() { this.load(); }

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

  hasAlertes(): boolean {
    const d = this.data();
    if (!d) return false;
    return d.conges.enAttente > 0
        || d.notesFrais.enAttente > 0
        || d.evaluations.enAttente > 0
        || d.discipline.dossiersEnCours > 0;
  }

  moisLabel(m: number): string { return MOIS_LABELS[m] ?? ''; }
}
