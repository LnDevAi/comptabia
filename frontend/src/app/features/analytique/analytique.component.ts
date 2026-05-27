import {
  ChangeDetectionStrategy, Component, ElementRef, inject,
  OnDestroy, OnInit, signal, computed, ViewChild
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AnalytiqueService } from '../../core/services/analytique.service';
import {
  AxeAnalytique, RapportAnalytique, RapportAxe, RapportBailleur,
  RapportBailleurResponse, SousAxe, TypeAxe, TYPES_AXE
} from '../../core/models/analytique.model';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

type Onglet = 'axes' | 'rapport' | 'bailleur';

@Component({
  selector: 'app-analytique',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-6xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Comptabilité analytique</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Ventilation par projets, bailleurs, activités et centres de coût
    </p>
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
    @for (tab of [['axes','Axes analytiques'],['rapport','Rapport analytique'],['bailleur','Rapport bailleur']]; track tab[0]) {
      <button (click)="onglet.set(tab[0])"
              [class]="onglet() === tab[0]
                ? 'px-4 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm'
                : 'px-4 py-1.5 rounded-lg text-gray-500 text-sm hover:text-gray-700'">
        {{ tab[1] }}
      </button>
    }
  </div>

  <!-- ═══════════════════════════════════════════ AXES ══════════════════════ -->
  @if (onglet() === 'axes') {

  <!-- KPI axes -->
  @if (axes().length > 0) {
  <div class="grid grid-cols-5 gap-3">
    @for (t of typesAxe; track t.value) {
      <div class="bg-white rounded-xl border border-gray-200 p-3 text-center">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" [ngClass]="t.color">{{ t.label }}</span>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ countByType(t.value) }}</p>
        <p class="text-xs text-gray-400">axe(s)</p>
      </div>
    }
  </div>
  }

  <!-- Filtre par type -->
  <div class="flex items-center gap-2 flex-wrap">
    <span class="text-xs text-gray-500 font-medium">Filtrer :</span>
    <button (click)="filtreType.set(null)"
            [class]="filtreType() === null
              ? 'px-3 py-1 rounded-full text-xs font-medium bg-gray-800 text-white'
              : 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200'">
      Tous
    </button>
    @for (t of typesAxe; track t.value) {
      <button (click)="filtreType.set(t.value)"
              [class]="filtreType() === t.value
                ? 'px-3 py-1 rounded-full text-xs font-medium ' + t.color
                : 'px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200'">
        {{ t.label }}
      </button>
    }
  </div>

  <!-- Formulaire création -->
  <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
    <h2 class="text-sm font-semibold text-gray-700">Nouvel axe analytique</h2>
    <div class="flex flex-wrap gap-3 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Code</label>
        <input [(ngModel)]="formCode" type="text" placeholder="AFD-2024" maxlength="20"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Type</label>
        <select [(ngModel)]="formType"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          @for (t of typesAxe; track t.value) {
            <option [value]="t.value">{{ t.label }}</option>
          }
        </select>
      </div>
      <div class="flex-1 min-w-[180px]">
        <label class="block text-xs text-gray-500 mb-1">Intitulé</label>
        <input [(ngModel)]="formIntitule" type="text" placeholder="ex: Projet WASH Burkina"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Budget alloué</label>
        <input [(ngModel)]="formBudget" type="number" min="0" placeholder="Facultatif"
               class="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Rattacher à (bailleur)</label>
        <select [(ngModel)]="formParentId"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— Aucun —</option>
          @for (a of bailleurs(); track a.id) {
            <option [value]="a.id">{{ a.code }} — {{ a.intitule }}</option>
          }
        </select>
      </div>
      <button (click)="creer()" [disabled]="saving() || !formCode.trim() || !formIntitule.trim()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ saving() ? 'Enregistrement…' : 'Ajouter' }}
      </button>
    </div>
    @if (formError()) {
      <p class="text-sm text-red-600">{{ formError() }}</p>
    }
  </div>

  <!-- Liste des axes -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (axesFiltres().length === 0) {
      <div class="flex items-center justify-center h-24 text-gray-400 text-sm">
        Aucun axe{{ filtreType() ? ' de ce type' : '' }} défini.
      </div>
    } @else {
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intitulé</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bailleur</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
          <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
          <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        @for (a of axesFiltres(); track a.id) {
        <tr class="hover:bg-gray-50">
          @if (editing() === a.id) {
            <td class="px-4 py-2" colspan="5">
              <div class="flex flex-wrap gap-2 items-center">
                <input [(ngModel)]="editCode" maxlength="20"
                       class="border border-gray-300 rounded px-2 py-1 text-sm w-24 uppercase" />
                <select [(ngModel)]="editType"
                        class="border border-gray-300 rounded px-2 py-1 text-sm">
                  @for (t of typesAxe; track t.value) {
                    <option [value]="t.value">{{ t.label }}</option>
                  }
                </select>
                <input [(ngModel)]="editIntitule"
                       class="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-[140px]" />
                <input [(ngModel)]="editBudget" type="number" placeholder="Budget"
                       class="border border-gray-300 rounded px-2 py-1 text-sm w-28 font-mono" />
                <select [(ngModel)]="editParentId"
                        class="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="">— Aucun —</option>
                  @for (b of bailleurs(); track b.id) {
                    <option [value]="b.id">{{ b.code }}</option>
                  }
                </select>
                <button (click)="sauvegarder(a.id)"
                        class="text-xs px-2.5 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700">Sauver</button>
                <button (click)="editing.set(null)"
                        class="text-xs px-2.5 py-1 border border-gray-200 text-gray-500 rounded-lg">Annuler</button>
              </div>
            </td>
            <td></td><td></td>
          } @else {
            <td class="px-4 py-3 font-mono font-bold text-gray-700">{{ a.code }}</td>
            <td class="px-4 py-3 text-gray-700">{{ a.intitule }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="typeColor(a.type)">{{ typeLabel(a.type) }}</span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-500">
              {{ a.parentId ? (axeById(a.parentId)?.code ?? '—') : '—' }}
            </td>
            <td class="px-4 py-3 text-right font-mono text-sm text-gray-600">
              {{ a.montantBudget != null ? (a.montantBudget | number:'1.0-0') : '—' }}
            </td>
            <td class="px-4 py-3">
              <button (click)="toggleActif(a)"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium cursor-pointer"
                      [ngClass]="a.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'">
                {{ a.actif ? 'Actif' : 'Inactif' }}
              </button>
            </td>
            <td class="px-4 py-3 text-right">
              <div class="flex justify-end gap-2">
                <button (click)="startEdit(a)" class="text-xs text-blue-600 hover:underline">Modifier</button>
                <button (click)="supprimer(a.id)" class="text-xs text-red-500 hover:underline">Supprimer</button>
              </div>
            </td>
          }
        </tr>
        }
      </tbody>
    </table>
    }
  </div>
  }

  <!-- ════════════════════════════════════════ RAPPORT GÉNÉRAL ═════════════ -->
  @if (onglet() === 'rapport') {

  <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
    <h2 class="text-sm font-semibold text-gray-700">Paramètres du rapport</h2>
    <div class="flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Début</label>
        <input [(ngModel)]="rapDebut" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Fin</label>
        <input [(ngModel)]="rapFin" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Type</label>
        <select [ngModel]="rapFiltreType()" (ngModelChange)="onRapFiltreChange($event)"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Tous types</option>
          @for (t of typesAxe; track t.value) {
            <option [value]="t.value">{{ t.label }}</option>
          }
        </select>
      </div>
      <button (click)="chargerRapport()" [disabled]="loadingRap() || !rapDebut || !rapFin"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ loadingRap() ? 'Calcul…' : 'Générer' }}
      </button>
    </div>
    @if (rapError()) { <p class="text-sm text-red-600">{{ rapError() }}</p> }
  </div>

  @if (rapportFiltré()) {

    <!-- Graphique budget vs réalisé -->
    @if (rapportAvecBudget().length > 0) {
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <h3 class="text-sm font-semibold text-gray-700 mb-4">Budget vs Réalisé — vue d'ensemble</h3>
      <div class="relative" [style.height.px]="chartRapportHeight()">
        <canvas #rapCanvas></canvas>
      </div>
    </div>
    }

    <!-- KPI synthèse -->
    @if (rapportFiltré()!.length > 0) {
    <div class="grid grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Axes analysés</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ rapportFiltré()!.length }}</p>
      </div>
      <div class="bg-white rounded-xl border border-red-100 bg-red-50 p-4">
        <p class="text-xs text-red-600 uppercase tracking-wide">Total dépenses (débit)</p>
        <p class="text-2xl font-bold text-red-800 mt-1">{{ fmtK(totalDebitRapport()) }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Axes avec budget</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ rapportAvecBudget().length }}</p>
        @if (rapportAvecBudget().length > 0) {
          <p class="text-xs mt-1"
             [ngClass]="tauxMoyenExecution() > 100 ? 'text-red-600' : tauxMoyenExecution() > 80 ? 'text-orange-500' : 'text-green-600'">
            Taux moyen : {{ tauxMoyenExecution() | number:'1.1-1' }}%
          </p>
        }
      </div>
    </div>
    }

    @if (rapportFiltré()!.length === 0) {
      <div class="bg-white rounded-xl border border-gray-200 flex items-center justify-center h-24 text-gray-400 text-sm">
        Aucune ligne ventilée sur cette période.
      </div>
    } @else {
      @for (axe of rapportFiltré()!; track axe.axeId) {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
          <div class="flex items-center gap-3 flex-wrap">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">{{ axe.axeCode }}</span>
            <span class="font-medium text-gray-700 text-sm">{{ axe.axeIntitule }}</span>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" [ngClass]="typeColor(axe.axeType)">{{ typeLabel(axe.axeType) }}</span>
          </div>
          <div class="flex flex-wrap gap-4 text-xs font-mono items-center">
            <span class="text-red-600">Débit : {{ axe.totalDebit | number:'1.2-2' }}</span>
            <span class="text-green-600">Crédit : {{ axe.totalCredit | number:'1.2-2' }}</span>
            <span class="font-bold" [ngClass]="axe.solde >= 0 ? 'text-gray-800' : 'text-purple-700'">Solde : {{ axe.solde | number:'1.2-2' }}</span>
            @if (axe.montantBudget != null) {
              <span class="text-gray-500">Budget : {{ axe.montantBudget | number:'1.0-0' }}</span>
              <span class="font-bold" [ngClass]="(axe.tauxExecution ?? 0) > 100 ? 'text-red-600' : (axe.tauxExecution ?? 0) > 80 ? 'text-orange-500' : 'text-green-600'">
                {{ axe.tauxExecution | number:'1.1-1' }}%
              </span>
            }
          </div>
        </div>
        @if (axe.montantBudget != null && axe.tauxExecution != null) {
        <div class="px-5 py-2 bg-gray-50 border-b border-gray-100">
          <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div class="h-2 rounded-full" [ngClass]="barColor(axe.tauxExecution)"
                 [style.width.%]="axe.tauxExecution > 100 ? 100 : axe.tauxExecution"></div>
          </div>
        </div>
        }
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-100">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Compte</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Intitulé</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Débit</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Crédit</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-400 uppercase">Solde</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            @for (l of axe.lignes; track l.compteNumero) {
            <tr class="hover:bg-gray-50">
              <td class="px-4 py-2 font-mono text-gray-600 text-xs">{{ l.compteNumero }}</td>
              <td class="px-4 py-2 text-gray-600 text-xs">{{ l.compteIntitule }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs text-red-500">{{ l.debit > 0 ? (l.debit | number:'1.2-2') : '' }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs text-green-600">{{ l.credit > 0 ? (l.credit | number:'1.2-2') : '' }}</td>
              <td class="px-4 py-2 text-right font-mono text-xs font-medium" [ngClass]="l.solde >= 0 ? 'text-gray-700' : 'text-purple-700'">{{ l.solde | number:'1.2-2' }}</td>
            </tr>
            }
          </tbody>
        </table>
      </div>
      }
    }
  }
  }

  <!-- ════════════════════════════════════ RAPPORT BAILLEUR ════════════════ -->
  @if (onglet() === 'bailleur') {

  <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
    <div class="flex items-center justify-between">
      <h2 class="text-sm font-semibold text-gray-700">Rapport d'exécution de subvention</h2>
      @if (rapBailleur()) {
        <button (click)="exportBailleurCsv()"
                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-lg flex items-center gap-1.5">
          ↓ Exporter CSV
        </button>
      }
    </div>
    <div class="flex flex-wrap gap-4 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Début</label>
        <input [(ngModel)]="bailleurDebut" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Fin</label>
        <input [(ngModel)]="bailleurFin" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="chargerRapportBailleur()" [disabled]="loadingBailleur() || !bailleurDebut || !bailleurFin"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ loadingBailleur() ? 'Calcul…' : 'Générer' }}
      </button>
    </div>
    @if (bailleurError()) { <p class="text-sm text-red-600">{{ bailleurError() }}</p> }
    <p class="text-xs text-gray-400">
      Ce rapport regroupe les axes de type "Bailleur" et leurs axes enfants (projets/activités) rattachés.
      Configurez le rattachement dans l'onglet "Axes analytiques".
    </p>
  </div>

  @if (rapBailleur()) {
    @if (rapBailleur()!.bailleurs.length === 0) {
      <div class="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center h-32 gap-2 text-gray-400 text-sm">
        <span class="text-3xl">🏦</span>
        <span>Aucun axe de type "Bailleur" avec des dépenses sur cette période.</span>
        <span class="text-xs">Créez des axes de type BAILLEUR et rattachez-y des projets/activités.</span>
      </div>
    } @else {

      <!-- Graphique synthèse bailleurs -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Synthèse des bailleurs — Budget vs Dépenses</h3>
        <div class="relative" [style.height.px]="chartBailleurHeight()">
          <canvas #bailleurCanvas></canvas>
        </div>
      </div>

      <!-- KPI synthèse bailleurs -->
      <div class="grid grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-gray-200 p-4">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Bailleurs</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ rapBailleur()!.bailleurs.length }}</p>
        </div>
        <div class="rounded-xl border border-red-100 bg-red-50 p-4">
          <p class="text-xs text-red-600 uppercase tracking-wide">Total dépenses</p>
          <p class="text-2xl font-bold text-red-800 mt-1">{{ fmtK(totalDepensesBailleurs()) }}</p>
        </div>
        <div class="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p class="text-xs text-gray-600 uppercase tracking-wide">Total budget</p>
          <p class="text-2xl font-bold text-gray-800 mt-1">{{ fmtK(totalBudgetBailleurs()) }}</p>
        </div>
      </div>

      @for (b of rapBailleur()!.bailleurs; track b.bailleurId) {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">

        <!-- En-tête bailleur -->
        <div class="px-5 py-4 bg-gradient-to-r from-green-50 to-white border-b border-green-100">
          <div class="flex items-start justify-between flex-wrap gap-3">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span class="text-green-700 font-bold text-sm">{{ b.bailleurCode.slice(0,2) }}</span>
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-gray-800">{{ b.bailleurCode }}</span>
                  <span class="text-gray-500 text-sm">—</span>
                  <span class="font-medium text-gray-700">{{ b.bailleurIntitule }}</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Bailleur</span>
                </div>
                @if (b.montantBudget != null) {
                  <p class="text-xs text-gray-500 mt-0.5">
                    Subvention totale : <strong>{{ b.montantBudget | number:'1.0-0' }}</strong>
                  </p>
                }
              </div>
            </div>
            <div class="flex gap-6 text-sm font-mono text-right">
              <div>
                <p class="text-xs text-gray-400 uppercase">Dépenses</p>
                <p class="font-bold text-red-600">{{ b.totalDebit | number:'1.0-0' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase">Recettes</p>
                <p class="font-bold text-green-600">{{ b.totalCredit | number:'1.0-0' }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-400 uppercase">Solde net</p>
                <p class="font-bold" [ngClass]="b.solde >= 0 ? 'text-gray-800' : 'text-red-700'">
                  {{ b.solde | number:'1.0-0' }}
                </p>
              </div>
              @if (b.tauxExecution != null) {
              <div>
                <p class="text-xs text-gray-400 uppercase">Exécution</p>
                <p class="font-bold text-lg" [ngClass]="b.tauxExecution > 100 ? 'text-red-600' : b.tauxExecution > 80 ? 'text-orange-500' : 'text-green-600'">
                  {{ b.tauxExecution | number:'1.1-1' }}%
                </p>
              </div>
              }
            </div>
          </div>
          <!-- Barre globale bailleur -->
          @if (b.montantBudget != null && b.tauxExecution != null) {
          <div class="mt-3">
            <div class="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div class="h-2.5 rounded-full transition-all"
                   [ngClass]="barColor(b.tauxExecution)"
                   [style.width.%]="b.tauxExecution > 100 ? 100 : b.tauxExecution"></div>
            </div>
          </div>
          }
        </div>

        <!-- Sous-axes (projets/activités) -->
        @for (sa of b.sousAxes; track sa.axeId) {
        <details class="border-b border-gray-100 last:border-0 group">
          <summary class="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-50 list-none">
            <div class="flex items-center gap-3">
              <span class="text-gray-400 text-xs group-open:rotate-90 transition-transform inline-block">▶</span>
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" [ngClass]="typeColor(sa.axeType)">{{ typeLabel(sa.axeType) }}</span>
              <span class="font-mono text-sm font-medium text-gray-700">{{ sa.axeCode }}</span>
              <span class="text-sm text-gray-600">{{ sa.axeIntitule }}</span>
            </div>
            <div class="flex items-center gap-5 text-xs font-mono">
              @if (sa.montantBudget != null) {
                <span class="text-gray-400">Budget : {{ sa.montantBudget | number:'1.0-0' }}</span>
                @if (sa.tauxExecution != null) {
                  <span class="font-bold" [ngClass]="sa.tauxExecution > 100 ? 'text-red-600' : sa.tauxExecution > 80 ? 'text-orange-500' : 'text-green-600'">
                    {{ sa.tauxExecution | number:'1.1-1' }}%
                  </span>
                }
              }
              <span class="text-red-500">{{ sa.totalDebit | number:'1.0-0' }}</span>
              <span class="text-green-600">{{ sa.totalCredit | number:'1.0-0' }}</span>
              <span class="font-semibold" [ngClass]="sa.solde >= 0 ? 'text-gray-700' : 'text-red-600'">
                Solde {{ sa.solde | number:'1.0-0' }}
              </span>
            </div>
          </summary>
          <!-- Barre exécution sous-axe -->
          @if (sa.montantBudget != null && sa.tauxExecution != null) {
          <div class="px-10 pb-1">
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-1.5 rounded-full" [ngClass]="barColor(sa.tauxExecution)"
                   [style.width.%]="sa.tauxExecution > 100 ? 100 : sa.tauxExecution"></div>
            </div>
          </div>
          }
          <!-- Détail des comptes -->
          <div class="px-5 pb-3">
            <table class="w-full text-xs">
              <thead>
                <tr class="border-b border-gray-100">
                  <th class="py-1.5 text-left font-medium text-gray-400 uppercase">Compte</th>
                  <th class="py-1.5 text-left font-medium text-gray-400 uppercase">Libellé</th>
                  <th class="py-1.5 text-right font-medium text-gray-400 uppercase">Débit</th>
                  <th class="py-1.5 text-right font-medium text-gray-400 uppercase">Crédit</th>
                  <th class="py-1.5 text-right font-medium text-gray-400 uppercase">Solde</th>
                </tr>
              </thead>
              <tbody>
                @for (l of sa.lignes; track l.compteNumero) {
                <tr class="border-b border-gray-50 last:border-0">
                  <td class="py-1.5 font-mono text-gray-500">{{ l.compteNumero }}</td>
                  <td class="py-1.5 text-gray-600">{{ l.compteIntitule }}</td>
                  <td class="py-1.5 text-right font-mono text-red-400">{{ l.debit > 0 ? (l.debit | number:'1.0-0') : '' }}</td>
                  <td class="py-1.5 text-right font-mono text-green-500">{{ l.credit > 0 ? (l.credit | number:'1.0-0') : '' }}</td>
                  <td class="py-1.5 text-right font-mono font-medium" [ngClass]="l.solde >= 0 ? 'text-gray-600' : 'text-red-600'">
                    {{ l.solde | number:'1.0-0' }}
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
        </details>
        }
      </div>
      }
    }
  }
  }

</div>
  `,
})
export class AnalytiqueComponent implements OnInit, OnDestroy {

  @ViewChild('rapCanvas')     rapCanvasRef!:     ElementRef<HTMLCanvasElement>;
  @ViewChild('bailleurCanvas') bailleurCanvasRef!: ElementRef<HTMLCanvasElement>;

  private svc = inject(AnalytiqueService);

  onglet    = signal<Onglet>('axes');
  axes      = signal<AxeAnalytique[]>([]);
  saving    = signal(false);
  editing   = signal<string | null>(null);
  formError = signal<string | null>(null);
  filtreType = signal<TypeAxe | null>(null);

  formCode      = '';
  formIntitule  = '';
  formType: TypeAxe = 'AUTRE';
  formBudget    = '';
  formParentId  = '';

  editCode     = '';
  editIntitule = '';
  editType: TypeAxe = 'AUTRE';
  editBudget   = '';
  editParentId = '';

  // Rapport général
  rapport       = signal<RapportAnalytique | null>(null);
  loadingRap    = signal(false);
  rapError      = signal<string | null>(null);
  rapFiltreType = signal('');
  rapDebut      = '';
  rapFin        = '';

  // Rapport bailleur
  rapBailleur     = signal<RapportBailleurResponse | null>(null);
  loadingBailleur = signal(false);
  bailleurError   = signal<string | null>(null);
  bailleurDebut   = '';
  bailleurFin     = '';

  readonly typesAxe = TYPES_AXE;

  private rapChart?:     Chart;
  private bailleurChart?: Chart;

  bailleurs = computed(() => this.axes().filter(a => a.type === 'BAILLEUR'));

  axesFiltres = computed(() => {
    const f = this.filtreType();
    return f ? this.axes().filter(a => a.type === f) : this.axes();
  });

  rapportFiltré = computed(() => {
    const r = this.rapport();
    if (!r) return null;
    const f = this.rapFiltreType();
    return f ? r.axes.filter(a => a.axeType === f) : r.axes;
  });

  rapportAvecBudget = computed(() =>
    (this.rapportFiltré() ?? []).filter(a => a.montantBudget != null && a.montantBudget > 0)
  );

  totalDebitRapport = computed(() =>
    (this.rapportFiltré() ?? []).reduce((s, a) => s + a.totalDebit, 0)
  );

  tauxMoyenExecution = computed(() => {
    const avecBudget = this.rapportAvecBudget();
    if (avecBudget.length === 0) return 0;
    const sum = avecBudget.reduce((s, a) => s + (a.tauxExecution ?? 0), 0);
    return sum / avecBudget.length;
  });

  totalDepensesBailleurs = computed(() =>
    (this.rapBailleur()?.bailleurs ?? []).reduce((s, b) => s + b.totalDebit, 0)
  );

  totalBudgetBailleurs = computed(() =>
    (this.rapBailleur()?.bailleurs ?? []).reduce((s, b) => s + (b.montantBudget ?? 0), 0)
  );

  chartRapportHeight = computed(() => {
    const n = Math.min(15, this.rapportAvecBudget().length);
    return Math.max(200, n * 44 + 60);
  });

  chartBailleurHeight = computed(() => {
    const n = this.rapBailleur()?.bailleurs.length ?? 0;
    return Math.max(180, n * 44 + 60);
  });

  ngOnInit() { this.chargerAxes(); }

  ngOnDestroy() {
    this.rapChart?.destroy();
    this.bailleurChart?.destroy();
  }

  chargerAxes() {
    this.svc.listerAxes().subscribe({ next: list => this.axes.set(list) });
  }

  axeById(id: string): AxeAnalytique | undefined {
    return this.axes().find(a => a.id === id);
  }

  countByType(type: TypeAxe): number {
    return this.axes().filter(a => a.type === type).length;
  }

  onRapFiltreChange(val: string) {
    this.rapFiltreType.set(val);
    Promise.resolve().then(() => this.buildRapportChart());
  }

  creer() {
    const code = this.formCode.trim().toUpperCase();
    const intitule = this.formIntitule.trim();
    if (!code || !intitule) return;
    this.saving.set(true); this.formError.set(null);
    const budget   = this.formBudget   ? parseFloat(this.formBudget) : null;
    const parentId = this.formParentId || null;
    this.svc.creerAxe(code, intitule, this.formType, budget, parentId).subscribe({
      next: a => {
        this.axes.update(list => [...list, a].sort((x, y) => x.code.localeCompare(y.code)));
        this.formCode = ''; this.formIntitule = ''; this.formBudget = '';
        this.formType = 'AUTRE'; this.formParentId = '';
        this.saving.set(false);
      },
      error: e => { this.formError.set(e?.error?.message ?? 'Erreur.'); this.saving.set(false); },
    });
  }

  startEdit(a: AxeAnalytique) {
    this.editing.set(a.id);
    this.editCode     = a.code;
    this.editIntitule = a.intitule;
    this.editType     = a.type;
    this.editBudget   = a.montantBudget != null ? String(a.montantBudget) : '';
    this.editParentId = a.parentId ?? '';
  }

  sauvegarder(id: string) {
    const budget   = this.editBudget   ? parseFloat(this.editBudget) : null;
    const parentId = this.editParentId || null;
    this.svc.modifierAxe(id, this.editCode.toUpperCase(), this.editIntitule,
                         this.editType, budget, parentId).subscribe({
      next: updated => {
        this.axes.update(list => list.map(a => a.id === id ? updated : a));
        this.editing.set(null);
      },
      error: e => this.formError.set(e?.error?.message ?? 'Erreur.'),
    });
  }

  toggleActif(a: AxeAnalytique) {
    this.svc.toggleActif(a.id).subscribe({
      next: () => this.axes.update(list => list.map(x => x.id === a.id ? { ...x, actif: !x.actif } : x)),
    });
  }

  supprimer(id: string) {
    this.svc.supprimerAxe(id).subscribe({
      next: () => this.axes.update(list => list.filter(a => a.id !== id)),
      error: e => this.formError.set(e?.error?.message ?? 'Erreur.'),
    });
  }

  chargerRapport() {
    if (!this.rapDebut || !this.rapFin) return;
    this.loadingRap.set(true); this.rapError.set(null);
    this.svc.rapport(this.rapDebut, this.rapFin).subscribe({
      next: r => {
        this.rapport.set(r);
        this.loadingRap.set(false);
        Promise.resolve().then(() => this.buildRapportChart());
      },
      error: e => { this.rapError.set(e?.error?.message ?? 'Erreur.'); this.loadingRap.set(false); },
    });
  }

  chargerRapportBailleur() {
    if (!this.bailleurDebut || !this.bailleurFin) return;
    this.loadingBailleur.set(true); this.bailleurError.set(null);
    this.svc.rapportBailleur(this.bailleurDebut, this.bailleurFin).subscribe({
      next: r => {
        this.rapBailleur.set(r);
        this.loadingBailleur.set(false);
        Promise.resolve().then(() => this.buildBailleurChart());
      },
      error: e => { this.bailleurError.set(e?.error?.message ?? 'Erreur.'); this.loadingBailleur.set(false); },
    });
  }

  // ─── Charts ──────────────────────────────────────────────────────────────

  private buildRapportChart() {
    const axes = this.rapportAvecBudget();
    if (!axes.length || !this.rapCanvasRef) return;

    this.rapChart?.destroy();

    const top15 = [...axes].sort((a, b) => b.totalDebit - a.totalDebit).slice(0, 15);
    const labels  = top15.map(a => a.axeCode);
    const budgets = top15.map(a => a.montantBudget ?? 0);
    const realise = top15.map(a => a.totalDebit);
    const bgColors = top15.map(a => {
      const t = a.tauxExecution ?? 0;
      if (t > 100) return 'rgba(239,68,68,0.75)';
      if (t > 80)  return 'rgba(249,115,22,0.75)';
      return 'rgba(34,197,94,0.75)';
    });

    this.rapChart = new Chart(this.rapCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Budget alloué',
            data: budgets,
            backgroundColor: 'rgba(156,163,175,0.35)',
            borderColor: 'rgba(156,163,175,0.8)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Réalisé (débit)',
            data: realise,
            backgroundColor: bgColors,
            borderColor: bgColors.map(c => c.replace('0.75', '1')),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${this.fmtK(ctx.parsed.x ?? 0)}`,
              afterLabel: ctx => {
                if (ctx.datasetIndex === 1) {
                  const a = top15[ctx.dataIndex];
                  return a.tauxExecution != null ? `Taux : ${a.tauxExecution.toFixed(1)}%` : '';
                }
                return '';
              },
            },
          },
        },
        scales: {
          x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }

  private buildBailleurChart() {
    const bailleurs = this.rapBailleur()?.bailleurs;
    if (!bailleurs?.length || !this.bailleurCanvasRef) return;

    this.bailleurChart?.destroy();

    const labels   = bailleurs.map(b => b.bailleurCode);
    const budgets  = bailleurs.map(b => b.montantBudget ?? 0);
    const depenses = bailleurs.map(b => b.totalDebit);
    const bgColors = bailleurs.map(b => {
      const t = b.tauxExecution ?? 0;
      if (t > 100) return 'rgba(239,68,68,0.75)';
      if (t > 80)  return 'rgba(249,115,22,0.75)';
      return 'rgba(34,197,94,0.75)';
    });

    this.bailleurChart = new Chart(this.bailleurCanvasRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Budget subvention',
            data: budgets,
            backgroundColor: 'rgba(156,163,175,0.35)',
            borderColor: 'rgba(156,163,175,0.8)',
            borderWidth: 1,
            borderRadius: 4,
          },
          {
            label: 'Dépenses (débit)',
            data: depenses,
            backgroundColor: bgColors,
            borderColor: bgColors.map(c => c.replace('0.75', '1')),
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.dataset.label}: ${this.fmtK(ctx.parsed.x ?? 0)}`,
              afterLabel: ctx => {
                if (ctx.datasetIndex === 1) {
                  const b = bailleurs[ctx.dataIndex];
                  return b.tauxExecution != null ? `Exécution : ${b.tauxExecution.toFixed(1)}%` : '';
                }
                return '';
              },
            },
          },
        },
        scales: {
          x: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 } } },
          y: { grid: { display: false }, ticks: { font: { size: 11 } } },
        },
      },
    });
  }

  // ─── Export CSV ──────────────────────────────────────────────────────────

  exportBailleurCsv() {
    const r = this.rapBailleur();
    if (!r) return;
    const rows: string[][] = [
      ['Bailleur','Code Projet/Activité','Type','Intitulé','Budget alloué','Compte','Libellé compte','Débit','Crédit','Solde','Taux exécution %']
    ];
    for (const b of r.bailleurs) {
      for (const sa of b.sousAxes) {
        for (const l of sa.lignes) {
          rows.push([
            b.bailleurCode,
            sa.axeCode === '—' ? '' : sa.axeCode,
            sa.axeType,
            sa.axeIntitule,
            sa.montantBudget != null ? String(sa.montantBudget) : '',
            l.compteNumero,
            l.compteIntitule,
            String(l.debit),
            String(l.credit),
            String(l.solde),
            sa.tauxExecution != null ? String(sa.tauxExecution) : '',
          ]);
        }
      }
    }
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `rapport-bailleur-${r.periodeDebut}-${r.periodeFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  fmtK(n: number): string {
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1) + ' M';
    if (abs >= 1_000)     return sign + (abs / 1_000).toFixed(1) + ' K';
    return sign + abs.toFixed(0);
  }

  typeLabel(type: TypeAxe): string {
    return TYPES_AXE.find(t => t.value === type)?.label ?? type;
  }

  typeColor(type: TypeAxe): string {
    return TYPES_AXE.find(t => t.value === type)?.color ?? 'bg-gray-100 text-gray-600';
  }

  barColor(pct: number): string {
    if (pct > 100) return 'bg-red-500';
    if (pct > 80)  return 'bg-orange-400';
    return 'bg-green-500';
  }
}
