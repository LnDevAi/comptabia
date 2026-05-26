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
      },
      {
        path: 'accept-invite',
        loadComponent: () =>
          import('./features/auth/accept-invite/accept-invite.component').then(m => m.AcceptInviteComponent)
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
        path: 'budget-rh',
        loadComponent: () =>
          import('./features/budget-rh/budget-rh.component').then(m => m.BudgetRhComponent)
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
        path: 'utilisateurs',
        loadComponent: () =>
          import('./features/utilisateurs-admin/utilisateurs-admin.component').then(m => m.UtilisateursAdminComponent)
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
      },
      {
        path: 'audit',
        loadComponent: () =>
          import('./features/audit/audit.component').then(m => m.AuditComponent)
      },
      {
        path: 'modeles',
        loadComponent: () =>
          import('./features/modeles/modeles.component').then(m => m.ModelesComponent)
      },
      {
        path: 'import-fec',
        loadComponent: () =>
          import('./features/import-fec/import-fec.component').then(m => m.ImportFecComponent)
      },
      {
        path: 'balance-agee',
        loadComponent: () =>
          import('./features/balance-agee/balance-agee.component').then(m => m.BalanceAgeeComponent)
      },
      {
        path: 'paie',
        loadComponent: () =>
          import('./features/paie/paie.component').then(m => m.PayeComponent)
      },
      {
        path: 'ratios',
        loadComponent: () =>
          import('./features/ratios/ratios.component').then(m => m.RatiosComponent)
      },
      {
        path: 'pilotage',
        loadComponent: () =>
          import('./features/pilotage/pilotage.component').then(m => m.PilotageComponent)
      },
      {
        path: 'facturation',
        loadComponent: () =>
          import('./features/facturation/facturation.component').then(m => m.FacturationComponent)
      },
      {
        path: 'devis',
        loadComponent: () =>
          import('./features/devis/devis.component').then(m => m.DevisComponent)
      },
      {
        path: 'previsions-tresorerie',
        loadComponent: () =>
          import('./features/previsions-tresorerie/previsions-tresorerie.component').then(m => m.PrevisionsTresorerieComponent)
      },
      {
        path: 'consolidation',
        loadComponent: () =>
          import('./features/consolidation/consolidation.component').then(m => m.ConsolidationComponent)
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/documents/documents.component').then(m => m.DocumentsComponent)
      },
      {
        path: 'kpi-executif',
        loadComponent: () =>
          import('./features/kpi-executif/kpi-executif.component').then(m => m.KpiExecutifComponent)
      },
      {
        path: 'abonnements',
        loadComponent: () =>
          import('./features/abonnements/abonnements.component').then(m => m.AbonnementsComponent)
      },
      {
        path: 'approbations',
        loadComponent: () =>
          import('./features/approbations/approbations.component').then(m => m.ApprobationsComponent)
      },
      {
        path: 'devises',
        loadComponent: () =>
          import('./features/devises/devises.component').then(m => m.DevisesComponent)
      },
      {
        path: 'regularisations',
        loadComponent: () =>
          import('./features/regularisations/regularisations.component').then(m => m.RegularisationsComponent)
      },
      {
        path: 'notes-frais',
        loadComponent: () =>
          import('./features/notes-frais/notes-frais.component').then(m => m.NotesFraisComponent)
      },
      {
        path: 'conges',
        loadComponent: () =>
          import('./features/conges/conges.component').then(m => m.CongesComponent)
      },
      {
        path: 'evaluations',
        loadComponent: () =>
          import('./features/evaluations/evaluations.component').then(m => m.EvaluationsComponent)
      },
      {
        path: 'gestion-fiscale',
        loadComponent: () =>
          import('./features/gestion-fiscale/gestion-fiscale.component').then(m => m.GestionFiscaleComponent)
      },
      {
        path: 'gestion-sociale',
        loadComponent: () =>
          import('./features/gestion-sociale/gestion-sociale.component').then(m => m.GestionSocialeComponent)
      },
      {
        path: 'notes-annexes-fiscales',
        loadComponent: () =>
          import('./features/notes-annexes-fiscales/notes-annexes-fiscales.component').then(m => m.NotesAnnexesFiscalesComponent)
      },
      {
        path: 'formation',
        loadComponent: () =>
          import('./features/formation/formation.component').then(m => m.FormationComponent)
      },
      {
        path: 'discipline',
        loadComponent: () =>
          import('./features/discipline/discipline.component').then(m => m.DisciplineComponent)
      },
      {
        path: 'dashboard-rh',
        loadComponent: () =>
          import('./features/dashboard-rh/dashboard-rh.component').then(m => m.DashboardRhComponent)
      },
      {
        path: 'temps-presences',
        loadComponent: () =>
          import('./features/temps-presences/temps-presences.component').then(m => m.TempsPresencesComponent)
      },
      {
        path: 'recrutement',
        loadComponent: () =>
          import('./features/recrutement/recrutement.component').then(m => m.RecrutementComponent)
      },
      {
        path: 'prets',
        loadComponent: () =>
          import('./features/prets/prets.component').then(m => m.PretsComponent)
      },
      {
        path: 'mon-espace',
        loadComponent: () =>
          import('./features/portail-collaborateur/portail-collaborateur.component').then(m => m.PortailCollaborateurComponent)
      },
      {
        path: 'documents-rh',
        loadComponent: () =>
          import('./features/documents-rh/documents-rh.component').then(m => m.DocumentsRhComponent)
      },
      {
        path: 'reporting',
        loadComponent: () =>
          import('./features/reporting/reporting.component').then(m => m.ReportingComponent)
      },
      {
        path: 'pilotage-global',
        loadComponent: () =>
          import('./features/pilotage-global/pilotage-global.component').then(m => m.PilotageGlobalComponent)
      },
      {
        path: 'liasse-fiscale',
        loadComponent: () =>
          import('./features/liasse-fiscale/liasse-fiscale.component').then(m => m.LiasseFiscaleComponent)
      },
      {
        path: 'documents-reglementaires',
        loadComponent: () =>
          import('./features/documents-reglementaires/documents-reglementaires.component').then(m => m.DocumentsReglementairesComponent)
      },
      {
        path: 'provisions-techniques',
        loadComponent: () =>
          import('./features/provisions-techniques/provisions-techniques.component').then(m => m.ProvisionsTechniquesComponent)
      },
      {
        path: 'etats-assurance',
        loadComponent: () =>
          import('./features/etats-assurance/etats-assurance.component').then(m => m.EtatsAssuranceComponent)
      },
      {
        path: 'portefeuille-sfd',
        loadComponent: () =>
          import('./features/portefeuille-sfd/portefeuille-sfd.component').then(m => m.PortefeuilleSfdComponent)
      },
      {
        path: 'etats-sfd',
        loadComponent: () =>
          import('./features/etats-sfd/etats-sfd.component').then(m => m.EtatsSfdComponent)
      },
      {
        path: 'gouvernance',
        loadComponent: () =>
          import('./features/gouvernance/gouvernance.component').then(m => m.GouvernanceComponent)
      },
      {
        path: 'finance-islamique',
        loadComponent: () =>
          import('./features/finance-islamique/finance-islamique.component').then(m => m.FinanceIslamiqueComponent)
      }
    ]
  },
  {
    path: 'portail/:entrepriseId',
    loadComponent: () =>
      import('./features/client-portail/client-portail.component').then(m => m.ClientPortailComponent)
  },
  {
    path: 'portail-associe/:token',
    loadComponent: () =>
      import('./features/portail-associe/portail-associe.component').then(m => m.PortailAssocieComponent)
  },
  { path: '**', redirectTo: '/dashboard' }
];
