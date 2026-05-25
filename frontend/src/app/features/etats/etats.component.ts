import {
  ChangeDetectionStrategy, Component, computed, inject, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { EtatFinancierService } from '../../core/services/etat-financier.service';
import {
  BalanceData, BilanData, CompteResultatData, GrandLivreData,
  JournalLivreData, EtatRecettesDepensesData, EtatTresorerieData,
  FluxTresorerieData, EvcapData,
  NoteAnnexe, NoteAnnexeCreate,
  NoteCatalogue, NoteComputeeData, NotesGroupe, EtatTab
} from '../../core/models/etats.model';

interface TabDef { id: EtatTab; label: string; group: 'sn' | 'smt' | 'commun'; }

const TABS: TabDef[] = [
  { id: 'balance',          label: 'Balance',              group: 'sn'     },
  { id: 'bilan',            label: 'Bilan',                group: 'sn'     },
  { id: 'compte-resultat',  label: 'Compte de résultat',   group: 'sn'     },
  { id: 'grand-livre',      label: 'Grand livre',          group: 'sn'     },
  { id: 'journal',          label: 'Journal',              group: 'sn'     },
  { id: 'recettes-depenses',label: 'Recettes / Dépenses',  group: 'smt'    },
  { id: 'tresorerie',       label: 'Trésorerie (SMT)',     group: 'smt'    },
  { id: 'flux-tresorerie',  label: 'Flux de trésorerie',   group: 'sn'     },
  { id: 'evcap',            label: 'Var. Capitaux Propres', group: 'sn'    },
  { id: 'notes',            label: 'Notes annexes',        group: 'commun' },
];

@Component({
  selector: 'app-etats',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 space-y-4">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-xl font-bold text-gray-800">États financiers</h1>
    <div class="flex items-center gap-3">
      <label class="text-sm text-gray-600">Exercice</label>
      <select [ngModel]="exercice()" (ngModelChange)="onExerciceChange($event)"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of years(); track y) {
          <option [value]="y">{{ y }}</option>
        }
      </select>
      <button (click)="print()"
              class="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600">
        Imprimer
      </button>
      <button (click)="exportCsv()"
              class="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600">
        Export CSV
      </button>
    </div>
  </div>

  <!-- Tabs -->
  <div class="flex flex-wrap gap-1 border-b border-gray-200 pb-0">
    @for (tab of tabs; track tab.id) {
      <button
        (click)="selectTab(tab.id)"
        [class]="tabClass(tab)"
        class="px-3 py-2 text-xs font-medium rounded-t-lg -mb-px transition-colors">
        <span class="mr-1 text-gray-400">
          {{ tab.group === 'smt' ? '[SMT]' : tab.group === 'sn' ? '[SN]' : '' }}
        </span>{{ tab.label }}
      </button>
    }
  </div>

  <!-- Content -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">

    @if (loading()) {
      <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
    } @else if (error()) {
      <div class="flex items-center justify-center h-40 text-red-500 text-sm">{{ error() }}</div>
    } @else {

      <!-- Balance -->
      @if (activeTab() === 'balance' && balance()) {
        <div class="overflow-x-auto">
          <div class="px-4 py-3 border-b border-gray-100">
            <h2 class="font-semibold text-gray-700">Balance des comptes – Exercice {{ balance()!.exercice }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-2 text-left">Compte</th>
                <th class="px-4 py-2 text-left">Intitulé</th>
                <th class="px-4 py-2 text-right">Débit</th>
                <th class="px-4 py-2 text-right">Crédit</th>
                <th class="px-4 py-2 text-right">Solde D</th>
                <th class="px-4 py-2 text-right">Solde C</th>
              </tr>
            </thead>
            <tbody>
              @for (l of balance()!.lignes; track l.numero) {
                <tr class="border-t border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-1.5 font-mono text-xs">{{ l.numero }}</td>
                  <td class="px-4 py-1.5">{{ l.intitule }}</td>
                  <td class="px-4 py-1.5 text-right font-mono">{{ l.totalDebit | number:'1.2-2' }}</td>
                  <td class="px-4 py-1.5 text-right font-mono">{{ l.totalCredit | number:'1.2-2' }}</td>
                  <td class="px-4 py-1.5 text-right font-mono text-blue-700">{{ l.soldeDebiteur | number:'1.2-2' }}</td>
                  <td class="px-4 py-1.5 text-right font-mono text-green-700">{{ l.soldeCrediteur | number:'1.2-2' }}</td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-gray-50 font-semibold text-sm border-t-2 border-gray-300">
              <tr>
                <td colspan="2" class="px-4 py-2">TOTAUX</td>
                <td class="px-4 py-2 text-right font-mono">{{ balance()!.totalDebit | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ balance()!.totalCredit | number:'1.2-2' }}</td>
                <td colspan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      }

      <!-- Bilan -->
      @if (activeTab() === 'bilan' && bilan()) {
        <div class="p-4 space-y-4">
          <h2 class="font-semibold text-gray-700">Bilan – Exercice {{ bilan()!.exercice }}</h2>
          <div class="grid grid-cols-2 gap-6">
            <!-- Actif -->
            <div>
              <h3 class="text-xs font-bold uppercase text-gray-500 mb-2 border-b pb-1">ACTIF</h3>
              @for (cat of actifCategories(); track cat) {
                <div class="mb-3">
                  <div class="text-xs font-semibold text-blue-700 mb-1">{{ cat }}</div>
                  @for (p of bilanActifByCat(cat); track p.numero) {
                    <div class="flex justify-between text-sm py-0.5">
                      <span class="text-gray-700">{{ p.numero }} – {{ p.intitule }}</span>
                      <span class="font-mono">{{ p.montant | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>
              }
              <div class="flex justify-between font-bold border-t-2 border-gray-800 pt-2 text-sm">
                <span>TOTAL ACTIF</span>
                <span class="font-mono">{{ bilan()!.totalActif | number:'1.2-2' }}</span>
              </div>
            </div>
            <!-- Passif -->
            <div>
              <h3 class="text-xs font-bold uppercase text-gray-500 mb-2 border-b pb-1">PASSIF</h3>
              @for (cat of passifCategories(); track cat) {
                <div class="mb-3">
                  <div class="text-xs font-semibold text-green-700 mb-1">{{ cat }}</div>
                  @for (p of bilanPassifByCat(cat); track p.numero) {
                    <div class="flex justify-between text-sm py-0.5">
                      <span class="text-gray-700">{{ p.numero }} – {{ p.intitule }}</span>
                      <span class="font-mono">{{ p.montant | number:'1.2-2' }}</span>
                    </div>
                  }
                </div>
              }
              <div class="flex justify-between font-bold border-t-2 border-gray-800 pt-2 text-sm">
                <span>TOTAL PASSIF</span>
                <span class="font-mono">{{ bilan()!.totalPassif | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Compte de résultat -->
      @if (activeTab() === 'compte-resultat' && compteResultat()) {
        <div class="p-4 space-y-4">
          <h2 class="font-semibold text-gray-700">Compte de résultat – Exercice {{ compteResultat()!.exercice }}</h2>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <h3 class="text-xs font-bold uppercase text-red-600 mb-2 border-b pb-1">CHARGES (Cl.6)</h3>
              @for (p of compteResultat()!.charges; track p.numero) {
                <div class="flex justify-between text-sm py-0.5">
                  <span class="text-gray-700">{{ p.numero }} – {{ p.intitule }}</span>
                  <span class="font-mono">{{ p.montant | number:'1.2-2' }}</span>
                </div>
              }
              <div class="flex justify-between font-bold border-t-2 border-red-400 pt-2 text-sm mt-2">
                <span>Total charges</span>
                <span class="font-mono text-red-700">{{ compteResultat()!.totalCharges | number:'1.2-2' }}</span>
              </div>
            </div>
            <div>
              <h3 class="text-xs font-bold uppercase text-green-600 mb-2 border-b pb-1">PRODUITS (Cl.7)</h3>
              @for (p of compteResultat()!.produits; track p.numero) {
                <div class="flex justify-between text-sm py-0.5">
                  <span class="text-gray-700">{{ p.numero }} – {{ p.intitule }}</span>
                  <span class="font-mono">{{ p.montant | number:'1.2-2' }}</span>
                </div>
              }
              <div class="flex justify-between font-bold border-t-2 border-green-400 pt-2 text-sm mt-2">
                <span>Total produits</span>
                <span class="font-mono text-green-700">{{ compteResultat()!.totalProduits | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
          <div class="mt-4 p-3 rounded-lg text-sm font-bold flex justify-between"
               [class]="compteResultat()!.resultat >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
            <span>RÉSULTAT NET {{ compteResultat()!.resultat >= 0 ? '(Bénéfice)' : '(Perte)' }}</span>
            <span class="font-mono">{{ compteResultat()!.resultat | number:'1.2-2' }}</span>
          </div>
        </div>
      }

      <!-- Grand livre -->
      @if (activeTab() === 'grand-livre') {
        <div class="p-4 space-y-3">
          <div class="flex items-center gap-3">
            <h2 class="font-semibold text-gray-700">Grand livre</h2>
            <input [(ngModel)]="glCompte" placeholder="N° compte (ex: 521)"
                   class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            <button (click)="loadGrandLivre()"
                    class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Consulter
            </button>
          </div>
          @if (grandLivre()) {
            <div class="text-sm text-gray-600 font-medium">
              {{ grandLivre()!.compteNumero }} – {{ grandLivre()!.compteIntitule }}
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th class="px-4 py-2 text-left">Date</th>
                    <th class="px-4 py-2 text-left">Pièce</th>
                    <th class="px-4 py-2 text-left">Libellé</th>
                    <th class="px-4 py-2 text-left">Journal</th>
                    <th class="px-4 py-2 text-right">Débit</th>
                    <th class="px-4 py-2 text-right">Crédit</th>
                    <th class="px-4 py-2 text-right">Solde cumulé</th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of grandLivre()!.mouvements; track $index) {
                    <tr class="border-t border-gray-50 hover:bg-gray-50">
                      <td class="px-4 py-1.5 font-mono text-xs">{{ m.date }}</td>
                      <td class="px-4 py-1.5 text-xs">{{ m.numeroPiece }}</td>
                      <td class="px-4 py-1.5">{{ m.libelle }}</td>
                      <td class="px-4 py-1.5 text-xs">{{ m.journal }}</td>
                      <td class="px-4 py-1.5 text-right font-mono">{{ m.debit | number:'1.2-2' }}</td>
                      <td class="px-4 py-1.5 text-right font-mono">{{ m.credit | number:'1.2-2' }}</td>
                      <td class="px-4 py-1.5 text-right font-mono"
                          [class]="m.soldeCumule >= 0 ? 'text-blue-700' : 'text-red-700'">
                        {{ m.soldeCumule | number:'1.2-2' }}
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot class="bg-gray-50 font-semibold text-sm border-t-2 border-gray-300">
                  <tr>
                    <td colspan="4" class="px-4 py-2">TOTAUX</td>
                    <td class="px-4 py-2 text-right font-mono">{{ grandLivre()!.totalDebit | number:'1.2-2' }}</td>
                    <td class="px-4 py-2 text-right font-mono">{{ grandLivre()!.totalCredit | number:'1.2-2' }}</td>
                    <td class="px-4 py-2 text-right font-mono"
                        [class]="grandLivre()!.solde >= 0 ? 'text-blue-700 font-bold' : 'text-red-700 font-bold'">
                      {{ grandLivre()!.solde | number:'1.2-2' }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          }
        </div>
      }

      <!-- Journal livre -->
      @if (activeTab() === 'journal' && journalLivre()) {
        <div class="overflow-x-auto">
          <div class="px-4 py-3 border-b border-gray-100">
            <h2 class="font-semibold text-gray-700">Journal des écritures validées – Exercice {{ journalLivre()!.exercice }}</h2>
          </div>
          @for (e of journalLivre()!.ecritures; track e.id) {
            <div class="border-b border-gray-100 hover:bg-gray-50">
              <div class="px-4 py-2 flex items-center gap-4 text-sm">
                <span class="font-mono text-xs text-gray-400">{{ e.date }}</span>
                <span class="font-semibold text-gray-800">{{ e.numeroPiece }}</span>
                <span class="text-gray-600">{{ e.libelle }}</span>
                <span class="ml-auto text-xs px-2 py-0.5 bg-gray-100 rounded font-mono">{{ e.journal }}</span>
              </div>
              <table class="w-full text-xs ml-8 mb-2">
                <tbody>
                  @for (l of e.lignes; track $index) {
                    <tr>
                      <td class="pl-8 pr-4 py-0.5 font-mono w-24">{{ l.compteNumero }}</td>
                      <td class="pr-4 py-0.5 text-gray-600 flex-1">{{ l.compteIntitule }}</td>
                      <td class="pr-4 py-0.5 text-right font-mono w-28 text-blue-700">
                        {{ l.debit > 0 ? (l.debit | number:'1.2-2') : '' }}
                      </td>
                      <td class="pr-8 py-0.5 text-right font-mono w-28 text-green-700">
                        {{ l.credit > 0 ? (l.credit | number:'1.2-2') : '' }}
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- SMT – Recettes/Dépenses -->
      @if (activeTab() === 'recettes-depenses' && recettesDepenses()) {
        <div class="p-4 space-y-4">
          <h2 class="font-semibold text-gray-700">État des recettes et dépenses (SMT) – Exercice {{ recettesDepenses()!.exercice }}</h2>
          <div class="grid grid-cols-2 gap-6">
            <div>
              <h3 class="text-xs font-bold uppercase text-green-600 mb-2 border-b pb-1">RECETTES (Cl.7)</h3>
              @for (p of recettesDepenses()!.recettes; track p.numero) {
                <div class="flex justify-between text-sm py-0.5">
                  <span>{{ p.numero }} – {{ p.intitule }}</span>
                  <span class="font-mono">{{ p.montant | number:'1.2-2' }}</span>
                </div>
              }
              <div class="flex justify-between font-bold border-t-2 border-green-400 pt-2 text-sm mt-2">
                <span>Total recettes</span>
                <span class="font-mono text-green-700">{{ recettesDepenses()!.totalRecettes | number:'1.2-2' }}</span>
              </div>
            </div>
            <div>
              <h3 class="text-xs font-bold uppercase text-red-600 mb-2 border-b pb-1">DÉPENSES (Cl.6)</h3>
              @for (p of recettesDepenses()!.depenses; track p.numero) {
                <div class="flex justify-between text-sm py-0.5">
                  <span>{{ p.numero }} – {{ p.intitule }}</span>
                  <span class="font-mono">{{ p.montant | number:'1.2-2' }}</span>
                </div>
              }
              <div class="flex justify-between font-bold border-t-2 border-red-400 pt-2 text-sm mt-2">
                <span>Total dépenses</span>
                <span class="font-mono text-red-700">{{ recettesDepenses()!.totalDepenses | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>
          <div class="p-3 rounded-lg text-sm font-bold flex justify-between mt-2"
               [class]="recettesDepenses()!.solde >= 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'">
            <span>SOLDE NET</span>
            <span class="font-mono">{{ recettesDepenses()!.solde | number:'1.2-2' }}</span>
          </div>
        </div>
      }

      <!-- SMT – Trésorerie -->
      @if (activeTab() === 'tresorerie' && tresorerie()) {
        <div class="overflow-x-auto">
          <div class="px-4 py-3 border-b border-gray-100">
            <h2 class="font-semibold text-gray-700">État de trésorerie (SMT) – Exercice {{ tresorerie()!.exercice }}</h2>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-2 text-left">Compte</th>
                <th class="px-4 py-2 text-left">Intitulé</th>
                <th class="px-4 py-2 text-right">Entrées</th>
                <th class="px-4 py-2 text-right">Sorties</th>
                <th class="px-4 py-2 text-right">Solde</th>
              </tr>
            </thead>
            <tbody>
              @for (c of tresorerie()!.comptes; track c.numero) {
                <tr class="border-t border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-1.5 font-mono text-xs">{{ c.numero }}</td>
                  <td class="px-4 py-1.5">{{ c.intitule }}</td>
                  <td class="px-4 py-1.5 text-right font-mono text-green-700">{{ c.entrees | number:'1.2-2' }}</td>
                  <td class="px-4 py-1.5 text-right font-mono text-red-700">{{ c.sorties | number:'1.2-2' }}</td>
                  <td class="px-4 py-1.5 text-right font-mono font-semibold"
                      [class]="c.solde >= 0 ? 'text-blue-700' : 'text-red-700'">
                    {{ c.solde | number:'1.2-2' }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-gray-50 font-bold text-sm border-t-2 border-gray-300">
              <tr>
                <td colspan="2" class="px-4 py-2">TOTAUX</td>
                <td class="px-4 py-2 text-right font-mono text-green-700">{{ tresorerie()!.totalEntrees | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono text-red-700">{{ tresorerie()!.totalSorties | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono"
                    [class]="tresorerie()!.solde >= 0 ? 'text-blue-700' : 'text-red-700'">
                  {{ tresorerie()!.solde | number:'1.2-2' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      }

      <!-- Tableau des Flux de Trésorerie -->
      @if (activeTab() === 'flux-tresorerie' && fluxTresorerie()) {
        <div class="p-5 space-y-5">
          <h2 class="font-semibold text-gray-700">Tableau des Flux de Trésorerie — Exercice {{ fluxTresorerie()!.exercice }}</h2>
          <p class="text-xs text-gray-400">Méthode indirecte · Soldes cumulés depuis le 01/01</p>

          @for (section of [fluxTresorerie()!.operationnel, fluxTresorerie()!.investissement, fluxTresorerie()!.financement]; track section.code) {
            <div class="border border-gray-200 rounded-xl overflow-hidden">
              <div class="bg-gray-800 text-white px-4 py-2 flex items-center justify-between">
                <span class="text-sm font-semibold">{{ section.titre }}</span>
                <span class="font-mono font-bold text-sm" [class]="section.total >= 0 ? 'text-green-300' : 'text-red-300'">
                  {{ section.total | number:'1.2-2' }}
                </span>
              </div>
              <table class="w-full text-sm">
                <tbody>
                  @for (ligne of section.lignes; track ligne.libelle) {
                    @if (ligne.montant !== 0) {
                      <tr class="border-t border-gray-100 hover:bg-gray-50">
                        <td class="px-4 py-2 text-gray-700">{{ ligne.libelle }}</td>
                        <td class="px-4 py-2 text-right font-mono w-36"
                            [class]="ligne.montant >= 0 ? 'text-blue-700' : 'text-red-600'">
                          {{ ligne.montant | number:'1.2-2' }}
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          }

          <!-- Synthèse -->
          <div class="border border-gray-200 rounded-xl overflow-hidden">
            <div class="bg-gray-50 px-4 py-3 space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Variation nette de trésorerie (A + B + C)</span>
                <span class="font-mono font-bold" [class]="fluxTresorerie()!.variationNette >= 0 ? 'text-green-700' : 'text-red-700'">
                  {{ fluxTresorerie()!.variationNette | number:'1.2-2' }}
                </span>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Trésorerie d'ouverture (N-1)</span>
                <span class="font-mono text-gray-400">{{ fluxTresorerie()!.tresorerieOuverture | number:'1.2-2' }}</span>
              </div>
              <div class="flex items-center justify-between text-sm border-t border-gray-200 pt-2">
                <span class="font-semibold text-gray-700">Trésorerie de clôture (51x-57x)</span>
                <span class="font-mono font-bold text-gray-800">{{ fluxTresorerie()!.tresorerieCloture | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <p class="text-xs text-gray-400">
            Note : la trésorerie d'ouverture nécessite les données comparatives N-1 (prochaine version).
          </p>
        </div>
      }

      <!-- État de Variation des Capitaux Propres -->
      @if (activeTab() === 'evcap' && evcap()) {
        <div class="overflow-x-auto">
          <div class="px-4 py-3 border-b border-gray-100 space-y-0.5">
            <h2 class="font-semibold text-gray-700">État de Variation des Capitaux Propres – Exercice {{ evcap()!.exercice }}</h2>
            <p class="text-xs text-gray-400">Comptes 10x–15x (SYSCOHADA) — solde créditeur net (positif = ressource)</p>
          </div>
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th class="px-4 py-2 text-left w-24">Compte</th>
                <th class="px-4 py-2 text-left">Intitulé</th>
                <th class="px-4 py-2 text-right w-36">Solde début N</th>
                <th class="px-4 py-2 text-right w-36">Augmentations</th>
                <th class="px-4 py-2 text-right w-36">Diminutions</th>
                <th class="px-4 py-2 text-right w-36">Solde fin N</th>
              </tr>
            </thead>
            <tbody>
              @for (l of evcap()!.lignes; track l.numero) {
                <tr class="border-t border-gray-50 hover:bg-gray-50">
                  <td class="px-4 py-1.5 font-mono text-xs">{{ l.numero }}</td>
                  <td class="px-4 py-1.5 text-gray-700">{{ l.intitule }}</td>
                  <td class="px-4 py-1.5 text-right font-mono"
                      [class]="l.soldeDebut >= 0 ? 'text-gray-700' : 'text-red-600'">
                    {{ l.soldeDebut === 0 ? '–' : (l.soldeDebut | number:'1.2-2') }}
                  </td>
                  <td class="px-4 py-1.5 text-right font-mono text-green-700">
                    {{ l.augmentations === 0 ? '–' : (l.augmentations | number:'1.2-2') }}
                  </td>
                  <td class="px-4 py-1.5 text-right font-mono text-red-500">
                    {{ l.diminutions === 0 ? '–' : (l.diminutions | number:'1.2-2') }}
                  </td>
                  <td class="px-4 py-1.5 text-right font-mono font-semibold"
                      [class]="l.soldeFin >= 0 ? 'text-blue-700' : 'text-red-700'">
                    {{ l.soldeFin | number:'1.2-2' }}
                  </td>
                </tr>
              }
              @if (evcap()!.lignes.length === 0) {
                <tr>
                  <td colspan="6" class="px-4 py-8 text-center text-gray-400 text-sm">
                    Aucun mouvement sur les comptes de capitaux propres pour cet exercice.
                  </td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-gray-800 text-white font-semibold text-sm">
              <tr>
                <td colspan="2" class="px-4 py-2 uppercase tracking-wide text-xs">Total Capitaux Propres</td>
                <td class="px-4 py-2 text-right font-mono">{{ evcap()!.totalDebut | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ evcap()!.totalAugmentations | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ evcap()!.totalDiminutions | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-mono">{{ evcap()!.totalFin | number:'1.2-2' }}</td>
              </tr>
            </tfoot>
          </table>
          <div class="px-4 py-2 bg-blue-50 border-t border-blue-100">
            <p class="text-xs text-blue-600">
              Augmentations = crédits de l'exercice N · Diminutions = débits de l'exercice N · Solde début = cumul au 31/12/N-1
            </p>
          </div>
        </div>
      }

      <!-- Notes Annexes AUDCIF (36 notes structurées) -->
      @if (activeTab() === 'notes') {
        <div class="flex h-[calc(100vh-220px)] min-h-[500px]">

          <!-- Sidebar : liste des 36 notes -->
          <aside class="w-72 shrink-0 border-r border-gray-200 overflow-y-auto bg-gray-50">
            @for (groupe of groupes(); track groupe.nom) {
              <div>
                <div class="px-3 py-2 text-xs font-bold uppercase tracking-wide text-blue-700 bg-blue-50 border-b border-blue-100 sticky top-0">
                  {{ groupe.nom }}
                </div>
                @for (note of groupe.notes; track note.numero) {
                  <button (click)="selectNote(note)"
                          class="w-full text-left px-3 py-2 text-xs border-b border-gray-100 hover:bg-white transition-colors flex items-start gap-2"
                          [class.bg-white]="selectedNote()?.numero === note.numero"
                          [class.font-semibold]="selectedNote()?.numero === note.numero"
                          [class.text-blue-700]="selectedNote()?.numero === note.numero">
                    <span class="shrink-0 font-mono text-gray-400 w-5">{{ note.numero }}</span>
                    <span class="leading-tight">{{ note.titre }}</span>
                    <span class="ml-auto shrink-0 text-gray-300 text-xs">{{ note.type === 'CALCULEE' ? '◈' : '✎' }}</span>
                  </button>
                }
              </div>
            }
          </aside>

          <!-- Panneau de droite : contenu de la note sélectionnée -->
          <div class="flex-1 overflow-y-auto">
            @if (!selectedNote()) {
              <div class="flex flex-col items-center justify-center h-full text-gray-400">
                <p class="text-sm">Sélectionnez une note dans la liste</p>
                <p class="text-xs mt-1">36 notes structurées selon l'AUDCIF SYSCOHADA</p>
              </div>
            } @else {

              <!-- En-tête note -->
              <div class="px-5 py-3 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center gap-3">
                <span class="text-2xl font-bold text-blue-700 font-mono">{{ selectedNote()!.numero }}</span>
                <div>
                  <h3 class="font-semibold text-gray-800 text-sm">{{ selectedNote()!.titre }}</h3>
                  <p class="text-xs text-gray-400">Exercice {{ exercice() }} · {{ selectedNote()!.type === 'CALCULEE' ? 'Calculée automatiquement' : 'Note textuelle' }}</p>
                </div>
              </div>

              <!-- Note calculée -->
              @if (selectedNote()!.type === 'CALCULEE') {
                @if (noteLoading()) {
                  <div class="flex items-center justify-center py-16 text-gray-400 text-sm">Calcul en cours…</div>
                } @else if (noteError()) {
                  <div class="p-5 text-red-500 text-sm">{{ noteError() }}</div>
                } @else if (currentNoteData()) {
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
                        <tr>
                          <th class="px-4 py-2 text-left w-20">Compte</th>
                          <th class="px-4 py-2 text-left">Intitulé</th>
                          <th class="px-4 py-2 text-right w-32">Débit</th>
                          <th class="px-4 py-2 text-right w-32">Crédit</th>
                          <th class="px-4 py-2 text-right w-32">Solde net</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (l of currentNoteData()!.lignes; track $index) {
                          <tr class="border-t border-gray-50 hover:bg-gray-50"
                              [class.bg-gray-800]="l.numero === '' && l.intitule.startsWith('▸')"
                              [class.text-white]="l.numero === '' && l.intitule.startsWith('▸')">
                            <td class="px-4 py-1.5 font-mono text-xs text-gray-500">{{ l.numero }}</td>
                            <td class="px-4 py-1.5" [class.font-semibold]="l.intitule.startsWith('▸')">{{ l.intitule }}</td>
                            <td class="px-4 py-1.5 text-right font-mono">
                              {{ l.totalDebit === 0 ? '–' : (l.totalDebit | number:'1.2-2') }}
                            </td>
                            <td class="px-4 py-1.5 text-right font-mono">
                              {{ l.totalCredit === 0 ? '–' : (l.totalCredit | number:'1.2-2') }}
                            </td>
                            <td class="px-4 py-1.5 text-right font-mono font-semibold"
                                [class.text-blue-700]="l.solde > 0"
                                [class.text-red-600]="l.solde < 0"
                                [class.text-gray-400]="l.solde === 0">
                              {{ l.solde === 0 ? '–' : (l.solde | number:'1.2-2') }}
                            </td>
                          </tr>
                        }
                        @if (currentNoteData()!.lignes.length === 0) {
                          <tr><td colspan="5" class="px-4 py-10 text-center text-gray-400 text-sm">
                            Aucun mouvement sur ces comptes pour l'exercice {{ exercice() }}.
                          </td></tr>
                        }
                      </tbody>
                      <tfoot class="bg-gray-800 text-white font-semibold text-sm">
                        <tr>
                          <td colspan="2" class="px-4 py-2 uppercase text-xs tracking-wide">Total</td>
                          <td class="px-4 py-2 text-right font-mono">{{ currentNoteData()!.totalDebit | number:'1.2-2' }}</td>
                          <td class="px-4 py-2 text-right font-mono">{{ currentNoteData()!.totalCredit | number:'1.2-2' }}</td>
                          <td class="px-4 py-2 text-right font-mono">{{ currentNoteData()!.totalSolde | number:'1.2-2' }}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  @if (currentNoteData()!.remarque) {
                    <div class="px-5 py-3 bg-blue-50 border-t border-blue-100">
                      <p class="text-xs text-blue-700">{{ currentNoteData()!.remarque }}</p>
                    </div>
                  }
                }
              }

              <!-- Note textuelle -->
              @if (selectedNote()!.type === 'TEXTE') {
                <div class="p-5 space-y-4">
                  @if (!noteEditMode()) {
                    @if (textNoteForSelected()) {
                      <div class="space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="text-xs text-gray-400">
                            Mis à jour {{ textNoteForSelected()!.updatedAt | date:'dd/MM/yyyy HH:mm' }}
                          </span>
                          <div class="flex gap-2">
                            <button (click)="startEditNote()"
                                    class="text-xs px-2 py-1 border border-blue-200 text-blue-600 rounded hover:border-blue-400">
                              Modifier
                            </button>
                            <button (click)="deleteSelectedNote()"
                                    class="text-xs px-2 py-1 border border-red-200 text-red-500 rounded hover:border-red-400">
                              Supprimer
                            </button>
                          </div>
                        </div>
                        <div class="bg-white border border-gray-200 rounded-xl p-4 min-h-[120px] text-sm text-gray-700 whitespace-pre-wrap">
                          {{ textNoteForSelected()!.contenu || '(Contenu vide)' }}
                        </div>
                      </div>
                    } @else {
                      <div class="text-center py-10 text-gray-400 text-sm">
                        <p>Aucune note saisie pour cette annexe.</p>
                        <button (click)="startEditNote()"
                                class="mt-3 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                          + Rédiger cette note
                        </button>
                      </div>
                    }
                  } @else {
                    <div class="space-y-3">
                      <textarea [(ngModel)]="noteEditContenu" rows="10" placeholder="Rédigez le contenu de la note…"
                                class="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono">
                      </textarea>
                      <div class="flex gap-2 justify-end">
                        <button (click)="cancelEditNote()"
                                class="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                          Annuler
                        </button>
                        <button (click)="saveTextNote()"
                                class="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }

            }
          </div>
        </div>
      }
    }
  </div>
</div>
  `
})
export class EtatsComponent implements OnInit {
  private svc = inject(EtatFinancierService);

  readonly tabs = TABS;

  activeTab  = signal<EtatTab>('balance');
  exercice   = signal<number>(new Date().getFullYear());
  loading    = signal(false);
  error      = signal<string | null>(null);

  balance        = signal<BalanceData | null>(null);
  bilan          = signal<BilanData | null>(null);
  compteResultat = signal<CompteResultatData | null>(null);
  grandLivre     = signal<GrandLivreData | null>(null);
  journalLivre   = signal<JournalLivreData | null>(null);
  recettesDepenses = signal<EtatRecettesDepensesData | null>(null);
  tresorerie      = signal<EtatTresorerieData | null>(null);
  fluxTresorerie  = signal<FluxTresorerieData | null>(null);
  evcap           = signal<EvcapData | null>(null);
  notes           = signal<NoteAnnexe[]>([]);

  // ─── Notes AUDCIF ─────────────────────────────────────────────────────────
  catalogue       = signal<NoteCatalogue[]>([]);
  selectedNote    = signal<NoteCatalogue | null>(null);
  currentNoteData = signal<NoteComputeeData | null>(null);
  noteLoading     = signal(false);
  noteError       = signal<string | null>(null);
  noteEditMode    = signal(false);
  noteEditContenu = '';

  glCompte = '';
  noteFormOpen  = signal(false);
  editingNoteId = signal<string | null>(null);
  noteForm = { titre: '', contenu: '', ordre: 0 };

  years = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3];
  });

  actifCategories = computed(() =>
    [...new Set((this.bilan()?.actif ?? []).map(p => p.categorie))]
  );
  passifCategories = computed(() =>
    [...new Set((this.bilan()?.passif ?? []).map(p => p.categorie))]
  );

  groupes = computed<NotesGroupe[]>(() => {
    const cat = this.catalogue();
    const nomGroupes = [...new Set(cat.map(n => n.groupe))];
    return nomGroupes.map(nom => ({ nom, notes: cat.filter(n => n.groupe === nom) }));
  });

  textNoteForSelected = computed<NoteAnnexe | null>(() => {
    const sel = this.selectedNote();
    if (!sel) return null;
    return this.notes().find(n => n.numeroNote === sel.numero) ?? null;
  });

  bilanActifByCat(cat: string) { return (this.bilan()?.actif ?? []).filter(p => p.categorie === cat); }
  bilanPassifByCat(cat: string) { return (this.bilan()?.passif ?? []).filter(p => p.categorie === cat); }

  tabClass(tab: TabDef): string {
    const base = 'border border-b-0 ';
    if (this.activeTab() === tab.id)
      return base + 'bg-white border-gray-200 text-blue-700';
    if (tab.group === 'smt')
      return base + 'border-transparent text-orange-600 hover:bg-orange-50';
    return base + 'border-transparent text-gray-500 hover:bg-gray-100';
  }

  selectTab(tab: EtatTab) {
    this.activeTab.set(tab);
    this.loadTab(tab);
  }

  onExerciceChange(year: number) {
    this.exercice.set(Number(year));
    this.clearData();
    this.loadTab(this.activeTab());
  }

  private clearData() {
    this.balance.set(null); this.bilan.set(null); this.compteResultat.set(null);
    this.grandLivre.set(null); this.journalLivre.set(null);
    this.recettesDepenses.set(null); this.tresorerie.set(null);
    this.fluxTresorerie.set(null); this.evcap.set(null); this.notes.set([]);
    this.selectedNote.set(null); this.currentNoteData.set(null); this.noteEditMode.set(false);
  }

  private loadTab(tab: EtatTab) {
    this.error.set(null);
    const y = this.exercice();
    switch (tab) {
      case 'balance':
        if (this.balance()) return;
        this.fetch(this.svc.getBalance(y), v => this.balance.set(v));
        break;
      case 'bilan':
        if (this.bilan()) return;
        this.fetch(this.svc.getBilan(y), v => this.bilan.set(v));
        break;
      case 'compte-resultat':
        if (this.compteResultat()) return;
        this.fetch(this.svc.getCompteResultat(y), v => this.compteResultat.set(v));
        break;
      case 'grand-livre':
        break;
      case 'journal':
        if (this.journalLivre()) return;
        this.fetch(this.svc.getJournal(y), v => this.journalLivre.set(v));
        break;
      case 'recettes-depenses':
        if (this.recettesDepenses()) return;
        this.fetch(this.svc.getRecettesDepenses(y), v => this.recettesDepenses.set(v));
        break;
      case 'tresorerie':
        if (this.tresorerie()) return;
        this.fetch(this.svc.getTresorerie(y), v => this.tresorerie.set(v));
        break;
      case 'flux-tresorerie':
        if (this.fluxTresorerie()) return;
        this.fetch(this.svc.getFluxTresorerie(y), v => this.fluxTresorerie.set(v));
        break;
      case 'evcap':
        if (this.evcap()) return;
        this.fetch(this.svc.getEvcap(y), v => this.evcap.set(v));
        break;
      case 'notes':
        if (this.catalogue().length === 0) {
          this.fetch(this.svc.getCatalogue(), v => this.catalogue.set(v));
        }
        this.fetch(this.svc.getNotes(y), v => this.notes.set(v));
        break;
    }
  }

  loadGrandLivre() {
    if (!this.glCompte.trim()) return;
    this.fetch(this.svc.getGrandLivre(this.exercice(), this.glCompte.trim()), v => this.grandLivre.set(v));
  }

  private fetch<T>(obs: Observable<T>, setter: (v: T) => void) {
    this.loading.set(true);
    obs.subscribe({
      next: v => { setter(v); this.loading.set(false); },
      error: (e: any) => { this.error.set(e?.error?.message ?? 'Erreur de chargement'); this.loading.set(false); }
    });
  }


  // ─── Notes AUDCIF ─────────────────────────────────────────────────────────

  selectNote(note: NoteCatalogue) {
    this.selectedNote.set(note);
    this.currentNoteData.set(null);
    this.noteError.set(null);
    this.noteEditMode.set(false);

    if (note.type === 'CALCULEE') {
      this.noteLoading.set(true);
      this.svc.getNoteData(note.numero, this.exercice()).subscribe({
        next: data => { this.currentNoteData.set(data); this.noteLoading.set(false); },
        error: (e: any) => {
          this.noteError.set(e?.error?.message ?? 'Erreur de calcul');
          this.noteLoading.set(false);
        }
      });
    }
  }

  startEditNote() {
    this.noteEditContenu = this.textNoteForSelected()?.contenu ?? '';
    this.noteEditMode.set(true);
  }

  cancelEditNote() {
    this.noteEditMode.set(false);
  }

  saveTextNote() {
    const sel = this.selectedNote();
    if (!sel) return;
    const existing = this.textNoteForSelected();
    if (existing) {
      this.svc.updateNote(existing.id, { contenu: this.noteEditContenu }).subscribe({
        next: updated => {
          this.notes.update(list => list.map(n => n.id === updated.id ? updated : n));
          this.noteEditMode.set(false);
        }
      });
    } else {
      const req: NoteAnnexeCreate = {
        exercice: this.exercice(),
        numeroNote: sel.numero,
        titre: sel.titre,
        contenu: this.noteEditContenu,
        ordre: sel.numero
      };
      this.svc.createNote(req).subscribe({
        next: created => {
          this.notes.update(list => [...list, created]);
          this.noteEditMode.set(false);
        }
      });
    }
  }

  deleteSelectedNote() {
    const existing = this.textNoteForSelected();
    if (!existing || !confirm('Supprimer cette note ?')) return;
    this.svc.deleteNote(existing.id).subscribe({
      next: () => this.notes.update(list => list.filter(n => n.id !== existing.id))
    });
  }

  print() { window.print(); }

  exportCsv() {
    const tab = this.activeTab();
    let csv = '';
    if (tab === 'balance' && this.balance()) {
      csv = 'Compte;Intitule;Debit;Credit;Solde D;Solde C\n' +
        this.balance()!.lignes.map(l =>
          `${l.numero};${l.intitule};${l.totalDebit};${l.totalCredit};${l.soldeDebiteur};${l.soldeCrediteur}`
        ).join('\n');
    } else if (tab === 'compte-resultat' && this.compteResultat()) {
      const cr = this.compteResultat()!;
      csv = 'Type;Compte;Intitule;Montant\n' +
        cr.charges.map(p => `Charge;${p.numero};${p.intitule};${p.montant}`).join('\n') + '\n' +
        cr.produits.map(p => `Produit;${p.numero};${p.intitule};${p.montant}`).join('\n') +
        `\nResultat;;;${cr.resultat}`;
    } else {
      return;
    }
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${tab}-${this.exercice()}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  ngOnInit() { this.loadTab('balance'); }
}
