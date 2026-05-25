import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AlerteService } from '../../../core/services/alerte.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <!-- Top bar -->
      <header class="h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-4 shrink-0">
        <span class="font-bold text-blue-700 text-lg mr-6">e-Compta</span>

        <nav class="flex items-center gap-1 flex-1">
          <a routerLink="/dashboard" routerLinkActive="bg-blue-50 text-blue-700"
             [routerLinkActiveOptions]="{exact:true}"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Tableau de bord
          </a>
          <a routerLink="/dashboard/plan-comptes" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Plan de comptes
          </a>
          <a routerLink="/dashboard/ecritures" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Écritures
          </a>
          <a routerLink="/dashboard/etats" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            États financiers
          </a>
          <a routerLink="/dashboard/exercices" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Exercices
          </a>
          <a routerLink="/dashboard/tiers" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Tiers
          </a>
          <a routerLink="/dashboard/immobilisations" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Immobilisations
          </a>
          <a routerLink="/dashboard/budget" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Budget
          </a>
          <a routerLink="/dashboard/rapprochement" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Rapprochement
          </a>
          <a routerLink="/dashboard/tva" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            TVA
          </a>
          <a routerLink="/dashboard/lettrage" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Lettrage
          </a>
          <a routerLink="/dashboard/analytique" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Analytique
          </a>
          <a routerLink="/dashboard/relances" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Relances
          </a>
          <a routerLink="/dashboard/alertes" routerLinkActive="bg-red-50 text-red-700"
             class="relative px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Alertes
            @if (alerteSvc.total > 0) {
              <span class="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold"
                    [ngClass]="(alerteSvc.alertes()?.countDanger ?? 0) > 0 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'">
                {{ alerteSvc.total }}
              </span>
            }
          </a>
          <a routerLink="/dashboard/export" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Export
          </a>
          <a routerLink="/dashboard/modeles" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Modèles
          </a>
          <a routerLink="/dashboard/import-fec" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Import FEC
          </a>
          @if (user()?.role === 'ADMIN') {
            <a routerLink="/dashboard/parametres" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Paramètres
            </a>
            <a routerLink="/dashboard/audit" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Audit
            </a>
            <a routerLink="/dashboard/admin" routerLinkActive="bg-red-50 text-red-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Administration
            </a>
          }
          <a routerLink="/dashboard/affectation" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Affectation
          </a>
          <a routerLink="/dashboard/is" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            IS
          </a>
          <a routerLink="/dashboard/ia" routerLinkActive="bg-purple-50 text-purple-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1">
            <span class="text-xs">✦</span> Assistant IA
          </a>
        </nav>

        <div class="flex items-center gap-3 text-sm">
          <span class="text-gray-500">{{ user()?.nomEntreprise }}</span>
          <a routerLink="/dashboard/profile"
             class="font-medium text-gray-800 hover:text-blue-600 transition">
            {{ user()?.nom }}
          </a>
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                [class]="roleClass()">
            {{ user()?.role }}
          </span>
          <button (click)="logout()"
                  class="text-gray-400 hover:text-red-600 transition text-xs">
            Déconnexion
          </button>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 overflow-auto">
        <router-outlet />
      </main>
    </div>
  `
})
export class LayoutComponent implements OnInit {

  constructor(private auth: AuthService, readonly alerteSvc: AlerteService) {}

  user = this.auth.user;

  ngOnInit() { this.alerteSvc.charger(); }

  roleClass(): string {
    const role = this.user()?.role;
    if (role === 'ADMIN')     return 'bg-red-100 text-red-700';
    if (role === 'COMPTABLE') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  logout() { this.auth.logout(); }
}
