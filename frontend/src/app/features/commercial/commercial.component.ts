import {
  Component, OnInit, ChangeDetectionStrategy, signal, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommercialService } from '../../core/services/commercial.service';
import {
  DashboardCommercial, PlanResponse, PlanRequest,
  AbonnementResponse, AbonnementRequest,
  FactureResponse, FactureRequest,
  PaiementRequest
} from '../../core/models/commercial.model';

type Tab = 'dashboard' | 'plans' | 'clients' | 'facturation';

@Component({
  selector: 'app-commercial',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="page-container">
  <div class="page-header">
    <h1 class="page-title">Gestion Commerciale</h1>
    <p class="page-subtitle">Clients, abonnements, factures et licences eDefence</p>
  </div>

  <!-- Tabs -->
  <div class="tabs-nav">
    @for (t of tabs; track t.key) {
      <button class="tab-btn" [class.active]="activeTab() === t.key" (click)="activeTab.set(t.key)">
        <i class="bi {{ t.icon }}"></i> {{ t.label }}
      </button>
    }
  </div>

  <!-- ─── DASHBOARD ─────────────────────────────────────────────────── -->
  @if (activeTab() === 'dashboard') {
    @if (dashboard()) {
      <div class="dashboard-grid">
        <!-- KPI Cards -->
        <div class="kpi-card kpi-green">
          <div class="kpi-value">{{ dashboard()!.nbClientsActifs }}</div>
          <div class="kpi-label">Clients Actifs</div>
        </div>
        <div class="kpi-card kpi-blue">
          <div class="kpi-value">{{ dashboard()!.nbClientsEssai }}</div>
          <div class="kpi-label">En Essai</div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-value">{{ dashboard()!.nbClientsSuspendus }}</div>
          <div class="kpi-label">Suspendus</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-value">{{ dashboard()!.nbClientsResilies }}</div>
          <div class="kpi-label">Résiliés</div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-value">{{ dashboard()!.mrr | number:'1.0-0' }} FCFA</div>
          <div class="kpi-label">MRR</div>
        </div>
        <div class="kpi-card kpi-indigo">
          <div class="kpi-value">{{ dashboard()!.arr | number:'1.0-0' }} FCFA</div>
          <div class="kpi-label">ARR</div>
        </div>
        <div class="kpi-card kpi-yellow">
          <div class="kpi-value">{{ dashboard()!.facturesEnAttente }}</div>
          <div class="kpi-label">Factures en attente</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-value">{{ dashboard()!.facturesEnRetard }}</div>
          <div class="kpi-label">Factures en retard</div>
        </div>
        <div class="kpi-card kpi-teal">
          <div class="kpi-value">{{ dashboard()!.renouvellements30jours }}</div>
          <div class="kpi-label">Renouvellements (30j)</div>
        </div>
      </div>

      <!-- Revenus par plan -->
      @if (dashboard()!.revenusParPlan.length > 0) {
        <div class="card mt-4">
          <div class="card-header"><h3>Revenus par plan</h3></div>
          <table class="data-table">
            <thead><tr>
              <th>Plan</th><th>Clients actifs</th><th>Revenu mensuel</th>
            </tr></thead>
            <tbody>
              @for (r of dashboard()!.revenusParPlan; track r.planNom) {
                <tr>
                  <td><strong>{{ r.planNom }}</strong></td>
                  <td>{{ r.nbClients }}</td>
                  <td>{{ r.revenuMensuel | number:'1.0-0' }} FCFA</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else {
      <div class="loading-spinner"><i class="bi bi-arrow-repeat spin"></i> Chargement...</div>
    }
  }

  <!-- ─── PLANS ──────────────────────────────────────────────────────── -->
  @if (activeTab() === 'plans') {
    <div class="toolbar">
      <button class="btn btn-primary" (click)="ouvrirModalPlan(null)">
        <i class="bi bi-plus-lg"></i> Nouveau plan
      </button>
    </div>
    <div class="plans-grid">
      @for (p of plans(); track p.id) {
        <div class="plan-card" [class.plan-inactive]="!p.actif">
          <div class="plan-header">
            <h3>{{ p.nom }}</h3>
            <span class="badge" [class.badge-success]="p.actif" [class.badge-secondary]="!p.actif">
              {{ p.actif ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <p class="plan-desc">{{ p.description }}</p>
          <div class="plan-prix">
            <div><span class="prix-val">{{ p.prixMensuel | number:'1.0-0' }}</span> FCFA/mois</div>
            <div><span class="prix-val">{{ p.prixAnnuel | number:'1.0-0' }}</span> FCFA/an</div>
          </div>
          <div class="plan-meta">
            <span><i class="bi bi-people"></i> Max {{ p.maxUtilisateurs }} utilisateurs</span>
          </div>
          <div class="plan-modules">
            @for (m of p.modules; track m) {
              <span class="module-chip">{{ m }}</span>
            }
          </div>
          <div class="plan-actions">
            <button class="btn btn-sm btn-outline" (click)="ouvrirModalPlan(p)">
              <i class="bi bi-pencil"></i> Modifier
            </button>
            <button class="btn btn-sm btn-danger-outline" (click)="supprimerPlan(p.id)">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      }
    </div>
  }

  <!-- ─── CLIENTS ────────────────────────────────────────────────────── -->
  @if (activeTab() === 'clients') {
    <div class="toolbar">
      <input class="form-input" placeholder="Rechercher un client..." [(ngModel)]="rechercheClient"
             (ngModelChange)="filtrerClients()">
      <button class="btn btn-primary" (click)="ouvrirModalAbonnement(null)">
        <i class="bi bi-plus-lg"></i> Nouveau client
      </button>
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Entreprise</th><th>Contact</th><th>Plan</th>
        <th>Statut</th><th>Périodicité</th><th>Montant</th>
        <th>Renouvellement</th><th>Actions</th>
      </tr></thead>
      <tbody>
        @for (a of abonnementsFiltres(); track a.id) {
          <tr>
            <td><strong>{{ a.nomEntreprise }}</strong><br><small>{{ a.pays }}</small></td>
            <td>{{ a.emailContact }}<br><small>{{ a.telephone }}</small></td>
            <td>{{ a.plan?.nom ?? '—' }}</td>
            <td><span class="badge {{ statutClass(a.statut) }}">{{ a.statut }}</span></td>
            <td>{{ a.periodicite }}</td>
            <td>{{ a.montantActuel | number:'1.0-0' }} FCFA</td>
            <td>{{ a.dateProchainRenouvellement ?? '—' }}</td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-outline" (click)="ouvrirModalAbonnement(a)" title="Modifier">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-outline" (click)="voirFacturesClient(a)" title="Factures">
                <i class="bi bi-file-text"></i>
              </button>
              <button class="btn btn-sm btn-outline" (click)="telechargerLicence(a)" title="Télécharger licence">
                <i class="bi bi-key"></i>
              </button>
              <button class="btn btn-sm btn-danger-outline" (click)="supprimerAbonnement(a.id)" title="Supprimer">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        }
        @empty {
          <tr><td colspan="8" class="empty-cell">Aucun client</td></tr>
        }
      </tbody>
    </table>
  }

  <!-- ─── FACTURATION ────────────────────────────────────────────────── -->
  @if (activeTab() === 'facturation') {
    <div class="toolbar">
      <button class="btn btn-primary" (click)="ouvrirModalFacture()">
        <i class="bi bi-plus-lg"></i> Générer une facture
      </button>
      @if (filtreAbonnementId()) {
        <span class="filter-chip">
          Client: {{ filtreAbonnementNom() }}
          <button class="chip-close" (click)="clearFiltreAbonnement()">×</button>
        </span>
      }
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Numéro</th><th>Client</th><th>Période</th>
        <th>HT</th><th>TVA</th><th>TTC</th>
        <th>Statut</th><th>Échéance</th><th>Actions</th>
      </tr></thead>
      <tbody>
        @for (f of facturesFiltrees(); track f.id) {
          <tr>
            <td><strong>{{ f.numero }}</strong></td>
            <td>{{ f.abonnement?.nomEntreprise ?? '—' }}</td>
            <td>{{ f.periodeDebut }} → {{ f.periodeFin }}</td>
            <td>{{ f.montantHt | number:'1.0-0' }}</td>
            <td>{{ f.tauxTva }}%</td>
            <td><strong>{{ f.montantTtc | number:'1.0-0' }} FCFA</strong></td>
            <td><span class="badge {{ factureStatutClass(f.statut) }}">{{ f.statut }}</span></td>
            <td [class.text-danger]="estEnRetard(f)">{{ f.dateEcheance }}</td>
            <td class="actions-cell">
              @if (f.statut !== 'PAYEE' && f.statut !== 'ANNULEE') {
                <button class="btn btn-sm btn-success-outline" (click)="ouvrirModalPaiement(f)" title="Enregistrer paiement">
                  <i class="bi bi-cash"></i>
                </button>
              }
              <select class="select-sm" [value]="f.statut" (change)="changerStatut(f.id, $any($event.target).value)">
                <option value="BROUILLON">BROUILLON</option>
                <option value="EN_ATTENTE">EN_ATTENTE</option>
                <option value="PAYEE">PAYEE</option>
                <option value="EN_RETARD">EN_RETARD</option>
                <option value="ANNULEE">ANNULEE</option>
              </select>
            </td>
          </tr>
        }
        @empty {
          <tr><td colspan="9" class="empty-cell">Aucune facture</td></tr>
        }
      </tbody>
    </table>
  }
</div>

<!-- ─── MODAL PLAN ──────────────────────────────────────────────────────── -->
@if (modalPlanOuvert()) {
  <div class="modal-backdrop" (click)="fermerModals()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>{{ planEdite()?.id ? 'Modifier le plan' : 'Nouveau plan tarifaire' }}</h2>
        <button class="modal-close" (click)="fermerModals()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Nom *</label>
            <input class="form-input" [(ngModel)]="formPlan.nom">
          </div>
          <div class="form-group">
            <label>Code *</label>
            <input class="form-input" [(ngModel)]="formPlan.code">
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="form-input" rows="2" [(ngModel)]="formPlan.description"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Prix mensuel (FCFA) *</label>
            <input class="form-input" type="number" [(ngModel)]="formPlan.prixMensuel">
          </div>
          <div class="form-group">
            <label>Prix annuel (FCFA) *</label>
            <input class="form-input" type="number" [(ngModel)]="formPlan.prixAnnuel">
          </div>
          <div class="form-group">
            <label>Max utilisateurs *</label>
            <input class="form-input" type="number" [(ngModel)]="formPlan.maxUtilisateurs">
          </div>
        </div>
        <div class="form-group">
          <label>Modules (un par ligne)</label>
          <textarea class="form-input" rows="4" [(ngModel)]="modulesTexte"
                    placeholder="COMPTABILITE&#10;TIERS&#10;CRM"></textarea>
        </div>
        <div class="form-group form-check">
          <input type="checkbox" id="planActif" [(ngModel)]="formPlan.actif">
          <label for="planActif">Plan actif</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="fermerModals()">Annuler</button>
        <button class="btn btn-primary" (click)="sauvegarderPlan()">
          {{ planEdite()?.id ? 'Mettre à jour' : 'Créer' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ─── MODAL ABONNEMENT ─────────────────────────────────────────────────── -->
@if (modalAbonnementOuvert()) {
  <div class="modal-backdrop" (click)="fermerModals()">
    <div class="modal-box modal-lg" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>{{ abonnementEdite()?.id ? 'Modifier le client' : 'Nouveau client' }}</h2>
        <button class="modal-close" (click)="fermerModals()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Nom entreprise *</label>
            <input class="form-input" [(ngModel)]="formAbo.nomEntreprise">
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input class="form-input" type="email" [(ngModel)]="formAbo.emailContact">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Téléphone</label>
            <input class="form-input" [(ngModel)]="formAbo.telephone">
          </div>
          <div class="form-group">
            <label>Pays</label>
            <input class="form-input" [(ngModel)]="formAbo.pays">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Plan</label>
            <select class="form-input" [(ngModel)]="formAbo.planId">
              <option value="">— Aucun plan —</option>
              @for (p of plans(); track p.id) {
                <option [value]="p.id">{{ p.nom }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Statut</label>
            <select class="form-input" [(ngModel)]="formAbo.statut">
              <option value="ESSAI">ESSAI</option>
              <option value="ACTIF">ACTIF</option>
              <option value="SUSPENDU">SUSPENDU</option>
              <option value="RESILIE">RESILIE</option>
            </select>
          </div>
          <div class="form-group">
            <label>Périodicité</label>
            <select class="form-input" [(ngModel)]="formAbo.periodicite">
              <option value="MENSUEL">MENSUEL</option>
              <option value="ANNUEL">ANNUEL</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Date début *</label>
            <input class="form-input" type="date" [(ngModel)]="formAbo.dateDebut">
          </div>
          <div class="form-group">
            <label>Date fin</label>
            <input class="form-input" type="date" [(ngModel)]="formAbo.dateFin">
          </div>
          <div class="form-group">
            <label>Prochain renouvellement</label>
            <input class="form-input" type="date" [(ngModel)]="formAbo.dateProchainRenouvellement">
          </div>
        </div>
        <div class="form-group">
          <label>Montant actuel (FCFA)</label>
          <input class="form-input" type="number" [(ngModel)]="formAbo.montantActuel">
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea class="form-input" rows="2" [(ngModel)]="formAbo.notes"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="fermerModals()">Annuler</button>
        <button class="btn btn-primary" (click)="sauvegarderAbonnement()">
          {{ abonnementEdite()?.id ? 'Mettre à jour' : 'Créer' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ─── MODAL FACTURE ────────────────────────────────────────────────────── -->
@if (modalFactureOuvert()) {
  <div class="modal-backdrop" (click)="fermerModals()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>Générer une facture</h2>
        <button class="modal-close" (click)="fermerModals()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Client *</label>
          <select class="form-input" [(ngModel)]="formFacture.abonnementId">
            <option value="">— Sélectionner —</option>
            @for (a of abonnements(); track a.id) {
              <option [value]="a.id">{{ a.nomEntreprise }}</option>
            }
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Période début *</label>
            <input class="form-input" type="date" [(ngModel)]="formFacture.periodeDebut">
          </div>
          <div class="form-group">
            <label>Période fin *</label>
            <input class="form-input" type="date" [(ngModel)]="formFacture.periodeFin">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Montant HT (FCFA) *</label>
            <input class="form-input" type="number" [(ngModel)]="formFacture.montantHt" (ngModelChange)="calculerTtc()">
          </div>
          <div class="form-group">
            <label>Taux TVA (%)</label>
            <input class="form-input" type="number" [(ngModel)]="formFacture.tauxTva" (ngModelChange)="calculerTtc()">
          </div>
          <div class="form-group">
            <label>Montant TTC</label>
            <input class="form-input" [value]="montantTtcPreview() | number:'1.0-2'" readonly>
          </div>
        </div>
        <div class="form-group">
          <label>Date d'échéance *</label>
          <input class="form-input" type="date" [(ngModel)]="formFacture.dateEcheance">
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea class="form-input" rows="2" [(ngModel)]="formFacture.notes"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="fermerModals()">Annuler</button>
        <button class="btn btn-primary" (click)="sauvegarderFacture()">Générer</button>
      </div>
    </div>
  </div>
}

<!-- ─── MODAL PAIEMENT ───────────────────────────────────────────────────── -->
@if (modalPaiementOuvert()) {
  <div class="modal-backdrop" (click)="fermerModals()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>Enregistrer un paiement</h2>
        <button class="modal-close" (click)="fermerModals()">×</button>
      </div>
      <div class="modal-body">
        <div class="info-banner">
          Facture : <strong>{{ factureSelectionnee()?.numero }}</strong> —
          TTC : <strong>{{ factureSelectionnee()?.montantTtc | number:'1.0-0' }} FCFA</strong>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Montant reçu (FCFA) *</label>
            <input class="form-input" type="number" [(ngModel)]="formPaiement.montant">
          </div>
          <div class="form-group">
            <label>Date paiement *</label>
            <input class="form-input" type="date" [(ngModel)]="formPaiement.datePaiement">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Mode de paiement *</label>
            <select class="form-input" [(ngModel)]="formPaiement.modePaiement">
              <option value="VIREMENT">Virement bancaire</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
              <option value="CARTE">Carte bancaire</option>
              <option value="CHEQUE">Chèque</option>
            </select>
          </div>
          <div class="form-group">
            <label>Référence</label>
            <input class="form-input" [(ngModel)]="formPaiement.reference">
          </div>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea class="form-input" rows="2" [(ngModel)]="formPaiement.notes"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="fermerModals()">Annuler</button>
        <button class="btn btn-success" (click)="sauvegarderPaiement()">
          <i class="bi bi-check-lg"></i> Confirmer paiement
        </button>
      </div>
    </div>
  </div>
}
  `,
  styles: [`
    .page-container { padding: 24px; max-width: 1400px; margin: 0 auto; }
    .page-header { margin-bottom: 24px; }
    .page-title { font-size: 1.75rem; font-weight: 700; color: #1e293b; margin: 0 0 4px; }
    .page-subtitle { color: #64748b; margin: 0; }

    .tabs-nav { display: flex; gap: 4px; border-bottom: 2px solid #e2e8f0; margin-bottom: 24px; }
    .tab-btn { padding: 10px 20px; border: none; background: none; cursor: pointer; color: #64748b;
      font-weight: 500; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all .2s; }
    .tab-btn:hover { color: #3b82f6; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }

    .dashboard-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .kpi-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,.1);
      border-left: 4px solid #e2e8f0; }
    .kpi-green { border-left-color: #22c55e; } .kpi-blue { border-left-color: #3b82f6; }
    .kpi-orange { border-left-color: #f97316; } .kpi-red { border-left-color: #ef4444; }
    .kpi-purple { border-left-color: #a855f7; } .kpi-indigo { border-left-color: #6366f1; }
    .kpi-yellow { border-left-color: #eab308; } .kpi-teal { border-left-color: #14b8a6; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .kpi-label { font-size: .875rem; color: #64748b; margin-top: 4px; }

    .toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .filter-chip { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 9999px;
      padding: 4px 12px; font-size: .875rem; color: #1d4ed8; display: flex; align-items: center; gap: 8px; }
    .chip-close { background: none; border: none; cursor: pointer; color: #6b7280; font-size: 1.1rem; line-height: 1; }

    .plans-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
    .plan-card { background: white; border-radius: 12px; padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,.1); border: 1px solid #e2e8f0; }
    .plan-card.plan-inactive { opacity: .6; }
    .plan-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .plan-header h3 { margin: 0; font-size: 1.1rem; font-weight: 700; }
    .plan-desc { color: #64748b; font-size: .875rem; margin: 0 0 12px; }
    .plan-prix { display: flex; gap: 16px; margin-bottom: 12px; font-size: .875rem; color: #374151; }
    .prix-val { font-size: 1.2rem; font-weight: 700; color: #1e293b; }
    .plan-meta { font-size: .8rem; color: #64748b; margin-bottom: 10px; }
    .plan-modules { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
    .module-chip { background: #eff6ff; color: #1d4ed8; border-radius: 4px;
      padding: 2px 8px; font-size: .75rem; font-weight: 500; }
    .plan-actions { display: flex; gap: 8px; }

    .data-table { width: 100%; border-collapse: collapse; background: white;
      border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .data-table th { background: #f8fafc; padding: 12px 16px; text-align: left;
      font-weight: 600; color: #374151; font-size: .875rem; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 12px 16px; border-bottom: 1px solid #f1f5f9;
      font-size: .875rem; color: #374151; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8fafc; }
    .actions-cell { display: flex; gap: 4px; flex-wrap: wrap; }
    .empty-cell { text-align: center; color: #94a3b8; padding: 32px; }

    .badge { padding: 3px 10px; border-radius: 9999px; font-size: .75rem; font-weight: 600; }
    .badge-success { background: #dcfce7; color: #166534; }
    .badge-secondary { background: #f1f5f9; color: #475569; }
    .badge-blue { background: #dbeafe; color: #1d4ed8; }
    .badge-orange { background: #fff7ed; color: #c2410c; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    .badge-gray { background: #f1f5f9; color: #475569; }

    .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.1); overflow: hidden; }
    .card-header { padding: 16px 20px; border-bottom: 1px solid #e2e8f0; }
    .card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; }
    .mt-4 { margin-top: 16px; }

    .select-sm { padding: 4px 8px; border: 1px solid #e2e8f0; border-radius: 6px;
      font-size: .8rem; background: white; cursor: pointer; }
    .text-danger { color: #ef4444; }

    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;
      font-size: .875rem; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-success { background: #22c55e; color: white; }
    .btn-success:hover { background: #16a34a; }
    .btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
    .btn-ghost:hover { background: #f8fafc; }
    .btn-sm { padding: 5px 10px; font-size: .8rem; }
    .btn-outline { background: white; border: 1px solid #e2e8f0; color: #374151; }
    .btn-outline:hover { background: #f8fafc; border-color: #3b82f6; color: #3b82f6; }
    .btn-success-outline { background: white; border: 1px solid #86efac; color: #166534; }
    .btn-success-outline:hover { background: #dcfce7; }
    .btn-danger-outline { background: white; border: 1px solid #fca5a5; color: #991b1b; }
    .btn-danger-outline:hover { background: #fee2e2; }

    .form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .form-group label { font-size: .8rem; font-weight: 600; color: #374151; }
    .form-input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: .875rem; outline: none; width: 100%; box-sizing: border-box; }
    .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.1); }
    .form-row { display: flex; gap: 12px; }
    .form-check { flex-direction: row; align-items: center; gap: 8px; }

    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
    .modal-box { background: white; border-radius: 16px; width: 100%; max-width: 600px;
      max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,.2); }
    .modal-lg { max-width: 780px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center;
      padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
    .modal-header h2 { margin: 0; font-size: 1.2rem; font-weight: 700; }
    .modal-close { background: none; border: none; cursor: pointer; font-size: 1.5rem; color: #94a3b8; line-height: 1; }
    .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
    .modal-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0;
      display: flex; justify-content: flex-end; gap: 8px; }

    .info-banner { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
      padding: 10px 14px; font-size: .875rem; color: #1d4ed8; }

    .loading-spinner { display: flex; align-items: center; gap: 8px; color: #64748b;
      padding: 40px; justify-content: center; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class CommercialComponent implements OnInit {
  private svc = inject(CommercialService);

  activeTab = signal<Tab>('dashboard');
  tabs = [
    { key: 'dashboard' as Tab, label: 'Dashboard', icon: 'bi-speedometer2' },
    { key: 'plans' as Tab, label: 'Plans tarifaires', icon: 'bi-tags' },
    { key: 'clients' as Tab, label: 'Clients', icon: 'bi-building' },
    { key: 'facturation' as Tab, label: 'Facturation', icon: 'bi-file-earmark-text' }
  ];

  dashboard = signal<DashboardCommercial | null>(null);
  plans = signal<PlanResponse[]>([]);
  abonnements = signal<AbonnementResponse[]>([]);
  factures = signal<FactureResponse[]>([]);

  rechercheClient = '';
  abonnementsFiltres = signal<AbonnementResponse[]>([]);
  facturesFiltrees = signal<FactureResponse[]>([]);
  filtreAbonnementId = signal<string | null>(null);
  filtreAbonnementNom = signal<string>('');

  // Modals
  modalPlanOuvert = signal(false);
  modalAbonnementOuvert = signal(false);
  modalFactureOuvert = signal(false);
  modalPaiementOuvert = signal(false);

  planEdite = signal<PlanResponse | null>(null);
  abonnementEdite = signal<AbonnementResponse | null>(null);
  factureSelectionnee = signal<FactureResponse | null>(null);

  modulesTexte = '';
  montantTtcPreview = signal(0);

  formPlan: PlanRequest = this.initFormPlan();
  formAbo: AbonnementRequest = this.initFormAbo();
  formFacture: FactureRequest = this.initFormFacture();
  formPaiement: PaiementRequest = this.initFormPaiement();

  ngOnInit(): void {
    this.chargerDashboard();
    this.chargerPlans();
    this.chargerAbonnements();
    this.chargerFactures();
  }

  chargerDashboard(): void {
    this.svc.getDashboard().subscribe(d => this.dashboard.set(d));
  }

  chargerPlans(): void {
    this.svc.listerPlans().subscribe(data => this.plans.set(data));
  }

  chargerAbonnements(): void {
    this.svc.listerAbonnements().subscribe(data => {
      this.abonnements.set(data);
      this.filtrerClients();
    });
  }

  chargerFactures(): void {
    const id = this.filtreAbonnementId();
    const obs = id
      ? this.svc.listerFacturesClient(id)
      : this.svc.listerFactures();
    obs.subscribe(data => {
      this.factures.set(data);
      this.facturesFiltrees.set(data);
    });
  }

  filtrerClients(): void {
    const q = this.rechercheClient.toLowerCase();
    this.abonnementsFiltres.set(
      q ? this.abonnements().filter(a =>
        a.nomEntreprise.toLowerCase().includes(q) ||
        a.emailContact.toLowerCase().includes(q) ||
        (a.pays ?? '').toLowerCase().includes(q)
      ) : this.abonnements()
    );
  }

  voirFacturesClient(a: AbonnementResponse): void {
    this.filtreAbonnementId.set(a.id);
    this.filtreAbonnementNom.set(a.nomEntreprise);
    this.activeTab.set('facturation');
    this.chargerFactures();
  }

  clearFiltreAbonnement(): void {
    this.filtreAbonnementId.set(null);
    this.filtreAbonnementNom.set('');
    this.chargerFactures();
  }

  // ── Plans ────────────────────────────────────────────────────────────────

  ouvrirModalPlan(p: PlanResponse | null): void {
    this.planEdite.set(p);
    if (p) {
      this.formPlan = { nom: p.nom, code: p.code, description: p.description,
        prixMensuel: p.prixMensuel, prixAnnuel: p.prixAnnuel,
        modules: [...p.modules], maxUtilisateurs: p.maxUtilisateurs, actif: p.actif };
      this.modulesTexte = p.modules.join('\n');
    } else {
      this.formPlan = this.initFormPlan();
      this.modulesTexte = '';
    }
    this.modalPlanOuvert.set(true);
  }

  sauvegarderPlan(): void {
    this.formPlan.modules = this.modulesTexte.split('\n').map(m => m.trim()).filter(Boolean);
    const id = this.planEdite()?.id;
    const obs = id
      ? this.svc.mettreAJourPlan(id, this.formPlan)
      : this.svc.creerPlan(this.formPlan);
    obs.subscribe(() => { this.fermerModals(); this.chargerPlans(); this.chargerDashboard(); });
  }

  supprimerPlan(id: string): void {
    if (!confirm('Supprimer ce plan ?')) return;
    this.svc.supprimerPlan(id).subscribe(() => this.chargerPlans());
  }

  // ── Abonnements ──────────────────────────────────────────────────────────

  ouvrirModalAbonnement(a: AbonnementResponse | null): void {
    this.abonnementEdite.set(a);
    if (a) {
      this.formAbo = {
        nomEntreprise: a.nomEntreprise, emailContact: a.emailContact,
        telephone: a.telephone, pays: a.pays,
        planId: a.plan?.id ?? '', statut: a.statut, periodicite: a.periodicite,
        dateDebut: a.dateDebut, dateFin: a.dateFin ?? '',
        dateProchainRenouvellement: a.dateProchainRenouvellement ?? '',
        montantActuel: a.montantActuel, notes: a.notes ?? ''
      };
    } else {
      this.formAbo = this.initFormAbo();
    }
    this.modalAbonnementOuvert.set(true);
  }

  sauvegarderAbonnement(): void {
    const id = this.abonnementEdite()?.id;
    const obs = id
      ? this.svc.mettreAJourAbonnement(id, this.formAbo)
      : this.svc.creerAbonnement(this.formAbo);
    obs.subscribe(() => { this.fermerModals(); this.chargerAbonnements(); this.chargerDashboard(); });
  }

  supprimerAbonnement(id: string): void {
    if (!confirm('Supprimer ce client ?')) return;
    this.svc.supprimerAbonnement(id).subscribe(() => {
      this.chargerAbonnements();
      this.chargerDashboard();
    });
  }

  telechargerLicence(a: AbonnementResponse): void {
    this.svc.telechargerLicence(a.id).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `licence-${a.nomEntreprise.replace(/\s+/g, '-')}.lic`;
      link.click();
      URL.revokeObjectURL(url);
    });
  }

  // ── Factures ─────────────────────────────────────────────────────────────

  ouvrirModalFacture(): void {
    this.formFacture = this.initFormFacture();
    this.montantTtcPreview.set(0);
    this.modalFactureOuvert.set(true);
  }

  calculerTtc(): void {
    const ht = this.formFacture.montantHt || 0;
    const tva = this.formFacture.tauxTva || 0;
    this.montantTtcPreview.set(ht * (1 + tva / 100));
  }

  sauvegarderFacture(): void {
    this.svc.genererFacture(this.formFacture).subscribe(() => {
      this.fermerModals();
      this.chargerFactures();
    });
  }

  changerStatut(id: string, statut: string): void {
    this.svc.changerStatutFacture(id, statut).subscribe(() => this.chargerFactures());
  }

  // ── Paiements ─────────────────────────────────────────────────────────────

  ouvrirModalPaiement(f: FactureResponse): void {
    this.factureSelectionnee.set(f);
    this.formPaiement = {
      factureId: f.id,
      modePaiement: 'VIREMENT',
      montant: f.montantTtc,
      datePaiement: new Date().toISOString().slice(0, 10),
      reference: '',
      notes: ''
    };
    this.modalPaiementOuvert.set(true);
  }

  sauvegarderPaiement(): void {
    this.svc.enregistrerPaiement(this.formPaiement).subscribe(() => {
      this.fermerModals();
      this.chargerFactures();
      this.chargerDashboard();
    });
  }

  fermerModals(): void {
    this.modalPlanOuvert.set(false);
    this.modalAbonnementOuvert.set(false);
    this.modalFactureOuvert.set(false);
    this.modalPaiementOuvert.set(false);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  statutClass(s: string): string {
    const map: Record<string, string> = {
      ACTIF: 'badge-success', ESSAI: 'badge-blue',
      SUSPENDU: 'badge-orange', RESILIE: 'badge-red'
    };
    return map[s] ?? 'badge-gray';
  }

  factureStatutClass(s: string): string {
    const map: Record<string, string> = {
      BROUILLON: 'badge-gray', EN_ATTENTE: 'badge-yellow',
      PAYEE: 'badge-success', EN_RETARD: 'badge-red', ANNULEE: 'badge-secondary'
    };
    return map[s] ?? 'badge-gray';
  }

  estEnRetard(f: FactureResponse): boolean {
    return f.statut !== 'PAYEE' && f.statut !== 'ANNULEE' &&
           new Date(f.dateEcheance) < new Date();
  }

  // ── Init helpers ──────────────────────────────────────────────────────────

  private initFormPlan(): PlanRequest {
    return { nom: '', code: '', description: '', prixMensuel: 0, prixAnnuel: 0,
             modules: [], maxUtilisateurs: 5, actif: true };
  }

  private initFormAbo(): AbonnementRequest {
    return { nomEntreprise: '', emailContact: '', telephone: '', pays: '',
             planId: '', statut: 'ESSAI', periodicite: 'MENSUEL',
             dateDebut: new Date().toISOString().slice(0, 10),
             montantActuel: 0 };
  }

  private initFormFacture(): FactureRequest {
    return { abonnementId: '', periodeDebut: '', periodeFin: '',
             montantHt: 0, tauxTva: 0, dateEcheance: '', notes: '' };
  }

  private initFormPaiement(): PaiementRequest {
    return { factureId: '', modePaiement: 'VIREMENT', montant: 0,
             datePaiement: '', reference: '', notes: '' };
  }
}
