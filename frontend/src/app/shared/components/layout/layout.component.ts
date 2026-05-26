import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AlerteService } from '../../../core/services/alerte.service';
import { SseNotificationService } from '../../../core/services/sse-notification.service';
import { LicenceService } from '../../../core/services/licence.service';

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
          @if (licenceSvc.hasModule('COMPTABILITE')) {
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
            <a routerLink="/dashboard/lettrage" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Lettrage
            </a>
            <a routerLink="/dashboard/analytique" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Analytique
            </a>
            <a routerLink="/dashboard/affectation" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Affectation
            </a>
            <a routerLink="/dashboard/balance-agee" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Balance âgée
            </a>
            <a routerLink="/dashboard/regularisations" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Régularisations
            </a>
            <a routerLink="/dashboard/devises" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Devises
            </a>
            <a routerLink="/dashboard/modeles" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Modèles
            </a>
          }
          @if (licenceSvc.hasModule('TIERS')) {
            <a routerLink="/dashboard/tiers" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Tiers
            </a>
          }
          @if (licenceSvc.hasModule('IMMOBILISATIONS')) {
            <a routerLink="/dashboard/immobilisations" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Immobilisations
            </a>
            <a routerLink="/dashboard/stocks" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Stocks
            </a>
          }
          @if (licenceSvc.hasModule('FISCAL')) {
            <a routerLink="/dashboard/tva" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              TVA
            </a>
            <a routerLink="/dashboard/is" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              IS
            </a>
            <a routerLink="/dashboard/gestion-fiscale" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Fiscal
            </a>
            <a routerLink="/dashboard/notes-annexes-fiscales" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Notes annexes
            </a>
            <a routerLink="/dashboard/liasse-fiscale" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Liasse fiscale
            </a>
          }
          @if (licenceSvc.hasModule('BUDGET')) {
            <a routerLink="/dashboard/budget" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Budget
            </a>
          }
          @if (licenceSvc.hasModule('TRESORERIE')) {
            <a routerLink="/dashboard/rapprochement" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Rapprochement
            </a>
            <a routerLink="/dashboard/previsions-tresorerie" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Trésorerie
            </a>
          }
          @if (licenceSvc.hasModule('FACTURATION')) {
            <a routerLink="/dashboard/facturation" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Facturation
            </a>
            <a routerLink="/dashboard/devis" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Devis
            </a>
            <a routerLink="/dashboard/relances" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Relances
            </a>
          }
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
          @if (licenceSvc.hasModule('EXPORT')) {
            <a routerLink="/dashboard/export" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Export
            </a>
            <a routerLink="/dashboard/import-fec" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Import FEC
            </a>
          }
          @if (licenceSvc.hasModule('DOCUMENTS')) {
            <a routerLink="/dashboard/documents" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              GED
            </a>
          }
          @if (licenceSvc.hasModule('PILOTAGE')) {
            <a routerLink="/dashboard/ratios" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Ratios
            </a>
            <a routerLink="/dashboard/pilotage" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Pilotage
            </a>
            <a routerLink="/dashboard/kpi-executif" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              KPI
            </a>
            <a routerLink="/dashboard/reporting" routerLinkActive="bg-emerald-50 text-emerald-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Reporting
            </a>
          }
          @if (licenceSvc.hasModule('PAIE_RH')) {
            <a routerLink="/dashboard/paie" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Paie
            </a>
            <a routerLink="/dashboard/budget-rh" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Budget RH
            </a>
            <a routerLink="/dashboard/notes-frais" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Notes de frais
            </a>
            <a routerLink="/dashboard/conges" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Congés
            </a>
            <a routerLink="/dashboard/evaluations" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Évaluations
            </a>
            <a routerLink="/dashboard/gestion-sociale" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Social
            </a>
            <a routerLink="/dashboard/formation" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Formation
            </a>
            <a routerLink="/dashboard/discipline" routerLinkActive="bg-red-50 text-red-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Discipline
            </a>
            <a routerLink="/dashboard/dashboard-rh" routerLinkActive="bg-teal-50 text-teal-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Tableau RH
            </a>
            <a routerLink="/dashboard/temps-presences" routerLinkActive="bg-cyan-50 text-cyan-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Temps & Présences
            </a>
            <a routerLink="/dashboard/recrutement" routerLinkActive="bg-indigo-50 text-indigo-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Recrutement
            </a>
            <a routerLink="/dashboard/prets" routerLinkActive="bg-violet-50 text-violet-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Prêts & Avances
            </a>
            <a routerLink="/dashboard/mon-espace" routerLinkActive="bg-sky-50 text-sky-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Mon espace
            </a>
            <a routerLink="/dashboard/documents-rh" routerLinkActive="bg-rose-50 text-rose-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Documents RH
            </a>
          }
          @if (licenceSvc.hasModule('CRM')) {
            <a routerLink="/dashboard/crm" routerLinkActive="bg-violet-50 text-violet-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              CRM
            </a>
          }
          @if (user()?.role === 'ADMIN') {
            <a routerLink="/dashboard/approbations" routerLinkActive="bg-orange-50 text-orange-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Approbations
            </a>
            <a routerLink="/dashboard/parametres" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Paramètres
            </a>
            @if (licenceSvc.hasModule('AUDIT')) {
              <a routerLink="/dashboard/audit" routerLinkActive="bg-blue-50 text-blue-700"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                Audit
              </a>
            }
            @if (licenceSvc.hasModule('CONSOLIDATION')) {
              <a routerLink="/dashboard/consolidation" routerLinkActive="bg-blue-50 text-blue-700"
                 class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                Consolidation
              </a>
            }
            <a routerLink="/dashboard/utilisateurs" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Utilisateurs
            </a>
            <a routerLink="/dashboard/admin" routerLinkActive="bg-red-50 text-red-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Administration
            </a>
            <a routerLink="/dashboard/commercial" routerLinkActive="bg-emerald-50 text-emerald-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              <i class="bi bi-briefcase"></i> Gestion Commerciale
            </a>
          }
          @if (licenceSvc.hasModule('GOUVERNANCE')) {
            <a routerLink="/dashboard/gouvernance" routerLinkActive="bg-blue-50 text-blue-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Gouvernance
            </a>
          }
          @if (licenceSvc.hasModule('ASSURANCE') && user()?.typeEntite === 'ASSURANCE') {
            <a routerLink="/dashboard/provisions-techniques" routerLinkActive="bg-indigo-50 text-indigo-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Provisions CIMA
            </a>
            <a routerLink="/dashboard/etats-assurance" routerLinkActive="bg-indigo-50 text-indigo-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              États CIMA
            </a>
          }
          @if (licenceSvc.hasModule('MICROFINANCE') && user()?.typeEntite === 'MICROFINANCE') {
            <a routerLink="/dashboard/portefeuille-sfd" routerLinkActive="bg-teal-50 text-teal-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Portefeuille SFD
            </a>
            <a routerLink="/dashboard/etats-sfd" routerLinkActive="bg-teal-50 text-teal-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              États SFD
            </a>
          }
          @if (licenceSvc.hasModule('FINANCE_ISLAMIQUE') && user()?.typeEntite === 'FINANCE_ISLAMIQUE') {
            <a routerLink="/dashboard/finance-islamique" routerLinkActive="bg-emerald-50 text-emerald-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Finance Islamique
            </a>
          }
          @if (licenceSvc.hasModule('ASSURANCE') && user()?.typeEntite === 'ASSOCIATION') {
            <a routerLink="/dashboard/documents-reglementaires" routerLinkActive="bg-purple-50 text-purple-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
              Docs réglementaires
            </a>
          }
          <a routerLink="/dashboard/abonnements" routerLinkActive="bg-blue-50 text-blue-700"
             class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
            Abonnements
          </a>
          @if (licenceSvc.hasModule('IA')) {
            <a routerLink="/dashboard/ia" routerLinkActive="bg-purple-50 text-purple-700"
               class="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 flex items-center gap-1">
              <span class="text-xs">✦</span> Assistant IA
            </a>
          }
        </nav>

        <!-- Right side: user info + notification bell -->
        <div class="flex items-center gap-3 text-sm shrink-0">
          <span class="text-gray-500">{{ user()?.nomEntreprise }}</span>
          <a routerLink="/dashboard/profile"
             class="font-medium text-gray-800 hover:text-blue-600 transition">
            {{ user()?.nom }}
          </a>
          <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                [class]="roleClass()">
            {{ user()?.role }}
          </span>

          <!-- Notification bell -->
          <div class="relative">
            <button (click)="toggleNotifPanel($event)"
                    class="relative p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              @if (sseSvc.unread() > 0) {
                <span class="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full text-xs font-bold"
                      [ngClass]="hasNotifDanger() ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'">
                  {{ sseSvc.unread() }}
                </span>
              }
            </button>

            <!-- Notification dropdown -->
            @if (notifPanelOpen) {
              <div class="absolute right-0 top-9 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                   (click)="$event.stopPropagation()">
                <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                  <span class="text-sm font-semibold text-gray-800">Notifications temps réel</span>
                  @if (sseSvc.unread() > 0) {
                    <button (click)="sseSvc.markAllRead()"
                            class="text-xs text-blue-600 hover:text-blue-800">
                      Tout marquer lu
                    </button>
                  }
                </div>

                @if (sseSvc.notifications().length === 0) {
                  <p class="text-sm text-gray-400 text-center py-6">Aucune notification</p>
                } @else {
                  <div class="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    @for (n of sseSvc.notifications(); track n.timestamp) {
                      @if (n.type !== 'HEARTBEAT' && n.type !== 'CONNECTED') {
                        <div class="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition"
                             [ngClass]="n.read ? 'opacity-60' : ''"
                             (click)="sseSvc.navigate(n.link); notifPanelOpen = false; sseSvc.markAllRead()">
                          <span class="mt-0.5 w-2 h-2 rounded-full shrink-0"
                                [ngClass]="severityDot(n.severity)"></span>
                          <div class="flex-1 min-w-0">
                            <p class="text-xs font-medium text-gray-800 truncate">{{ n.message }}</p>
                            <p class="text-xs text-gray-400 mt-0.5">{{ n.timestamp | date:'HH:mm:ss' }}</p>
                          </div>
                          @if (!n.read) {
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></span>
                          }
                        </div>
                      }
                    }
                  </div>
                }
              </div>
            }
          </div>

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
export class LayoutComponent implements OnInit, OnDestroy {

