import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'plan-comptes',
        loadComponent: () =>
          import('./features/plan-comptes/plan-comptes.component').then(m => m.PlanComptesComponent)
      },
      {
        path: 'ecritures',
        loadComponent: () =>
          import('./features/ecritures/ecritures.component').then(m => m.EcrituresComponent)
      },
      {
        path: 'admin',
        loadComponent: () =>
          import('./features/admin/admin.component').then(m => m.AdminComponent)
      },
      {
        path: 'ia',
        loadComponent: () =>
          import('./features/ia/ia.component').then(m => m.IaComponent)
      },
      {
        path: 'etats',
        loadComponent: () =>
          import('./features/etats/etats.component').then(m => m.EtatsComponent)
      },
      {
        path: 'exercices',
        loadComponent: () =>
          import('./features/exercices/exercices.component').then(m => m.ExercicesComponent)
      },
      {
        path: 'tiers',
        loadComponent: () =>
          import('./features/tiers/tiers.component').then(m => m.TiersComponent)
      },
      {
        path: 'immobilisations',
        loadComponent: () =>
          import('./features/immobilisations/immobilisations.component').then(m => m.ImmobilisationsComponent)
      },
      {
        path: 'budget',
        loadComponent: () =>
          import('./features/budget/budget.component').then(m => m.BudgetComponent)
      },
      {
        path: 'rapprochement',
        loadComponent: () =>
          import('./features/rapprochement/rapprochement.component').then(m => m.RapprochementComponent)
      },
      {
        path: 'tva',
        loadComponent: () =>
          import('./features/tva/tva.component').then(m => m.TvaComponent)
      },
      {
        path: 'lettrage',
        loadComponent: () =>
          import('./features/lettrage/lettrage.component').then(m => m.LettrageComponent)
      },
      {
        path: 'analytique',
        loadComponent: () =>
          import('./features/analytique/analytique.component').then(m => m.AnalytiqueComponent)
      },
      {
        path: 'relances',
        loadComponent: () =>
          import('./features/relances/relances.component').then(m => m.RelancesComponent)
      },
      {
        path: 'alertes',
        loadComponent: () =>
          import('./features/alertes/alertes.component').then(m => m.AlertesComponent)
      },
      {
        path: 'export',
        loadComponent: () =>
          import('./features/export/export.component').then(m => m.ExportComponent)
      },
      {
        path: 'parametres',
        loadComponent: () =>
          import('./features/parametres/parametres.component').then(m => m.ParametresComponent)
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'affectation',
        loadComponent: () =>
          import('./features/affectation/affectation.component').then(m => m.AffectationComponent)
      },
      {
        path: 'is',
        loadComponent: () =>
          import('./features/declaration-is/declaration-is.component').then(m => m.DeclarationIsComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
