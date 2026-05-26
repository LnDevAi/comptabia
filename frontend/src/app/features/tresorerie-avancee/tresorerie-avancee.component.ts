import {
  Component, ChangeDetectionStrategy, ChangeDetectorRef,
  inject, signal, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TresorerieAvanceeService } from '../../core/services/tresorerie-avancee.service';
import {
  CompteBancaireResponse, CompteBancaireRequest, MouvementResponse,
  AlerteResponse, TresorerieDashboard, PageResponse, TypeCompte
} from '../../core/models/tresorerie-avancee.model';

type Tab = 'dashboard' | 'comptes' | 'mouvements' | 'alertes';

@Component({
  selector: 'app-tresorerie-avancee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Trésorerie</h1>
      <p class="text-sm text-gray-500 mt-0.5">Position de trésorerie, comptes bancaires, mouvements et alertes</p>
    </div>
  </div>

  <!-- Tabs -->
  <div class="border-b border-gray-200">
    <nav class="flex gap-1 -mb-px">
      @for (t of tabs; track t.id) {
        <button (click)="activeTab.set(t.id)"
                [class]="activeTab() === t.id
                  ? 'border-b-2 border-blue-600 text-blue-700 px-4 py-2.5 text-sm font-medium'
                  : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 px-4 py-2.5 text-sm font-medium'">
          {{ t.label }}
          @if (t.id === 'alertes' && alertesBadge() > 0) {
            <span class="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-xs font-bold bg-red-500 text-white rounded-full">
              {{ alertesBadge() }}
            </span>
          }
        </button>
      }
    </nav>
  </div>

  <!-- ═══ TAB DASHBOARD ═══ -->
  @if (activeTab() === 'dashboard') {
    @if (dash()) {
      <!-- KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4 col-span-2 md:col-span-1">
          <p class="text-xs text-gray-500">Position consolidée</p>
          <p class="text-2xl font-bold mt-1"
             [class]="dash()!.soldeConsolide >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ fmt(dash()!.soldeConsolide) }}
          </p>
        </div>
        <div class="bg-blue-50 rounded-xl border border-blue-200 p-4">
          <p class="text-xs text-blue-700">Comptes actifs</p>
          <p class="text-2xl font-bold text-blue-800 mt-1">{{ dash()!.nombreComptes }}</p>
        </div>
        <div [class]="dash()!.alertesActives > 0 ? 'bg-red-50 rounded-xl border border-red-200 p-4' : 'bg-green-50 rounded-xl border border-green-200 p-4'">
          <p [class]="dash()!.alertesActives > 0 ? 'text-xs text-red-700' : 'text-xs text-green-700'">Alertes actives</p>
          <p [class]="dash()!.alertesActives > 0 ? 'text-2xl font-bold text-red-800 mt-1' : 'text-2xl font-bold text-green-800 mt-1'">
            {{ dash()!.alertesActives }}
          </p>
        </div>
      </div>

      <!-- Comptes soldes -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-5 py-3 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-700">
          Soldes par compte
        </div>
        <div class="divide-y divide-gray-100">
          @for (c of dash()!.comptes; track c.id) {
            <div class="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
              <div class="flex items-center gap-3">
                <span class="text-lg">{{ typeIcon(c.typeCompte) }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-800">{{ c.libelle }}</p>
                  @if (c.banque) { <p class="text-xs text-gray-400">{{ c.banque }}</p> }
                </div>
                @if (c.enAlerte) {
                  <span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">⚠ Alerte</span>
                }
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold" [class]="c.soldeReel >= 0 ? 'text-gray-900' : 'text-red-600'">
                  {{ fmt(c.soldeReel) }}
                </p>
                @if (c.soldeDate) { <p class="text-xs text-gray-400">au {{ c.soldeDate }}</p> }
              </div>
            </div>
          }
          @if (dash()!.comptes.length === 0) {
            <p class="text-center py-6 text-gray-400 text-sm">Aucun compte bancaire configuré</p>
          }
        </div>
      </div>

      <!-- Derniers mouvements -->
      @if (dash()!.derniersMovements.length > 0) {
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-3 border-b border-gray-100 bg-gray-50 text-sm font-semibold text-gray-700">
            Derniers mouvements
          </div>
          <table class="w-full text-sm">
            <tbody>
              @for (m of dash()!.derniersMovements; track m.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="px-5 py-2.5 text-gray-400 text-xs whitespace-nowrap">{{ m.dateOperation }}</td>
                  <td class="px-3 py-2.5 text-gray-800">{{ m.libelle }}</td>
                  <td class="px-3 py-2.5 text-gray-500 text-xs">{{ m.compteLibelle }}</td>
                  <td class="px-3 py-2.5 text-right font-medium">{{ fmt(m.montant) }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    } @else {
      <div class="text-center py-8 text-gray-400 text-sm">Chargement…</div>
    }
  }

  <!-- ═══ TAB COMPTES ═══ -->
  @if (activeTab() === 'comptes') {
    <div class="space-y-4">
      <div class="flex justify-end gap-3">
        <button (click)="showCompteForm.set(true)"
                class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          + Nouveau compte
        </button>
      </div>

      <!-- Import OFX section -->
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">Import relevé OFX</h3>
        <div class="flex items-end gap-3 flex-wrap">
          <div>
            <label class="text-xs text-gray-500 block mb-1">Numéro de compte comptable</label>
            <input type="text" [(ngModel)]="ofxCompteNumero" placeholder="512100"
                   class="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono w-32">
          </div>
          <label class="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 border border-gray-300">
            {{ ofxFile() ? ofxFile()!.name : 'Choisir fichier OFX' }}
            <input type="file" accept=".ofx,.qfx,.xml" class="hidden" (change)="onOFXFile($event)">
          </label>
          <button (click)="importOFX()" [disabled]="!ofxFile() || !ofxCompteNumero.trim()"
                  class="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
            Importer
          </button>
          @if (ofxResult()) {
            <span class="text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              {{ ofxResult()!.message }}
            </span>
          }
        </div>
      </div>

      <!-- Compte form -->
      @if (showCompteForm()) {
        <div class="bg-blue-50 rounded-xl border border-blue-200 p-5 space-y-4">
          <h3 class="text-sm font-semibold text-blue-800">{{ editingCompte() ? 'Modifier' : 'Nouveau' }} compte bancaire</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Libellé <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="cForm.libelle" placeholder="Compte courant BNP"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Banque</label>
              <input type="text" [(ngModel)]="cForm.banque" placeholder="BNP Paribas"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Type</label>
              <select [(ngModel)]="cForm.typeCompte"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="COURANT">Courant</option>
                <option value="EPARGNE">Épargne</option>
                <option value="CAISSE">Caisse</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">IBAN</label>
              <input type="text" [(ngModel)]="cForm.iban" placeholder="BF12 XXXX XXXX XXXX"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase">
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Compte comptable</label>
              <input type="text" [(ngModel)]="cForm.compteComptableNumero" placeholder="512100"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono">
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Seuil alerte (FCFA)</label>
              <input type="number" [(ngModel)]="cForm.seuilAlerte" placeholder="0"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
          </div>
          <div class="flex gap-3">
            <button (click)="saveCompte()" [disabled]="!cForm.libelle?.trim()"
                    class="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {{ editingCompte() ? 'Enregistrer' : 'Créer' }}
            </button>
            <button (click)="cancelCompteForm()" class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Annuler
            </button>
          </div>
          @if (compteError()) { <p class="text-xs text-red-600">{{ compteError() }}</p> }
        </div>
      }

      <!-- Comptes list -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (comptes().length === 0) {
          <div class="text-center py-12 text-gray-400">
            <p class="text-sm">Aucun compte bancaire configuré</p>
            <p class="text-xs mt-1">Ajoutez vos comptes pour suivre votre position de trésorerie</p>
          </div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-5 py-2 text-left">Compte</th>
                <th class="px-3 py-2 text-left">Banque / IBAN</th>
                <th class="px-3 py-2 text-right">Solde réel</th>
                <th class="px-3 py-2 text-right">Seuil alerte</th>
                <th class="px-3 py-2 text-center">Statut</th>
                <th class="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (c of comptes(); track c.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="px-5 py-2.5">
                    <div class="flex items-center gap-2">
                      <span>{{ typeIcon(c.typeCompte) }}</span>
                      <div>
                        <p class="font-medium text-gray-800">{{ c.libelle }}</p>
                        @if (c.compteComptableNumero) {
                          <p class="text-xs text-gray-400 font-mono">{{ c.compteComptableNumero }}</p>
                        }
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-2.5">
                    <p class="text-gray-600">{{ c.banque || '—' }}</p>
                    @if (c.iban) { <p class="text-xs text-gray-400 font-mono">{{ c.iban }}</p> }
                  </td>
                  <td class="px-3 py-2.5 text-right font-semibold"
                      [class]="c.soldeReel >= 0 ? 'text-gray-900' : 'text-red-600'">
                    {{ fmt(c.soldeReel) }}
                    @if (c.soldeDate) { <br><span class="text-xs text-gray-400 font-normal">au {{ c.soldeDate }}</span> }
                  </td>
                  <td class="px-3 py-2.5 text-right text-gray-500">{{ fmt(c.seuilAlerte) }}</td>
                  <td class="px-3 py-2.5 text-center">
                    @if (c.enAlerte) {
                      <span class="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">⚠ Alerte</span>
                    } @else {
                      <span class="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">OK</span>
                    }
                  </td>
                  <td class="px-3 py-2.5">
                    <div class="flex items-center justify-center gap-1">
                      <button (click)="openUpdateSolde(c)"
                              class="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50">
                        Solde
                      </button>
                      <button (click)="editCompte(c)"
                              class="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100">
                        Modifier
                      </button>
                      <button (click)="deleteCompte(c)"
                              class="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  }

  <!-- ═══ TAB MOUVEMENTS ═══ -->
  @if (activeTab() === 'mouvements') {
    <div class="space-y-4">
      <!-- Filters + New -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label class="text-xs text-gray-500 block mb-1">Compte</label>
          <select [(ngModel)]="mvtFilterCompte" (ngModelChange)="loadMouvements()"
                  class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">Tous les comptes</option>
            @for (c of comptes(); track c.id) {
              <option [value]="c.id">{{ c.libelle }}</option>
            }
          </select>
        </div>
        <button (click)="showMvtForm.set(!showMvtForm())"
                class="ml-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          {{ showMvtForm() ? '— Fermer' : '+ Nouveau mouvement' }}
        </button>
      </div>

      <!-- Mouvement form -->
      @if (showMvtForm()) {
        <div class="bg-blue-50 rounded-xl border border-blue-200 p-5 space-y-4">
          <h3 class="text-sm font-semibold text-blue-800">Enregistrer un mouvement</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label class="text-xs text-gray-600 block mb-1">Compte source <span class="text-red-500">*</span></label>
              <select [(ngModel)]="mForm.compteId"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">— Sélectionner —</option>
                @for (c of comptes(); track c.id) {
                  @if (c.actif) { <option [value]="c.id">{{ c.libelle }}</option> }
                }
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Type <span class="text-red-500">*</span></label>
              <select [(ngModel)]="mForm.typeMouvement"
                      class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="VIREMENT_INTERNE">Virement interne</option>
                <option value="REMISE_CHEQUES">Remise chèques</option>
                <option value="DEPOT_ESPECES">Dépôt espèces</option>
                <option value="RETRAIT_ESPECES">Retrait espèces</option>
                <option value="FRAIS_BANCAIRES">Frais bancaires</option>
                <option value="ENCAISSEMENT">Encaissement</option>
                <option value="DECAISSEMENT">Décaissement</option>
                <option value="AUTRE">Autre</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Montant <span class="text-red-500">*</span></label>
              <input type="number" [(ngModel)]="mForm.montant" placeholder="0"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Libellé <span class="text-red-500">*</span></label>
              <input type="text" [(ngModel)]="mForm.libelle" placeholder="Description du mouvement"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
            <div>
              <label class="text-xs text-gray-600 block mb-1">Date <span class="text-red-500">*</span></label>
              <input type="date" [(ngModel)]="mForm.dateOperation"
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            </div>
            @if (mForm.typeMouvement === 'VIREMENT_INTERNE') {
              <div>
                <label class="text-xs text-gray-600 block mb-1">Compte destinataire</label>
                <select [(ngModel)]="mForm.compteDestId"
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option [ngValue]="null">— Aucun —</option>
                  @for (c of comptes(); track c.id) {
                    @if (c.actif && c.id !== mForm.compteId) {
                      <option [value]="c.id">{{ c.libelle }}</option>
                    }
                  }
                </select>
              </div>
            }
          </div>
          <div class="flex gap-3">
            <button (click)="saveMouvement()"
                    [disabled]="!mForm.compteId || !mForm.libelle?.trim() || !mForm.montant || !mForm.dateOperation"
                    class="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
              Enregistrer
            </button>
            <button (click)="showMvtForm.set(false)" class="px-4 py-2 text-sm text-gray-600">Annuler</button>
          </div>
        </div>
      }

      <!-- Mouvements list -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        @if (mvtLoading()) {
          <div class="text-center py-6 text-gray-400 text-sm">Chargement…</div>
        } @else if (mouvements().length === 0) {
          <div class="text-center py-10 text-gray-400 text-sm">Aucun mouvement enregistré</div>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-5 py-2 text-left">Date</th>
                <th class="px-3 py-2 text-left">Libellé</th>
                <th class="px-3 py-2 text-left">Compte</th>
                <th class="px-3 py-2 text-left">Type</th>
                <th class="px-3 py-2 text-right">Montant</th>
                <th class="px-3 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (m of mouvements(); track m.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="px-5 py-2.5 text-gray-500 whitespace-nowrap">{{ m.dateOperation }}</td>
                  <td class="px-3 py-2.5 text-gray-800 max-w-[200px] truncate">{{ m.libelle }}</td>
                  <td class="px-3 py-2.5 text-gray-500 text-xs">
                    {{ m.compteLibelle }}
                    @if (m.compteDestLibelle) { <span class="text-gray-400"> → {{ m.compteDestLibelle }}</span> }
                  </td>
                  <td class="px-3 py-2.5">
                    <span class="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{{ mvtLabel(m.typeMouvement) }}</span>
                  </td>
                  <td class="px-3 py-2.5 text-right font-medium text-gray-900">{{ fmt(m.montant) }}</td>
                  <td class="px-3 py-2.5 text-center">
                    <button (click)="deleteMouvement(m)"
                            class="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50">✕</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          <!-- Pagination -->
          @if (mvtTotalPages() > 1) {
            <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <span class="text-xs text-gray-500">{{ mvtTotal() }} mouvement(s)</span>
              <div class="flex gap-2">
                <button (click)="changeMvtPage(mvtPage() - 1)" [disabled]="mvtPage() === 0"
                        class="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">← Préc.</button>
                <span class="px-3 py-1 text-xs text-gray-600">{{ mvtPage() + 1 }} / {{ mvtTotalPages() }}</span>
                <button (click)="changeMvtPage(mvtPage() + 1)" [disabled]="mvtPage() >= mvtTotalPages() - 1"
                        class="px-3 py-1 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50">Suiv. →</button>
              </div>
            </div>
          }
        }
      </div>
    </div>
  }

  <!-- ═══ TAB ALERTES ═══ -->
  @if (activeTab() === 'alertes') {
    <div class="space-y-4">
      <div class="flex gap-3 items-center">
        <button (click)="filterAlertes(false)" [class]="!showAcquittees() ? 'px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg' : 'px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200'">
          Actives ({{ alertesBadge() }})
        </button>
        <button (click)="filterAlertes(true)" [class]="showAcquittees() ? 'px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg' : 'px-4 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200'">
          Acquittées
        </button>
      </div>

      <div class="space-y-3">
        @if (alertes().length === 0) {
          <div class="bg-green-50 rounded-xl border border-green-200 p-6 text-center">
            <p class="text-sm text-green-700">{{ showAcquittees() ? 'Aucune alerte acquittée' : '✓ Aucune alerte active' }}</p>
          </div>
        }
        @for (a of alertes(); track a.id) {
          <div [class]="a.typeAlerte === 'SOLDE_NEGATIF' ? 'bg-red-50 border border-red-200 rounded-xl p-4' : 'bg-orange-50 border border-orange-200 rounded-xl p-4'">
            <div class="flex items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <span [class]="a.typeAlerte === 'SOLDE_NEGATIF' ? 'text-xs font-semibold text-red-700 uppercase' : 'text-xs font-semibold text-orange-700 uppercase'">
                    {{ a.typeAlerte === 'SOLDE_NEGATIF' ? 'Solde négatif' : 'Seuil minimum' }}
                  </span>
                  <span class="text-xs text-gray-400">· {{ a.compteLibelle }}</span>
                </div>
                <p class="text-sm text-gray-800">{{ a.message }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ a.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>
              </div>
              @if (!a.acquittee) {
                <button (click)="acquitter(a)" class="shrink-0 px-3 py-1.5 bg-white border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
                  Acquitter
                </button>
              }
            </div>
          </div>
        }
      </div>
    </div>
  }

</div>

<!-- Solde update modal -->
@if (soldeModal()) {
  <div class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
       (click)="$event.target === $event.currentTarget && closeSoldeModal()">
    <div class="bg-white rounded-2xl shadow-xl w-80 p-6 space-y-4">
      <h3 class="text-sm font-semibold text-gray-800">Mettre à jour le solde — {{ soldeModal()!.libelle }}</h3>
      <div>
        <label class="text-xs text-gray-600 block mb-1">Nouveau solde (FCFA)</label>
        <input type="number" [(ngModel)]="soldeValue" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
      </div>
      <div>
        <label class="text-xs text-gray-600 block mb-1">Date du solde</label>
        <input type="date" [(ngModel)]="soldeDate" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
      </div>
      <div class="flex gap-3">
        <button (click)="saveSolde()" class="flex-1 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
          Enregistrer
        </button>
        <button (click)="closeSoldeModal()" class="px-4 py-2 text-sm text-gray-600">Annuler</button>
      </div>
    </div>
  </div>
}
  `
})
export class TresorerieAvanceeComponent implements OnInit {

  readonly svc = inject(TresorerieAvanceeService);
  private cdr = inject(ChangeDetectorRef);

  activeTab = signal<Tab>('dashboard');
  tabs = [
    { id: 'dashboard' as Tab, label: 'Tableau de bord' },
    { id: 'comptes' as Tab, label: 'Comptes bancaires' },
    { id: 'mouvements' as Tab, label: 'Mouvements' },
    { id: 'alertes' as Tab, label: 'Alertes' },
  ];

  // State
  dash             = signal<TresorerieDashboard | null>(null);
  comptes          = signal<CompteBancaireResponse[]>([]);
  mouvements       = signal<MouvementResponse[]>([]);
  mvtLoading       = signal(false);
  mvtTotal         = signal(0);
  mvtTotalPages    = signal(0);
  mvtPage          = signal(0);
  alertes          = signal<AlerteResponse[]>([]);
  alertesBadge     = signal(0);
  showAcquittees   = signal(false);

  // Compte form
  showCompteForm = signal(false);
  editingCompte  = signal<CompteBancaireResponse | null>(null);
  compteError    = signal('');
  cForm: CompteBancaireRequest & { typeCompte: TypeCompte } = this.emptyCompteForm();

  // Mouvement form
  showMvtForm = signal(false);
  mvtFilterCompte = '';
  mForm = this.emptyMvtForm();

  // Solde modal
  soldeModal = signal<CompteBancaireResponse | null>(null);
  soldeValue = 0;
  soldeDate  = '';

  // OFX
  ofxFile        = signal<File | null>(null);
  ofxCompteNumero = '';
  ofxResult      = signal<{ message: string } | null>(null);

  ngOnInit() {
    this.loadDashboard();
    this.loadComptes();
    this.loadAlertesBadge();
  }

  loadDashboard() {
    this.svc.dashboard().subscribe(d => { this.dash.set(d); this.cdr.markForCheck(); });
  }

  loadComptes() {
    this.svc.listComptes().subscribe(c => { this.comptes.set(c); this.cdr.markForCheck(); });
  }

  loadMouvements() {
    this.mvtLoading.set(true);
    const cid = this.mvtFilterCompte || undefined;
    this.svc.listMouvements(cid, this.mvtPage()).subscribe({
      next: (p) => {
        this.mouvements.set(p.content);
        this.mvtTotal.set(p.totalElements);
        this.mvtTotalPages.set(p.totalPages);
        this.mvtLoading.set(false);
        this.cdr.markForCheck();
      },
      error: () => { this.mvtLoading.set(false); this.cdr.markForCheck(); }
    });
  }

  loadAlertesBadge() {
    this.svc.listAlertes(false).subscribe(a => {
      this.alertesBadge.set(a.length);
      this.cdr.markForCheck();
    });
  }

  filterAlertes(acquittees: boolean) {
    this.showAcquittees.set(acquittees);
    this.svc.listAlertes(acquittees).subscribe(a => { this.alertes.set(a); this.cdr.markForCheck(); });
  }

  // Tab change
  onTabChange(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'mouvements') this.loadMouvements();
    if (tab === 'alertes') this.filterAlertes(this.showAcquittees());
  }

  changeMvtPage(p: number) {
    this.mvtPage.set(p);
    this.loadMouvements();
  }

  // Compte CRUD
  saveCompte() {
    this.compteError.set('');
    const dto: CompteBancaireRequest = { ...this.cForm };
    const obs = this.editingCompte()
        ? this.svc.updateCompte(this.editingCompte()!.id, dto)
        : this.svc.createCompte(dto);
    obs.subscribe({
      next: () => {
        this.cancelCompteForm();
        this.loadComptes();
        this.loadDashboard();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.compteError.set(err?.error?.message || 'Erreur lors de l\'enregistrement');
        this.cdr.markForCheck();
      }
    });
  }

  editCompte(c: CompteBancaireResponse) {
    this.editingCompte.set(c);
    this.cForm = {
      libelle: c.libelle,
      banque: c.banque ?? '',
      iban: c.iban ?? '',
      bic: c.bic ?? '',
      compteComptableNumero: c.compteComptableNumero ?? '',
      typeCompte: c.typeCompte,
      seuilAlerte: c.seuilAlerte,
    };
    this.showCompteForm.set(true);
  }

  cancelCompteForm() {
    this.showCompteForm.set(false);
    this.editingCompte.set(null);
    this.cForm = this.emptyCompteForm();
    this.compteError.set('');
  }

  deleteCompte(c: CompteBancaireResponse) {
    if (!confirm(`Désactiver le compte « ${c.libelle} » ?`)) return;
    this.svc.deleteCompte(c.id).subscribe(() => { this.loadComptes(); this.loadDashboard(); this.cdr.markForCheck(); });
  }

  // Solde update
  openUpdateSolde(c: CompteBancaireResponse) {
    this.soldeModal.set(c);
    this.soldeValue = c.soldeReel;
    this.soldeDate  = c.soldeDate ?? new Date().toISOString().split('T')[0];
  }

  saveSolde() {
    if (!this.soldeModal()) return;
    this.svc.updateSolde(this.soldeModal()!.id, { solde: this.soldeValue, date: this.soldeDate }).subscribe(() => {
      this.closeSoldeModal();
      this.loadComptes();
      this.loadDashboard();
      this.loadAlertesBadge();
      this.cdr.markForCheck();
    });
  }

  closeSoldeModal() { this.soldeModal.set(null); }

  // Mouvements
  saveMouvement() {
    this.svc.createMouvement({
      compteId: this.mForm.compteId,
      compteDestId: this.mForm.compteDestId || null,
      typeMouvement: this.mForm.typeMouvement,
      libelle: this.mForm.libelle,
      montant: this.mForm.montant,
      dateOperation: this.mForm.dateOperation,
    }).subscribe(() => {
      this.mForm = this.emptyMvtForm();
      this.showMvtForm.set(false);
      this.loadMouvements();
      this.loadDashboard();
      this.loadAlertesBadge();
      this.cdr.markForCheck();
    });
  }

  deleteMouvement(m: MouvementResponse) {
    if (!confirm(`Supprimer ce mouvement ?`)) return;
    this.svc.deleteMouvement(m.id).subscribe(() => { this.loadMouvements(); this.loadDashboard(); this.cdr.markForCheck(); });
  }

  // Alertes
  acquitter(a: AlerteResponse) {
    this.svc.acquitter(a.id).subscribe(() => {
      this.filterAlertes(this.showAcquittees());
      this.loadAlertesBadge();
      this.cdr.markForCheck();
    });
  }

  // OFX
  onOFXFile(event: Event) {
    const f = (event.target as HTMLInputElement).files?.[0];
    if (f) { this.ofxFile.set(f); this.ofxResult.set(null); }
  }

  importOFX() {
    if (!this.ofxFile() || !this.ofxCompteNumero.trim()) return;
    this.svc.importerOFX(this.ofxCompteNumero.trim(), this.ofxFile()!).subscribe({
      next: (r) => { this.ofxResult.set(r); this.ofxFile.set(null); this.cdr.markForCheck(); },
      error: () => this.cdr.markForCheck()
    });
  }

  // Helpers
  private emptyCompteForm(): CompteBancaireRequest & { typeCompte: TypeCompte } {
    return { libelle: '', banque: '', iban: '', bic: '', compteComptableNumero: '', typeCompte: 'COURANT', seuilAlerte: 0 };
  }

  private emptyMvtForm() {
    return { compteId: '', compteDestId: null as string | null, typeMouvement: 'ENCAISSEMENT', libelle: '', montant: 0, dateOperation: new Date().toISOString().split('T')[0] };
  }

  typeIcon(t: TypeCompte | string): string {
    return { COURANT: '🏦', EPARGNE: '💰', CAISSE: '💵', AUTRE: '📋' }[t as TypeCompte] ?? '🏦';
  }

  mvtLabel(t: string): string {
    return {
      VIREMENT_INTERNE: 'Virement interne',
      REMISE_CHEQUES: 'Remise chèques',
      DEPOT_ESPECES: 'Dépôt espèces',
      RETRAIT_ESPECES: 'Retrait espèces',
      FRAIS_BANCAIRES: 'Frais bancaires',
      ENCAISSEMENT: 'Encaissement',
      DECAISSEMENT: 'Décaissement',
      AUTRE: 'Autre',
    }[t] ?? t;
  }

  fmt(n: number | null | undefined): string {
    if (n == null) return '—';
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n) + ' FCFA';
  }
}