  constructor(
    private auth: AuthService,
    readonly alerteSvc: AlerteService,
    readonly sseSvc: SseNotificationService,
    readonly licenceSvc: LicenceService
  ) {}

  user = this.auth.user;
  notifPanelOpen = false;

  ngOnInit() {
    this.alerteSvc.charger();
    this.sseSvc.connect();
    this.licenceSvc.load().subscribe();
  }

  ngOnDestroy() { this.sseSvc.disconnect(); }

  @HostListener('document:click')
  onDocumentClick() { this.notifPanelOpen = false; }

  toggleNotifPanel(event: MouseEvent) {
    event.stopPropagation();
    this.notifPanelOpen = !this.notifPanelOpen;
  }

  hasNotifDanger(): boolean {
    return this.sseSvc.notifications().some(n => n.severity === 'DANGER' && !n.read);
  }

  severityDot(severity: string): string {
    if (severity === 'DANGER')  return 'bg-red-500';
    if (severity === 'WARNING') return 'bg-orange-400';
    return 'bg-blue-400';
  }

  roleClass(): string {
    const role = this.user()?.role;
    if (role === 'ADMIN')     return 'bg-red-100 text-red-700';
    if (role === 'COMPTABLE') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  logout() {
    this.sseSvc.disconnect();
    this.auth.logout();
  }
}
