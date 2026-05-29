import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { AlerteService } from '../../../core/services/alerte.service';
import { SseNotificationService } from '../../../core/services/sse-notification.service';
import { LicenceService } from '../../../core/services/licence.service';
import { LanguageService, Lang } from '../../../core/services/language.service';
import { LoadingBarComponent } from '../loading-bar/loading-bar.component';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LoadingBarComponent, ToastComponent, TranslateModule],
  template: `
    <div class="min-h-screen flex bg-gray-50">
      <app-loading-bar />

      <!-- Sidebar -->
      <aside class="fixed inset-y-0 left-0 w-56 bg-white border-r border-gray-200 flex flex-col z-30">
        <div class="h-14 flex items-center px-5 border-b border-gray-100 shrink-0">
          <span class="font-bold text-blue-700 text-lg">ComptaBIA</span>
        </div>

        <nav class="flex-1 overflow-y-auto py-2 px-2">
          <a routerLink="/dashboard" routerLinkActive="bg-blue-50 !text-blue-700"
             [routerLinkActiveOptions]="{exact:true}"
             class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            {{ 'nav.dashboard' | translate }}
          </a>

          @if (licenceSvc.hasModule('COMPTABILITE')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.accounting' | translate }}</p>
            <a routerLink="/dashboard/plan-comptes" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.chart_of_accounts' | translate }}
            </a>
            <a routerLink="/dashboard/ecritures" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.entries' | translate }}
            </a>
            <a routerLink="/dashboard/etats" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.financial_statements' | translate }}
            </a>
            <a routerLink="/dashboard/exercices" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.fiscal_years' | translate }}
            </a>
            <a routerLink="/dashboard/lettrage" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.lettering' | translate }}
            </a>
            <a routerLink="/dashboard/analytique" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.analytics' | translate }}
            </a>
            <a routerLink="/dashboard/affectation" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.allocation' | translate }}
            </a>
            <a routerLink="/dashboard/balance-agee" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.aged_balance' | translate }}
            </a>
            <a routerLink="/dashboard/regularisations" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.accruals' | translate }}
            </a>
            <a routerLink="/dashboard/devises" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.currencies' | translate }}
            </a>
            <a routerLink="/dashboard/modeles" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.accounting.templates' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('TIERS')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.parties' | translate }}</p>
            <a routerLink="/dashboard/tiers" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.parties.parties' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('IMMOBILISATIONS')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.assets' | translate }}</p>
            <a routerLink="/dashboard/immobilisations" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.assets.fixed_assets' | translate }}
            </a>
            <a routerLink="/dashboard/stocks" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.assets.inventory' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('FISCAL')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.tax' | translate }}</p>
            <a routerLink="/dashboard/tva" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.tax.vat' | translate }}
            </a>
            <a routerLink="/dashboard/is" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.tax.corporate_tax' | translate }}
            </a>
            <a routerLink="/dashboard/gestion-fiscale" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.tax.fiscal' | translate }}
            </a>
            <a routerLink="/dashboard/notes-annexes-fiscales" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.tax.tax_notes' | translate }}
            </a>
            <a routerLink="/dashboard/liasse-fiscale" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.tax.tax_return' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('BUDGET')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.budget' | translate }}</p>
            <a routerLink="/dashboard/budget" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.budget.budget' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('TRESORERIE')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.treasury' | translate }}</p>
            <a routerLink="/dashboard/tresorerie-avancee" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.treasury.treasury' | translate }}
            </a>
            <a routerLink="/dashboard/rapprochement" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.treasury.reconciliation' | translate }}
            </a>
            <a routerLink="/dashboard/previsions-tresorerie" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.treasury.forecasts' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('FACTURATION')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.invoicing' | translate }}</p>
            <a routerLink="/dashboard/facturation" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.invoicing.invoicing' | translate }}
            </a>
            <a routerLink="/dashboard/devis" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.invoicing.quotes' | translate }}
            </a>
            <a routerLink="/dashboard/relances" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.invoicing.reminders' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('PAIE_RH')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.payroll' | translate }}</p>
            <a routerLink="/dashboard/paie" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.payroll' | translate }}
            </a>
            <a routerLink="/dashboard/budget-rh" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.hr_budget' | translate }}
            </a>
            <a routerLink="/dashboard/notes-frais" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.expenses' | translate }}
            </a>
            <a routerLink="/dashboard/conges" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.leave' | translate }}
            </a>
            <a routerLink="/dashboard/evaluations" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.evaluations' | translate }}
            </a>
            <a routerLink="/dashboard/gestion-sociale" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.social' | translate }}
            </a>
            <a routerLink="/dashboard/formation" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.training' | translate }}
            </a>
            <a routerLink="/dashboard/discipline" routerLinkActive="bg-red-50 !text-red-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.discipline' | translate }}
            </a>
            <a routerLink="/dashboard/dashboard-rh" routerLinkActive="bg-teal-50 !text-teal-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.hr_dashboard' | translate }}
            </a>
            <a routerLink="/dashboard/temps-presences" routerLinkActive="bg-cyan-50 !text-cyan-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.attendance' | translate }}
            </a>
            <a routerLink="/dashboard/recrutement" routerLinkActive="bg-indigo-50 !text-indigo-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.recruitment' | translate }}
            </a>
            <a routerLink="/dashboard/prets" routerLinkActive="bg-violet-50 !text-violet-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.loans' | translate }}
            </a>
            <a routerLink="/dashboard/mon-espace" routerLinkActive="bg-sky-50 !text-sky-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.my_space' | translate }}
            </a>
            <a routerLink="/dashboard/documents-rh" routerLinkActive="bg-rose-50 !text-rose-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.payroll.hr_documents' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('CRM')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.crm' | translate }}</p>
            <a routerLink="/dashboard/crm" routerLinkActive="bg-violet-50 !text-violet-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.crm.crm' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('PILOTAGE')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.steering' | translate }}</p>
            <a routerLink="/dashboard/ratios" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.steering.ratios' | translate }}
            </a>
            <a routerLink="/dashboard/pilotage" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.steering.steering' | translate }}
            </a>
            <a routerLink="/dashboard/kpi-executif" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.steering.kpi' | translate }}
            </a>
            <a routerLink="/dashboard/reporting" routerLinkActive="bg-emerald-50 !text-emerald-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.steering.reporting' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('DOCUMENTS')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.documents' | translate }}</p>
            <a routerLink="/dashboard/documents" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.documents.ged' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('EXPORT')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.import_export' | translate }}</p>
            <a routerLink="/dashboard/export" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.import_export.export' | translate }}
            </a>
            <a routerLink="/dashboard/import-fec" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.import_export.import_fec' | translate }}
            </a>
            <a routerLink="/dashboard/migration" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.import_export.migration' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('GOUVERNANCE')) {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.governance' | translate }}</p>
            <a routerLink="/dashboard/gouvernance" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.governance.governance' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('ASSURANCE') && user()?.typeEntite === 'ASSURANCE') {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.insurance' | translate }}</p>
            <a routerLink="/dashboard/provisions-techniques" routerLinkActive="bg-indigo-50 !text-indigo-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.insurance.technical_provisions' | translate }}
            </a>
            <a routerLink="/dashboard/etats-assurance" routerLinkActive="bg-indigo-50 !text-indigo-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.insurance.insurance_statements' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('MICROFINANCE') && user()?.typeEntite === 'MICROFINANCE') {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.microfinance' | translate }}</p>
            <a routerLink="/dashboard/portefeuille-sfd" routerLinkActive="bg-teal-50 !text-teal-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.microfinance.portfolio' | translate }}
            </a>
            <a routerLink="/dashboard/etats-sfd" routerLinkActive="bg-teal-50 !text-teal-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.microfinance.sfd_statements' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('FINANCE_ISLAMIQUE') && user()?.typeEntite === 'FINANCE_ISLAMIQUE') {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.islamic' | translate }}</p>
            <a routerLink="/dashboard/finance-islamique" routerLinkActive="bg-emerald-50 !text-emerald-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.islamic.islamic_finance' | translate }}
            </a>
          }

          @if (licenceSvc.hasModule('ASSURANCE') && user()?.typeEntite === 'ASSOCIATION') {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.association' | translate }}</p>
            <a routerLink="/dashboard/documents-reglementaires" routerLinkActive="bg-purple-50 !text-purple-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.association.regulatory_docs' | translate }}
            </a>
          }

          <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.platform' | translate }}</p>
          <a routerLink="/dashboard/alertes" routerLinkActive="bg-red-50 !text-red-700"
             class="relative flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            {{ 'nav.platform.alerts' | translate }}
            @if (alerteSvc.total > 0) {
              <span class="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold"
                    [ngClass]="(alerteSvc.alertes()?.countDanger ?? 0) > 0 ? 'bg-red-500 text-white' : 'bg-orange-400 text-white'">
                {{ alerteSvc.total }}
              </span>
            }
          </a>
          <a routerLink="/dashboard/abonnements" routerLinkActive="bg-blue-50 !text-blue-700"
             class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            {{ 'nav.platform.subscriptions' | translate }}
          </a>
          <a routerLink="/dashboard/academie" routerLinkActive="bg-indigo-50 !text-indigo-700"
             class="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
            <span class="text-xs">✦</span> {{ 'nav.platform.academy' | translate }}
          </a>
          @if (licenceSvc.hasModule('IA')) {
            <a routerLink="/dashboard/ia" routerLinkActive="bg-purple-50 !text-purple-700"
               class="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              <span class="text-xs">✦</span> {{ 'nav.platform.ai_assistant' | translate }}
            </a>
          }

          @if (user()?.role === 'ADMIN') {
            <p class="mt-4 mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{{ 'nav.sections.admin' | translate }}</p>
            <a routerLink="/dashboard/approbations" routerLinkActive="bg-orange-50 !text-orange-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.admin.approvals' | translate }}
            </a>
            @if (licenceSvc.hasModule('AUDIT')) {
              <a routerLink="/dashboard/audit" routerLinkActive="bg-blue-50 !text-blue-700"
                 class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                {{ 'nav.admin.audit' | translate }}
              </a>
            }
            <a routerLink="/dashboard/notifications" routerLinkActive="bg-blue-50 !text-blue-700"
               class="relative flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.admin.notifications' | translate }}
              @if (sseSvc.unread() > 0) {
                <span class="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                  {{ sseSvc.unread() > 9 ? '9+' : sseSvc.unread() }}
                </span>
              }
            </a>
            @if (licenceSvc.hasModule('CONSOLIDATION')) {
              <a routerLink="/dashboard/consolidation" routerLinkActive="bg-blue-50 !text-blue-700"
                 class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                {{ 'nav.admin.consolidation' | translate }}
              </a>
            }
            <a routerLink="/dashboard/utilisateurs" routerLinkActive="bg-blue-50 !text-blue-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.admin.users' | translate }}
            </a>
            <a routerLink="/dashboard/admin" routerLinkActive="bg-red-50 !text-red-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.admin.administration' | translate }}
            </a>
            <a routerLink="/dashboard/commercial" routerLinkActive="bg-emerald-50 !text-emerald-700"
               class="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
              {{ 'nav.admin.commercial' | translate }}
            </a>
          }

          <div class="h-4"></div>
        </nav>
      </aside>

      <!-- Right area -->
      <div class="ml-56 flex-1 flex flex-col min-h-screen">

        <!-- Topbar -->
        <header class="sticky top-0 z-20 h-14 bg-white border-b border-gray-200 flex items-center px-6 gap-3 shrink-0">
          <div class="flex-1"></div>

          <!-- Language switcher -->
          <button (click)="langSvc.toggle()"
                  class="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                  [title]="langSvc.current() === 'fr' ? 'Switch to English' : 'Passer en français'">
            {{ langSvc.current() === 'fr' ? 'EN' : 'FR' }}
          </button>

          <!-- Help -->
          <a routerLink="/aide"
             class="p-1.5 rounded-lg hover:bg-gray-100 transition text-gray-400 hover:text-emerald-600"
             [title]="'topbar.help' | translate">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </a>

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
            @if (notifPanelOpen) {
              <div class="absolute right-0 top-9 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                   (click)="$event.stopPropagation()">
                <div class="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
                  <span class="text-sm font-semibold text-gray-800">{{ 'topbar.notifications.title' | translate }}</span>
                  @if (sseSvc.unread() > 0) {
                    <button (click)="sseSvc.markAllRead()"
                            class="text-xs text-blue-600 hover:text-blue-800">
                      {{ 'topbar.notifications.mark_all_read' | translate }}
                    </button>
                  }
                </div>
                @if (sseSvc.notifications().length === 0) {
                  <p class="text-sm text-gray-400 text-center py-6">{{ 'topbar.notifications.empty' | translate }}</p>
                } @else {
                  <div class="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    @for (n of sseSvc.notifications(); track n.timestamp) {
                      @if (n.type !== 'HEARTBEAT' && n.type !== 'CONNECTED') {
                        <div class="flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer transition"
                             [ngClass]="n.read ? 'opacity-60' : ''"
                             (click)="sseSvc.navigate(n.link); notifPanelOpen = false; sseSvc.markAllRead()">
                          <span class="mt-0.5 w-2 h-2 rounded-full shrink-0" [ngClass]="severityDot(n.severity)"></span>
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

          <!-- User menu -->
          <div class="relative">
            <button (click)="toggleUserMenu($event)"
                    class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
              <span class="text-sm font-medium text-gray-800">{{ user()?.nom }}</span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [class]="roleClass()">
                {{ user()?.role }}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            @if (userMenuOpen) {
              <div class="absolute right-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50"
                   (click)="$event.stopPropagation()">
                <div class="px-4 py-3 border-b border-gray-100">
                  <p class="text-sm font-semibold text-gray-800">{{ user()?.nom }}</p>
                  <p class="text-xs text-gray-400 truncate">{{ user()?.nomEntreprise }}</p>
                </div>
                <div class="py-1">
                  <a routerLink="/dashboard/profile" (click)="userMenuOpen = false"
                     class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                    {{ 'topbar.user_menu.my_profile' | translate }}
                  </a>
                  @if (user()?.role === 'ADMIN') {
                    <a routerLink="/dashboard/parametres" (click)="userMenuOpen = false"
                       class="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      {{ 'topbar.user_menu.account_settings' | translate }}
                    </a>
                  }
                </div>
                <div class="border-t border-gray-100 py-1">
                  <button (click)="logout()"
                          class="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    {{ 'topbar.user_menu.logout' | translate }}
                  </button>
                </div>
              </div>
            }
          </div>
        </header>

        <!-- Content -->
        <main class="flex-1 overflow-auto">
          <router-outlet />
        </main>

        <!-- Footer -->
        <footer class="border-t border-gray-200 bg-white py-3 px-6">
          <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
            <span>© {{ currentYear }} L'N EXPERTISE</span>
            <a routerLink="/produit" class="hover:text-emerald-600 transition-colors">À propos</a>
            <a routerLink="/aide" class="hover:text-emerald-600 transition-colors">Centre d'aide</a>
            <a routerLink="/tech" class="hover:text-emerald-600 transition-colors">Documentation technique</a>
            <a routerLink="/legal/mentions-legales" class="hover:text-emerald-600 transition-colors">Mentions légales</a>
            <a routerLink="/legal/cgu" class="hover:text-emerald-600 transition-colors">CGU</a>
            <a routerLink="/legal/cgv" class="hover:text-emerald-600 transition-colors">CGV</a>
            <a routerLink="/legal/confidentialite" class="hover:text-emerald-600 transition-colors">Confidentialité</a>
          </div>
        </footer>
      </div>

      <app-toast />
    </div>
  `
})
export class LayoutComponent implements OnInit, OnDestroy {

  constructor(
    private auth: AuthService,
    readonly alerteSvc: AlerteService,
    readonly sseSvc: SseNotificationService,
    readonly licenceSvc: LicenceService,
    readonly langSvc: LanguageService,
  ) {}

  user = this.auth.user;
  notifPanelOpen = false;
  userMenuOpen = false;
  readonly currentYear = new Date().getFullYear();

  ngOnInit() {
    this.langSvc.init();
    this.alerteSvc.charger();
    this.sseSvc.connect();
    this.licenceSvc.load().subscribe();
  }

  ngOnDestroy() { this.sseSvc.disconnect(); }

  @HostListener('document:click')
  onDocumentClick() {
    this.notifPanelOpen = false;
    this.userMenuOpen = false;
  }

  toggleNotifPanel(event: MouseEvent) {
    event.stopPropagation();
    this.userMenuOpen = false;
    this.notifPanelOpen = !this.notifPanelOpen;
  }

  toggleUserMenu(event: MouseEvent) {
    event.stopPropagation();
    this.notifPanelOpen = false;
    this.userMenuOpen = !this.userMenuOpen;
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
