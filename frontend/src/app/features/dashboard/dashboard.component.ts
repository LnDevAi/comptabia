import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EcritureService } from '../../core/services/ecriture.service';
import { CompteService } from '../../core/services/compte.service';
import { AuthService } from '../../core/services/auth.service';
import { forkJoin } from 'rxjs';
import { Ecriture } from '../../core/models/ecriture.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 class="text-xl font-bold text-gray-900">Tableau de bord</h2>
        <p class="text-sm text-gray-500">{{ auth.user()?.nomEntreprise }}</p>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Comptes actifs</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats().comptes }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Écritures totales</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats().ecritures }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Brouillons</p>
          <p class="text-2xl font-bold text-yellow-600 mt-1">{{ stats().brouillons }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Validées</p>
          <p class="text-2xl font-bold text-green-600 mt-1">{{ stats().validees }}</p>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a routerLink="/dashboard/ecritures"
           class="flex items-center gap-4 bg-blue-600 hover:bg-blue-700 text-white
                  rounded-xl p-5 transition">
          <div class="text-3xl">📝</div>
          <div>
            <p class="font-semibold">Nouvelle écriture</p>
            <p class="text-sm text-blue-200">Saisir une écriture comptable</p>
          </div>
        </a>
        <a routerLink="/dashboard/plan-comptes"
           class="flex items-center gap-4 bg-white hover:bg-gray-50 border border-gray-200
                  rounded-xl p-5 transition">
          <div class="text-3xl">📊</div>
          <div>
            <p class="font-semibold text-gray-900">Plan de comptes</p>
            <p class="text-sm text-gray-500">Consulter le référentiel SYSCOHADA</p>
          </div>
        </a>
      </div>

      <!-- Recent écritures -->
      @if (recentEcritures().length > 0) {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100">
            <h3 class="text-sm font-semibold text-gray-700">Dernières écritures</h3>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-5 py-2 text-left">Pièce</th>
                <th class="px-5 py-2 text-left">Date</th>
                <th class="px-5 py-2 text-left">Libellé</th>
                <th class="px-5 py-2 text-left">Journal</th>
                <th class="px-5 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (e of recentEcritures(); track e.id) {
                <tr class="hover:bg-gray-50">
                  <td class="px-5 py-3 font-mono text-xs">{{ e.numeroPiece }}</td>
                  <td class="px-5 py-3 text-gray-600">{{ e.dateEcriture }}</td>
                  <td class="px-5 py-3 text-gray-800">{{ e.libelle }}</td>
                  <td class="px-5 py-3">
                    <span class="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">{{ e.journal }}</span>
                  </td>
                  <td class="px-5 py-3">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                          [class]="statutClass(e.statut)">
                      {{ e.statut }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `
})
export class DashboardComponent implements OnInit {

  protected readonly auth             = inject(AuthService);
  private  readonly ecritureService   = inject(EcritureService);
  private  readonly compteService     = inject(CompteService);

  stats            = signal({ comptes: 0, ecritures: 0, brouillons: 0, validees: 0 });
  recentEcritures  = signal<Ecriture[]>([]);

  ngOnInit() {
    forkJoin({
      comptes:   this.compteService.findAll(),
      ecritures: this.ecritureService.findAll(0, 5)
    }).subscribe({
      next: ({ comptes, ecritures }) => {
        const brouillons = ecritures.content.filter(e => e.statut === 'BROUILLON').length;
        const validees   = ecritures.content.filter(e => e.statut === 'VALIDEE').length;
        this.stats.set({ comptes: comptes.length, ecritures: ecritures.totalElements, brouillons, validees });
        this.recentEcritures.set(ecritures.content);
      }
    });
  }

  statutClass(statut: string): string {
    if (statut === 'VALIDEE')  return 'bg-green-100 text-green-700';
    if (statut === 'CLOTUREE') return 'bg-gray-200 text-gray-600';
    return 'bg-yellow-100 text-yellow-700';
  }
}
