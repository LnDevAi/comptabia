import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

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
export class LayoutComponent {

  constructor(private auth: AuthService) {}

  user = this.auth.user;

  roleClass(): string {
    const role = this.user()?.role;
    if (role === 'ADMIN')     return 'bg-red-100 text-red-700';
    if (role === 'COMPTABLE') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  logout() { this.auth.logout(); }
}
