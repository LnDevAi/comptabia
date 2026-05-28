import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef,
  signal, inject, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { StockService } from '../../core/services/stock.service';
import {
  DashboardStock, ArticleResponse, ArticleRequest,
  MouvementResponse, MouvementRequest,
  LigneInventaire, DepotResponse, StatsMouvements
} from '../../core/models/stock.model';

Chart.register(...registerables);

type Tab = 'dashboard' | 'articles' | 'mouvements' | 'inventaire';

@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
<div class="page-container">
  <div class="page-header">
    <h1 class="page-title">Gestion des Stocks</h1>
    <p class="page-subtitle">Articles, mouvements, inventaire et valorisation CMUP</p>
  </div>

  <!-- Tabs -->
  <div class="tabs-nav">
    @for (t of tabs; track t.key) {
      <button class="tab-btn" [class.active]="activeTab() === t.key" (click)="activeTab.set(t.key)">
        <i class="bi {{ t.icon }}"></i> {{ t.label }}
      </button>
    }
  </div>

  <!-- ─── DASHBOARD ────────────────────────────────────────────────────── -->
  @if (activeTab() === 'dashboard') {
    @if (dashboard()) {
      <div class="kpi-row">
        <div class="kpi-card kpi-blue">
          <div class="kpi-value">{{ dashboard()!.totalArticles }}</div>
          <div class="kpi-label">Articles actifs</div>
        </div>
        <div class="kpi-card kpi-purple">
          <div class="kpi-value">{{ dashboard()!.valeurTotaleStock | number:'1.0-0' }} FCFA</div>
          <div class="kpi-label">Valeur totale du stock</div>
        </div>
        <div class="kpi-card kpi-orange">
          <div class="kpi-value">{{ dashboard()!.articlesEnAlerte }}</div>
          <div class="kpi-label">Articles en alerte</div>
        </div>
        <div class="kpi-card kpi-red">
          <div class="kpi-value">{{ dashboard()!.articlesEnRupture }}</div>
          <div class="kpi-label">En rupture</div>
        </div>
      </div>

      <!-- Sélecteur exercice + Graphique mouvements mensuels -->
      <div class="card mt-4">
        <div class="card-header" style="display:flex;align-items:center;justify-content:space-between">
          <h3>Mouvements mensuels — entrées / sorties</h3>
          <select [(ngModel)]="selectedExercice" (ngModelChange)="onExerciceChange($event)"
                  style="border:1px solid #d1d5db;border-radius:6px;padding:4px 8px;font-size:12px">
            @for (y of exercices; track y) { <option [value]="y">{{ y }}</option> }
          </select>
        </div>
        @if (statsMouv()) {
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:12px">
            <div style="background:#eff6ff;border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Valeur entrées</div>
              <div style="font-size:18px;font-weight:700;color:#1d4ed8">{{ fmtK(statsMouv()!.totalValEntrees) }}</div>
            </div>
            <div style="background:#fef2f2;border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Valeur sorties</div>
              <div style="font-size:18px;font-weight:700;color:#dc2626">{{ fmtK(statsMouv()!.totalValSorties) }}</div>
            </div>
            <div style="background:#f0fdf4;border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:11px;color:#6b7280;text-transform:uppercase">Solde net</div>
              <div style="font-size:18px;font-weight:700" [style.color]="statsMouv()!.totalValEntrees >= statsMouv()!.totalValSorties ? '#15803d' : '#dc2626'">
                {{ fmtK(statsMouv()!.totalValEntrees - statsMouv()!.totalValSorties) }}
              </div>
            </div>
          </div>
          <div style="position:relative;height:220px;padding:0 12px 12px">
            <canvas #mouvCanvas></canvas>
          </div>
        }
      </div>

      @if (dashboard()!.articlesRupture.length > 0) {
        <div class="card mt-4">
          <div class="card-header alert-header">
            <i class="bi bi-exclamation-triangle-fill text-orange"></i>
            <h3>Articles en rupture de stock</h3>
          </div>
          <table class="data-table">
            <thead><tr>
              <th>Code</th><th>Désignation</th><th>Catégorie</th>
              <th>Stock actuel</th><th>Stock min</th><th>CMUP</th><th>Actions</th>
            </tr></thead>
            <tbody>
              @for (a of dashboard()!.articlesRupture; track a.id) {
                <tr class="row-alert">
                  <td><strong>{{ a.code }}</strong></td>
                  <td>{{ a.designation }}</td>
                  <td><span class="badge {{ categorieClass(a.categorie) }}">{{ categorieLabel(a.categorie) }}</span></td>
                  <td class="text-danger"><strong>{{ a.stockActuel | number:'1.0-4' }} {{ a.uniteMesure }}</strong></td>
                  <td>{{ a.stockMin | number:'1.0-4' }}</td>
                  <td>{{ a.coutMoyen | number:'1.0-2' }} FCFA</td>
                  <td>
                    <button class="btn btn-sm btn-primary" (click)="ouvrirMouvementRapide(a)">
                      <i class="bi bi-box-arrow-in-down"></i> Entrée
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <div class="card mt-4">
        <div class="card-header"><h3>Derniers mouvements</h3></div>
        <table class="data-table">
          <thead><tr>
            <th>Date</th><th>Article</th><th>Type</th><th>Qté</th><th>PU</th><th>Montant</th>
          </tr></thead>
          <tbody>
            @for (m of dashboard()!.derniersMovements; track m.id) {
              <tr>
                <td>{{ m.dateMouvement }}</td>
                <td><strong>{{ m.articleCode }}</strong> — {{ m.articleDesignation }}</td>
                <td><span class="badge {{ mouvTypeClass(m.typeMouvement) }}">{{ mouvTypeLabel(m.typeMouvement) }}</span></td>
                <td [class.text-success]="isEntree(m.typeMouvement)" [class.text-danger]="!isEntree(m.typeMouvement)">
                  {{ isEntree(m.typeMouvement) ? '+' : '-' }}{{ m.quantite | number:'1.0-4' }}
                </td>
                <td>{{ m.prixUnitaire | number:'1.0-2' }}</td>
                <td>{{ m.montant | number:'1.0-0' }} FCFA</td>
              </tr>
            }
            @empty {
              <tr><td colspan="6" class="empty-cell">Aucun mouvement récent</td></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <div class="loading-spinner"><i class="bi bi-arrow-repeat spin"></i> Chargement...</div>
    }
  }

  <!-- ─── ARTICLES ─────────────────────────────────────────────────────── -->
  @if (activeTab() === 'articles') {
    <div class="toolbar">
      <input class="form-input search-input" placeholder="Rechercher un article..."
             [(ngModel)]="filtreSearch" (ngModelChange)="chargerArticles()">
      <select class="form-input select-filter" [(ngModel)]="filtreCategorie" (ngModelChange)="chargerArticles()">
        <option value="">Toutes catégories</option>
        @for (c of categories; track c.value) {
          <option [value]="c.value">{{ c.label }}</option>
        }
      </select>
      <select class="form-input select-filter" [(ngModel)]="filtreActif" (ngModelChange)="chargerArticles()">
        <option value="">Tous</option>
        <option value="true">Actifs</option>
        <option value="false">Inactifs</option>
      </select>
      <button class="btn btn-primary" (click)="ouvrirModalArticle(null)">
        <i class="bi bi-plus-lg"></i> Nouvel article
      </button>
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Code</th><th>Désignation</th><th>Catégorie</th><th>UM</th>
        <th>Stock actuel</th><th>CMUP</th><th>Valeur stock</th>
        <th>Alerte</th><th>Méthode</th><th>Actions</th>
      </tr></thead>
      <tbody>
        @for (a of articles(); track a.id) {
          <tr [class.row-inactive]="!a.actif">
            <td><strong>{{ a.code }}</strong></td>
            <td>{{ a.designation }}</td>
            <td><span class="badge {{ categorieClass(a.categorie) }}">{{ categorieLabel(a.categorie) }}</span></td>
            <td>{{ a.uniteMesure }}</td>
            <td>{{ a.stockActuel | number:'1.0-4' }}</td>
            <td>{{ a.coutMoyen | number:'1.0-2' }} FCFA</td>
            <td><strong>{{ a.valeurStock | number:'1.0-0' }} FCFA</strong></td>
            <td>
              <span class="badge {{ alerteClass(a.alerteNiveau) }}">{{ a.alerteNiveau }}</span>
            </td>
            <td><span class="badge badge-secondary">{{ a.methodeEvaluation }}</span></td>
            <td class="actions-cell">
              <button class="btn btn-sm btn-success-outline" (click)="ouvrirMouvementRapide(a)" title="Entrée stock">
                <i class="bi bi-box-arrow-in-down"></i>
              </button>
              <button class="btn btn-sm btn-warning-outline" (click)="ouvrirSortieRapide(a)" title="Sortie stock">
                <i class="bi bi-box-arrow-up"></i>
              </button>
              <button class="btn btn-sm btn-outline" (click)="ouvrirModalArticle(a)" title="Modifier">
                <i class="bi bi-pencil"></i>
              </button>
              <button class="btn btn-sm btn-danger-outline" (click)="supprimerArticle(a.id)" title="Supprimer">
                <i class="bi bi-trash"></i>
              </button>
            </td>
          </tr>
        }
        @empty {
          <tr><td colspan="10" class="empty-cell">Aucun article</td></tr>
        }
      </tbody>
    </table>

    <!-- Pagination -->
    @if (totalPages() > 1) {
      <div class="pagination">
        <button class="btn btn-sm btn-ghost" [disabled]="currentPage() === 0" (click)="goPage(currentPage() - 1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        <span>Page {{ currentPage() + 1 }} / {{ totalPages() }}</span>
        <button class="btn btn-sm btn-ghost" [disabled]="currentPage() === totalPages() - 1" (click)="goPage(currentPage() + 1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    }
  }

  <!-- ─── MOUVEMENTS ───────────────────────────────────────────────────── -->
  @if (activeTab() === 'mouvements') {
    <div class="toolbar">
      <input class="form-input" type="date" [(ngModel)]="filtreDebut" (ngModelChange)="chargerMouvements()">
      <input class="form-input" type="date" [(ngModel)]="filtreFin" (ngModelChange)="chargerMouvements()">
      <select class="form-input select-filter" [(ngModel)]="filtreTypeMouv" (ngModelChange)="chargerMouvements()">
        <option value="">Tous types</option>
        @for (t of typesMouvement; track t.value) {
          <option [value]="t.value">{{ t.label }}</option>
        }
      </select>
      <button class="btn btn-primary" (click)="ouvrirModalMouvement()">
        <i class="bi bi-plus-lg"></i> Nouveau mouvement
      </button>
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Date</th><th>Article</th><th>Dépôt</th><th>Type</th>
        <th>Quantité</th><th>Prix unitaire</th><th>Montant</th>
        <th>CMUP après</th><th>Référence</th>
      </tr></thead>
      <tbody>
        @for (m of mouvements(); track m.id) {
          <tr>
            <td>{{ m.dateMouvement }}</td>
            <td><strong>{{ m.articleCode }}</strong><br><small>{{ m.articleDesignation }}</small></td>
            <td>{{ m.depotNom ?? '—' }}</td>
            <td><span class="badge {{ mouvTypeClass(m.typeMouvement) }}">{{ mouvTypeLabel(m.typeMouvement) }}</span></td>
            <td [class.text-success]="isEntree(m.typeMouvement)" [class.text-danger]="!isEntree(m.typeMouvement)">
              <strong>{{ isEntree(m.typeMouvement) ? '+' : '-' }}{{ m.quantite | number:'1.0-4' }}</strong>
            </td>
            <td>{{ m.prixUnitaire | number:'1.0-2' }}</td>
            <td>{{ m.montant | number:'1.0-0' }} FCFA</td>
            <td>{{ m.coutMoyenApres | number:'1.0-2' }}</td>
            <td>{{ m.reference ?? '—' }}</td>
          </tr>
        }
        @empty {
          <tr><td colspan="9" class="empty-cell">Aucun mouvement</td></tr>
        }
      </tbody>
    </table>
  }

  <!-- ─── INVENTAIRE ───────────────────────────────────────────────────── -->
  @if (activeTab() === 'inventaire') {
    <div class="toolbar">
      <div class="form-group" style="flex-direction:row;align-items:center;gap:8px">
        <label>Date inventaire :</label>
        <input class="form-input" type="date" [(ngModel)]="dateInventaire" style="width:180px">
      </div>
      <div class="form-group" style="flex-direction:row;align-items:center;gap:8px">
        <label>Référence :</label>
        <input class="form-input" [(ngModel)]="refInventaire" placeholder="INV-2024-001" style="width:180px">
      </div>
      <button class="btn btn-primary" (click)="validerInventaire()" [disabled]="lignesInventaire().length === 0">
        <i class="bi bi-check-lg"></i> Valider l'inventaire
      </button>
    </div>

    <div class="inventaire-info">
      <i class="bi bi-info-circle"></i>
      Saisissez le stock réel constaté pour chaque article. Les écarts positifs/négatifs généreront des mouvements d'ajustement.
    </div>

    <table class="data-table">
      <thead><tr>
        <th>Code</th><th>Désignation</th><th>Catégorie</th><th>UM</th>
        <th>Stock théorique</th><th>Stock réel (à saisir)</th>
        <th>Écart</th><th>CMUP</th><th>Valeur écart</th>
      </tr></thead>
      <tbody>
        @for (l of lignesInventaire(); let i = $index; track l.articleId) {
          <tr [class.row-ecart-pos]="l.ecart > 0" [class.row-ecart-neg]="l.ecart < 0">
            <td><strong>{{ l.code }}</strong></td>
            <td>{{ l.designation }}</td>
            <td><span class="badge {{ categorieClass(l.categorie) }}">{{ categorieLabel(l.categorie) }}</span></td>
            <td>{{ l.uniteMesure }}</td>
            <td>{{ l.stockTheorique | number:'1.0-4' }}</td>
            <td>
              <input class="form-input input-qty" type="number" step="0.0001" min="0"
                     [value]="l.stockReel"
                     (input)="mettreAJourStockReel(i, +$any($event.target).value)">
            </td>
            <td [class.text-success]="l.ecart > 0" [class.text-danger]="l.ecart < 0">
              {{ l.ecart > 0 ? '+' : '' }}{{ l.ecart | number:'1.0-4' }}
            </td>
            <td>{{ l.coutMoyen | number:'1.0-2' }}</td>
            <td [class.text-success]="l.valeurEcart > 0" [class.text-danger]="l.valeurEcart < 0">
              {{ l.valeurEcart > 0 ? '+' : '' }}{{ l.valeurEcart | number:'1.0-0' }} FCFA
            </td>
          </tr>
        }
        @empty {
          <tr><td colspan="9" class="empty-cell">Aucun article — créez d'abord des articles dans l'onglet Articles.</td></tr>
        }
      </tbody>
    </table>
  }
</div>

<!-- ─── MODAL ARTICLE ────────────────────────────────────────────────────── -->
@if (modalArticleOuvert()) {
  <div class="modal-backdrop" (click)="fermerModals()">
    <div class="modal-box modal-lg" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>{{ articleEdite()?.id ? 'Modifier article' : 'Nouvel article' }}</h2>
        <button class="modal-close" (click)="fermerModals()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label>Code *</label>
            <input class="form-input" [(ngModel)]="formArticle.code">
          </div>
          <div class="form-group">
            <label>Désignation *</label>
            <input class="form-input" [(ngModel)]="formArticle.designation">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Catégorie *</label>
            <select class="form-input" [(ngModel)]="formArticle.categorie">
              @for (c of categories; track c.value) {
                <option [value]="c.value">{{ c.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Unité de mesure *</label>
            <select class="form-input" [(ngModel)]="formArticle.uniteMesure">
              @for (u of unitesMesure; track u) { <option [value]="u">{{ u }}</option> }
            </select>
          </div>
          <div class="form-group">
            <label>Méthode d'évaluation</label>
            <select class="form-input" [(ngModel)]="formArticle.methodeEvaluation">
              <option value="CMUP">CMUP</option>
              <option value="FIFO">FIFO</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Prix unitaire (FCFA)</label>
            <input class="form-input" type="number" step="0.01" [(ngModel)]="formArticle.prixUnitaire">
          </div>
          <div class="form-group">
            <label>Stock minimum</label>
            <input class="form-input" type="number" step="0.001" [(ngModel)]="formArticle.stockMin">
          </div>
          <div class="form-group">
            <label>Stock maximum</label>
            <input class="form-input" type="number" step="0.001" [(ngModel)]="formArticle.stockMax">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Compte stock (3xxx)</label>
            <input class="form-input" [(ngModel)]="formArticle.compteStockNumero" placeholder="31000">
          </div>
          <div class="form-group">
            <label>Compte charge (6xxx)</label>
            <input class="form-input" [(ngModel)]="formArticle.compteChargeNumero" placeholder="6031">
          </div>
        </div>
        <div class="form-group">
          <label>Description</label>
          <textarea class="form-input" rows="2" [(ngModel)]="formArticle.description"></textarea>
        </div>
        <div class="form-group">
          <label>Notes</label>
          <textarea class="form-input" rows="2" [(ngModel)]="formArticle.notes"></textarea>
        </div>
        <div class="form-group form-check">
          <input type="checkbox" id="articleActif" [(ngModel)]="formArticle.actif">
          <label for="articleActif">Article actif</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="fermerModals()">Annuler</button>
        <button class="btn btn-primary" (click)="sauvegarderArticle()">
          {{ articleEdite()?.id ? 'Mettre à jour' : 'Créer' }}
        </button>
      </div>
    </div>
  </div>
}

<!-- ─── MODAL MOUVEMENT ──────────────────────────────────────────────────── -->
@if (modalMouvementOuvert()) {
  <div class="modal-backdrop" (click)="fermerModals()">
    <div class="modal-box" (click)="$event.stopPropagation()">
      <div class="modal-header">
        <h2>{{ formMouvement.typeMouvement === 'ENTREE' ? 'Entrée de stock' : formMouvement.typeMouvement === 'SORTIE' ? 'Sortie de stock' : 'Mouvement de stock' }}</h2>
        <button class="modal-close" (click)="fermerModals()">×</button>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label>Article *</label>
          <select class="form-input" [(ngModel)]="formMouvement.articleId">
            <option value="">— Sélectionner —</option>
            @for (a of articles(); track a.id) {
              <option [value]="a.id">{{ a.code }} — {{ a.designation }}</option>
            }
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Type de mouvement *</label>
            <select class="form-input" [(ngModel)]="formMouvement.typeMouvement">
              @for (t of typesMouvement; track t.value) {
                <option [value]="t.value">{{ t.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label>Dépôt</label>
            <select class="form-input" [(ngModel)]="formMouvement.depotId">
              <option value="">— Aucun —</option>
              @for (d of depots(); track d.id) {
                <option [value]="d.id">{{ d.nom }}</option>
              }
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Quantité *</label>
            <input class="form-input" type="number" step="0.0001" min="0.0001" [(ngModel)]="formMouvement.quantite">
          </div>
          <div class="form-group">
            <label>Prix unitaire (FCFA)</label>
            <input class="form-input" type="number" step="0.01" [(ngModel)]="formMouvement.prixUnitaire">
          </div>
          <div class="form-group">
            <label>Date *</label>
            <input class="form-input" type="date" [(ngModel)]="formMouvement.dateMouvement">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Référence</label>
            <input class="form-input" [(ngModel)]="formMouvement.reference" placeholder="BC-2024-001">
          </div>
          <div class="form-group">
            <label>Libellé</label>
            <input class="form-input" [(ngModel)]="formMouvement.libelle">
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" (click)="fermerModals()">Annuler</button>
        <button class="btn btn-primary" (click)="sauvegarderMouvement()">Enregistrer</button>
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

    .kpi-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
    .kpi-card { background: white; border-radius: 12px; padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,.1); border-left: 4px solid #e2e8f0; }
    .kpi-blue { border-left-color: #3b82f6; } .kpi-purple { border-left-color: #a855f7; }
    .kpi-orange { border-left-color: #f97316; } .kpi-red { border-left-color: #ef4444; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #1e293b; }
    .kpi-label { font-size: .875rem; color: #64748b; margin-top: 4px; }

    .toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .search-input { flex: 1; min-width: 200px; }
    .select-filter { width: 180px; }

    .data-table { width: 100%; border-collapse: collapse; background: white;
      border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,.1); }
    .data-table th { background: #f8fafc; padding: 12px 14px; text-align: left;
      font-weight: 600; color: #374151; font-size: .8rem; border-bottom: 1px solid #e2e8f0; }
    .data-table td { padding: 10px 14px; border-bottom: 1px solid #f1f5f9; font-size: .8rem; color: #374151; vertical-align: middle; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background: #f8fafc; }
    .row-inactive td { opacity: .55; }
    .row-alert { background: #fff7ed !important; }
    .row-ecart-pos td { background: #f0fdf4 !important; }
    .row-ecart-neg td { background: #fef2f2 !important; }
    .actions-cell { display: flex; gap: 4px; flex-wrap: nowrap; }
    .empty-cell { text-align: center; color: #94a3b8; padding: 40px; }

    .badge { padding: 2px 8px; border-radius: 9999px; font-size: .72rem; font-weight: 600; white-space: nowrap; }
    .badge-mat { background: #e0f2fe; color: #0369a1; }
    .badge-fin { background: #fef9c3; color: #854d0e; }
    .badge-march { background: #dcfce7; color: #166534; }
    .badge-conso { background: #f3e8ff; color: #7c3aed; }
    .badge-embal { background: #f1f5f9; color: #475569; }
    .badge-autre { background: #f1f5f9; color: #475569; }
    .badge-secondary { background: #f1f5f9; color: #475569; }
    .badge-ok { background: #dcfce7; color: #166534; }
    .badge-alerte { background: #fff7ed; color: #c2410c; }
    .badge-rupture { background: #fee2e2; color: #991b1b; }
    .badge-entree { background: #dcfce7; color: #166534; }
    .badge-sortie { background: #fee2e2; color: #991b1b; }
    .badge-ajust { background: #fef9c3; color: #854d0e; }
    .badge-transfert { background: #ede9fe; color: #6d28d9; }

    .text-success { color: #16a34a; } .text-danger { color: #dc2626; }
    .text-orange { color: #f97316; }

    .card { background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,.1); overflow: hidden; }
    .card-header { padding: 14px 20px; border-bottom: 1px solid #e2e8f0; }
    .card-header h3 { margin: 0; font-size: 1rem; font-weight: 700; }
    .alert-header { display: flex; align-items: center; gap: 8px; background: #fff7ed; }
    .mt-4 { margin-top: 16px; }

    .pagination { display: flex; align-items: center; gap: 12px; justify-content: center; margin-top: 16px; color: #64748b; }

    .inventaire-info { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
      padding: 10px 14px; font-size: .875rem; color: #1d4ed8; margin-bottom: 16px;
      display: flex; align-items: center; gap: 8px; }
    .input-qty { width: 100px; padding: 4px 8px; }

    .btn { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;
      font-size: .875rem; font-weight: 500; display: inline-flex; align-items: center; gap: 6px; }
    .btn-primary { background: #3b82f6; color: white; } .btn-primary:hover { background: #2563eb; }
    .btn-ghost { background: transparent; color: #64748b; border: 1px solid #e2e8f0; }
    .btn-ghost:hover { background: #f8fafc; }
    .btn-sm { padding: 5px 10px; font-size: .78rem; }
    .btn-outline { background: white; border: 1px solid #e2e8f0; color: #374151; }
    .btn-outline:hover { background: #f8fafc; border-color: #3b82f6; color: #3b82f6; }
    .btn-success-outline { background: white; border: 1px solid #86efac; color: #166534; }
    .btn-success-outline:hover { background: #dcfce7; }
    .btn-warning-outline { background: white; border: 1px solid #fde68a; color: #92400e; }
    .btn-warning-outline:hover { background: #fffbeb; }
    .btn-danger-outline { background: white; border: 1px solid #fca5a5; color: #991b1b; }
    .btn-danger-outline:hover { background: #fee2e2; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }

    .form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .form-group label { font-size: .8rem; font-weight: 600; color: #374151; }
    .form-input { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px;
      font-size: .875rem; outline: none; width: 100%; box-sizing: border-box; }
    .form-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,.1); }
    .form-row { display: flex; gap: 12px; }
    .form-check { flex-direction: row !important; align-items: center; gap: 8px; }

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

    .loading-spinner { display: flex; align-items: center; gap: 8px; color: #64748b;
      padding: 40px; justify-content: center; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `]
})
export class StocksComponent implements OnInit, OnDestroy {
  @ViewChild('mouvCanvas') mouvCanvasRef!: ElementRef<HTMLCanvasElement>;

  private svc = inject(StockService);
  private cdr = inject(ChangeDetectorRef);

  statsMouv       = signal<StatsMouvements | null>(null);
  selectedExercice = new Date().getFullYear();
  exercices       = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  private mouvChart?: Chart;

  activeTab = signal<Tab>('dashboard');
  tabs = [
    { key: 'dashboard' as Tab, label: 'Dashboard', icon: 'bi-speedometer2' },
    { key: 'articles' as Tab, label: 'Articles', icon: 'bi-box-seam' },
    { key: 'mouvements' as Tab, label: 'Mouvements', icon: 'bi-arrow-left-right' },
    { key: 'inventaire' as Tab, label: 'Inventaire', icon: 'bi-clipboard-check' }
  ];

  dashboard = signal<DashboardStock | null>(null);
  articles = signal<ArticleResponse[]>([]);
  mouvements = signal<MouvementResponse[]>([]);
  depots = signal<DepotResponse[]>([]);
  lignesInventaire = signal<LigneInventaire[]>([]);

  currentPage = signal(0);
  totalPages = signal(1);
  filtreSearch = '';
  filtreCategorie = '';
  filtreActif = 'true';
  filtreDebut = '';
  filtreFin = '';
  filtreTypeMouv = '';
  dateInventaire = new Date().toISOString().slice(0, 10);
  refInventaire = '';

  modalArticleOuvert = signal(false);
  modalMouvementOuvert = signal(false);
  articleEdite = signal<ArticleResponse | null>(null);

  formArticle: ArticleRequest = this.initFormArticle();
  formMouvement: MouvementRequest = this.initFormMouvement();

  categories = [
    { value: 'MATIERE_PREMIERE', label: 'Matière première' },
    { value: 'PRODUIT_FINI', label: 'Produit fini' },
    { value: 'MARCHANDISE', label: 'Marchandise' },
    { value: 'CONSOMMABLE', label: 'Consommable' },
    { value: 'EMBALLAGE', label: 'Emballage' },
    { value: 'AUTRE', label: 'Autre' }
  ];

  typesMouvement = [
    { value: 'ENTREE', label: 'Entrée fournisseur' },
    { value: 'SORTIE', label: 'Sortie / Consommation' },
    { value: 'AJUSTEMENT_POS', label: 'Ajustement positif' },
    { value: 'AJUSTEMENT_NEG', label: 'Ajustement négatif' },
    { value: 'TRANSFERT_ENTREE', label: 'Transfert entrant' },
    { value: 'TRANSFERT_SORTIE', label: 'Transfert sortant' }
  ];

  unitesMesure = ['UNITE', 'KG', 'LITRE', 'METRE', 'M2', 'M3', 'BOITE', 'PALETTE', 'SAC', 'CARTON'];

  ngOnDestroy() {
    this.mouvChart?.destroy();
  }

  onExerciceChange(y: number) {
    this.selectedExercice = +y;
    this.loadStatsMensuel();
  }

  loadStatsMensuel() {
    this.mouvChart?.destroy();
    this.mouvChart = undefined;
    this.svc.getStatsMensuel(this.selectedExercice).subscribe({
      next: s => {
        this.statsMouv.set(s);
        this.cdr.markForCheck();
        Promise.resolve().then(() => this.buildMouvChart());
      }
    });
  }

  private buildMouvChart() {
    const s = this.statsMouv();
    if (!s || !this.mouvCanvasRef?.nativeElement) return;
    if (this.mouvChart) this.mouvChart.destroy();

    const labels  = s.mensuel.map(m => m.label);
    const entrees = s.mensuel.map(m => m.valEntrees);
    const sorties = s.mensuel.map(m => m.valSorties);

    this.mouvChart = new Chart(this.mouvCanvasRef.nativeElement.getContext('2d')!, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Entrées (valeur)',
            data: entrees,
            backgroundColor: 'rgba(59,130,246,0.7)',
            borderColor: 'rgba(59,130,246,1)',
            borderWidth: 1,
          },
          {
            label: 'Sorties (valeur)',
            data: sorties,
            backgroundColor: 'rgba(239,68,68,0.65)',
            borderColor: 'rgba(239,68,68,0.9)',
            borderWidth: 1,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { font: { size: 10 } } },
          y: { ticks: { font: { size: 10 }, callback: (v) => this.fmtK(Number(v)) } }
        },
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: ${this.fmtK(ctx.parsed.y ?? 0)}`
            }
          }
        }
      }
    });
  }

  fmtK(v: number): string {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + ' M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(0) + ' K';
    return v.toFixed(0);
  }

  ngOnInit(): void {
    this.chargerDashboard();
    this.chargerArticles();
    this.chargerDepots();
    this.loadStatsMensuel();
  }

  chargerDashboard(): void {
    this.svc.getDashboard().subscribe(d => this.dashboard.set(d));
  }

  chargerArticles(): void {
    const actif = this.filtreActif ? (this.filtreActif === 'true') : undefined;
    this.svc.listerArticles({
      categorie: this.filtreCategorie || undefined,
      actif,
      search: this.filtreSearch || undefined,
      page: this.currentPage(),
      size: 25
    }).subscribe(p => {
      this.articles.set(p.content);
      this.totalPages.set(p.totalPages);
    });
  }

  chargerMouvements(): void {
    this.svc.listerMouvements({
      type: this.filtreTypeMouv || undefined,
      debut: this.filtreDebut || undefined,
      fin: this.filtreFin || undefined,
      page: 0, size: 50
    }).subscribe(p => this.mouvements.set(p.content));
  }

  chargerDepots(): void {
    this.svc.listerDepots().subscribe(d => this.depots.set(d));
  }

  chargerInventaire(): void {
    this.svc.preparerInventaire().subscribe(l => this.lignesInventaire.set(l));
  }

  goPage(p: number): void {
    this.currentPage.set(p);
    this.chargerArticles();
  }

  // ── Articles ────────────────────────────────────────────────────────────

  ouvrirModalArticle(a: ArticleResponse | null): void {
    this.articleEdite.set(a);
    if (a) {
      this.formArticle = {
        code: a.code, designation: a.designation, description: a.description,
        categorie: a.categorie, uniteMesure: a.uniteMesure,
        prixUnitaire: a.prixUnitaire, stockMin: a.stockMin, stockMax: a.stockMax ?? undefined,
        compteStockNumero: a.compteStockNumero, compteChargeNumero: a.compteChargeNumero,
        methodeEvaluation: a.methodeEvaluation, actif: a.actif, notes: a.notes
      };
    } else {
      this.formArticle = this.initFormArticle();
    }
    this.modalArticleOuvert.set(true);
  }

  sauvegarderArticle(): void {
    const id = this.articleEdite()?.id;
    const obs = id
      ? this.svc.mettreAJourArticle(id, this.formArticle)
      : this.svc.creerArticle(this.formArticle);
    obs.subscribe(() => {
      this.fermerModals();
      this.chargerArticles();
      this.chargerDashboard();
    });
  }

  supprimerArticle(id: string): void {
    if (!confirm('Supprimer cet article ? (uniquement si stock = 0)')) return;
    this.svc.supprimerArticle(id).subscribe(() => {
      this.chargerArticles();
      this.chargerDashboard();
    });
  }

  // ── Mouvements ──────────────────────────────────────────────────────────

  ouvrirModalMouvement(): void {
    this.formMouvement = this.initFormMouvement();
    this.modalMouvementOuvert.set(true);
  }

  ouvrirMouvementRapide(a: ArticleResponse): void {
    this.formMouvement = { ...this.initFormMouvement(), articleId: a.id, typeMouvement: 'ENTREE' };
    this.modalMouvementOuvert.set(true);
  }

  ouvrirSortieRapide(a: ArticleResponse): void {
    this.formMouvement = { ...this.initFormMouvement(), articleId: a.id, typeMouvement: 'SORTIE' };
    this.modalMouvementOuvert.set(true);
  }

  sauvegarderMouvement(): void {
    this.svc.enregistrerMouvement(this.formMouvement).subscribe(() => {
      this.fermerModals();
      this.chargerArticles();
      this.chargerMouvements();
      this.chargerDashboard();
    });
  }

  // ── Inventaire ──────────────────────────────────────────────────────────

  mettreAJourStockReel(index: number, valeur: number): void {
    const lignes = [...this.lignesInventaire()];
    const l = { ...lignes[index] };
    l.stockReel = valeur;
    l.ecart = valeur - l.stockTheorique;
    l.valeurEcart = l.ecart * l.coutMoyen;
    lignes[index] = l;
    this.lignesInventaire.set(lignes);
  }

  validerInventaire(): void {
    const lignesAvecEcart = this.lignesInventaire().filter(l => l.ecart !== 0);
    if (lignesAvecEcart.length === 0) {
      alert('Aucun écart détecté — aucun ajustement nécessaire.');
      return;
    }
    if (!confirm(`Valider l'inventaire ? ${lignesAvecEcart.length} ajustement(s) vont être créés.`)) return;
    const req = {
      lignes: this.lignesInventaire().map(l => ({ articleId: l.articleId, stockReel: l.stockReel })),
      date: this.dateInventaire,
      reference: this.refInventaire || undefined
    };
    this.svc.ajusterInventaire(req).subscribe(() => {
      this.chargerArticles();
      this.chargerDashboard();
      this.chargerInventaire();
    });
  }

  fermerModals(): void {
    this.modalArticleOuvert.set(false);
    this.modalMouvementOuvert.set(false);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  isEntree(t: string): boolean {
    return t === 'ENTREE' || t === 'AJUSTEMENT_POS' || t === 'TRANSFERT_ENTREE';
  }

  categorieLabel(c: string): string {
    return this.categories.find(x => x.value === c)?.label ?? c;
  }

  categorieClass(c: string): string {
    const map: Record<string, string> = {
      MATIERE_PREMIERE: 'badge-mat', PRODUIT_FINI: 'badge-fin',
      MARCHANDISE: 'badge-march', CONSOMMABLE: 'badge-conso',
      EMBALLAGE: 'badge-embal', AUTRE: 'badge-autre'
    };
    return map[c] ?? 'badge-secondary';
  }

  alerteClass(n: string): string {
    return n === 'RUPTURE' ? 'badge-rupture' : n === 'ALERTE' ? 'badge-alerte' : 'badge-ok';
  }

  mouvTypeLabel(t: string): string {
    return this.typesMouvement.find(x => x.value === t)?.label ?? t;
  }

  mouvTypeClass(t: string): string {
    if (t === 'ENTREE' || t === 'TRANSFERT_ENTREE') return 'badge-entree';
    if (t === 'SORTIE' || t === 'TRANSFERT_SORTIE') return 'badge-sortie';
    return 'badge-ajust';
  }

  private initFormArticle(): ArticleRequest {
    return { code: '', designation: '', categorie: 'MARCHANDISE',
             uniteMesure: 'UNITE', prixUnitaire: 0, stockMin: 0,
             methodeEvaluation: 'CMUP', actif: true };
  }

  private initFormMouvement(): MouvementRequest {
    return { articleId: '', typeMouvement: 'ENTREE', quantite: 1,
             dateMouvement: new Date().toISOString().slice(0, 10) };
  }
}
