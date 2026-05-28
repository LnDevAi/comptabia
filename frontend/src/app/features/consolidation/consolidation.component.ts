import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsolidationService } from '../../core/services/consolidation.service';
import {
  GroupeResponse, GroupeRequest, MembreRequest,
  BilanConsolide, CompteResultatConsolide, TFTConsolide,
  EliminationResponse, EliminationRequest,
  MethodeConsolidation, METHODES_CONSOLIDATION
} from '../../core/models/consolidation.model';

type View = 'groupes' | 'form-groupe' | 'etats';
type EtatTab = 'bilan' | 'resultat' | 'tft' | 'eliminations';

@Component({
  selector: 'app-consolidation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Consolidation & Multi-sociétés</h1>
      <p class="text-sm text-gray-500 mt-0.5">Intégration globale, proportionnelle, mise en équivalence — conformité OHADA</p>
    </div>
    @if (view === 'groupes') {
      <button (click)="openFormGroupe()"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
        + Nouveau groupe
      </button>
    }
    @if (view !== 'groupes') {
      <button (click)="view = 'groupes'"
              class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
        ← Retour aux groupes
      </button>
    }
  </div>

  <!-- ═══ LISTE DES GROUPES ═══ -->
  @if (view === 'groupes') {
    @if (groupes.length === 0) {
      <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p class="text-gray-400 text-lg mb-1">Aucun groupe défini</p>
        <p class="text-sm text-gray-400">Créez un groupe pour consolider plusieurs sociétés</p>
      </div>
    } @else {
      <div class="grid grid-cols-1 gap-4">
        @for (g of groupes; track g.id) {
          <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h3 class="font-semibold text-gray-900">{{ g.nom }}</h3>
                @if (g.description) {
                  <p class="text-sm text-gray-500 mt-0.5">{{ g.description }}</p>
                }
                <div class="flex flex-wrap gap-1.5 mt-2">
                  @for (m of g.membres; track m.entrepriseId) {
                    <span class="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                          [ngClass]="methodeClass(m.methodeConsolidation)">
                      {{ m.nom }}
                      <span class="opacity-70">{{ m.tauxDetention }}%</span>
                      <span class="font-semibold">{{ methodeLabel(m.methodeConsolidation) }}</span>
                    </span>
                  }
                  @if (g.membres.length === 0) {
                    <span class="text-xs text-gray-400 italic">Aucun membre</span>
                  }
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-4">
                <button (click)="openEtats(g)"
                        class="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                  États consolidés
                </button>
                <button (click)="openFormGroupe(g)"
                        class="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50">
                  Modifier
                </button>
                <button (click)="supprimerGroupe(g.id)"
                        class="px-3 py-1.5 text-red-500 hover:text-red-700 text-xs">
                  Suppr.
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  }

  <!-- ═══ FORMULAIRE GROUPE ═══ -->
  @if (view === 'form-groupe') {
    <div class="bg-white rounded-xl border border-gray-200 p-6 max-w-3xl">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">
        {{ editGroupeId ? 'Modifier le groupe' : 'Nouveau groupe de consolidation' }}
      </h2>
      <form (ngSubmit)="saveGroupe()" class="space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-600">Nom du groupe *</label>
            <input type="text" [(ngModel)]="form.nom" name="nom" required
                   class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          </div>
          <div>
            <label class="text-sm text-gray-600">Description</label>
            <input type="text" [(ngModel)]="form.description" name="description"
                   class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
          </div>
        </div>

        <!-- Membres -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-sm font-medium text-gray-700">Sociétés membres</label>
            <button type="button" (click)="addMembre()"
                    class="text-xs text-blue-600 hover:text-blue-800 font-medium">+ Ajouter une société</button>
          </div>

          @if (form.membres.length === 0) {
            <p class="text-sm text-gray-400 italic py-3 text-center border border-dashed border-gray-300 rounded-lg">
              Aucun membre — cliquez sur "+ Ajouter une société"
            </p>
          }

          @for (m of form.membres; track m; let i = $index) {
            <div class="grid grid-cols-12 gap-2 items-center mb-2 p-3 bg-gray-50 rounded-lg">
              <div class="col-span-5">
                <label class="text-xs text-gray-500">UUID société *</label>
                <input type="text" [(ngModel)]="m.entrepriseId" [name]="'eid_'+i" required
                       placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                       class="mt-0.5 w-full border border-gray-300 rounded px-2 py-1 text-xs font-mono">
              </div>
              <div class="col-span-2">
                <label class="text-xs text-gray-500">Taux %</label>
                <input type="number" [(ngModel)]="m.tauxDetention" [name]="'taux_'+i"
                       min="0" max="100" step="0.01"
                       class="mt-0.5 w-full border border-gray-300 rounded px-2 py-1 text-xs text-right">
              </div>
              <div class="col-span-4">
                <label class="text-xs text-gray-500">Méthode</label>
                <select [(ngModel)]="m.methodeConsolidation" [name]="'methode_'+i"
                        class="mt-0.5 w-full border border-gray-300 rounded px-2 py-1 text-xs bg-white">
                  @for (opt of methodes; track opt.value) {
                    <option [value]="opt.value">{{ opt.label }}</option>
                  }
                </select>
              </div>
              <div class="col-span-1 flex items-end justify-center pb-0.5">
                <button type="button" (click)="removeMembre(i)"
                        class="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
              </div>
            </div>
          }
          <p class="text-xs text-gray-400 mt-1">Trouvez les UUIDs dans Paramètres → Entreprise de chaque société.</p>
        </div>

        <!-- Méthodes explications -->
        <div class="grid grid-cols-3 gap-3">
          @for (opt of methodes; track opt.value) {
            <div class="border border-gray-200 rounded-lg p-3 text-xs"
                 [ngClass]="opt.value === 'INTEGRATION_GLOBALE' ? 'border-blue-200 bg-blue-50' :
                             opt.value === 'INTEGRATION_PROPORTIONNELLE' ? 'border-amber-200 bg-amber-50' :
                             'border-purple-200 bg-purple-50'">
              <p class="font-semibold text-gray-800">{{ opt.label }}</p>
              <p class="text-gray-500 mt-0.5">{{ opt.description }}</p>
            </div>
          }
        </div>

        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="view = 'groupes'"
                  class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit"
                  class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            {{ editGroupeId ? 'Enregistrer' : 'Créer le groupe' }}
          </button>
        </div>
      </form>
    </div>
  }

  <!-- ═══ ÉTATS CONSOLIDÉS ═══ -->
  @if (view === 'etats' && selectedGroupe) {
    <div class="space-y-4">

      <!-- Controls -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 flex-wrap">
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Groupe consolidé</p>
          <p class="font-semibold text-gray-900">{{ selectedGroupe.nom }}</p>
          <div class="flex flex-wrap gap-1 mt-1">
            @for (m of selectedGroupe.membres; track m.entrepriseId) {
              <span class="text-xs px-2 py-0.5 rounded-full"
                    [ngClass]="methodeClass(m.methodeConsolidation)">
                {{ m.nom }} {{ m.tauxDetention }}% ({{ methodeLabel(m.methodeConsolidation) }})
              </span>
            }
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <label class="text-sm text-gray-600">Exercice :</label>
          <input type="number" [(ngModel)]="exercice" min="2000" max="2100"
                 class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24">
          <button (click)="chargerEtats()"
                  class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Générer
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        @for (tab of etatTabs; track tab.key) {
          <button (click)="etatTab = tab.key"
                  class="px-4 py-1.5 text-sm rounded-md transition"
                  [ngClass]="etatTab === tab.key ? 'bg-white text-blue-700 font-semibold shadow-sm' : 'text-gray-600'">
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- ─── Bilan consolidé ─── -->
      @if (etatTab === 'bilan' && bilan) {
        @if (bilan.eliminationsAppliquees.length > 0) {
          <div class="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
            <span class="font-semibold">Éliminations appliquées :</span>
            @for (e of bilan.eliminationsAppliquees; track e.compteDebit) {
              <span class="ml-2">{{ e.libelle || (e.compteDebit + '↔' + e.compteCredit) }} ({{ fmt(e.montant) }})</span>
            }
          </div>
        }

        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
              <span class="font-semibold text-sm">ACTIF</span>
              <span class="font-bold">{{ fmt(bilan.totalActif) }}</span>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr class="text-xs text-gray-500">
                  <th class="px-3 py-1.5 text-left">Compte</th>
                  <th class="px-3 py-1.5 text-left">Intitulé</th>
                  <th class="px-3 py-1.5 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                @for (p of bilan.actif; track p.numero) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-1.5 font-mono text-xs text-gray-500">{{ p.numero }}</td>
                    <td class="px-3 py-1.5 text-gray-800 text-xs">
                      <span class="text-gray-400 mr-1">{{ p.categorie }}</span>{{ p.intitule }}
                    </td>
                    <td class="px-3 py-1.5 text-right font-medium text-sm">{{ fmt(p.montant) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-gray-700 text-white px-4 py-2 flex justify-between items-center">
              <span class="font-semibold text-sm">PASSIF</span>
              <span class="font-bold">{{ fmt(bilan.totalPassif) }}</span>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr class="text-xs text-gray-500">
                  <th class="px-3 py-1.5 text-left">Compte</th>
                  <th class="px-3 py-1.5 text-left">Intitulé</th>
                  <th class="px-3 py-1.5 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                @for (p of bilan.passif; track p.numero) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-1.5 font-mono text-xs text-gray-500">{{ p.numero }}</td>
                    <td class="px-3 py-1.5 text-gray-800 text-xs">{{ p.intitule }}</td>
                    <td class="px-3 py-1.5 text-right font-medium text-sm">{{ fmt(p.montant) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          ℹ {{ bilan.note }}
        </p>
      }

      <!-- ─── Compte de résultat ─── -->
      @if (etatTab === 'resultat' && compteResultat) {
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Total produits</p>
            <p class="text-xl font-bold text-green-600 mt-1">{{ fmt(compteResultat.totalProduits) }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Total charges</p>
            <p class="text-xl font-bold text-red-500 mt-1">{{ fmt(compteResultat.totalCharges) }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Résultat consolidé</p>
            <p class="text-xl font-bold mt-1"
               [ngClass]="compteResultat.resultat >= 0 ? 'text-green-700' : 'text-red-700'">
              {{ fmt(compteResultat.resultat) }}
            </p>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-green-600 text-white px-4 py-2 flex justify-between">
              <span class="font-semibold text-sm">PRODUITS (classe 7)</span>
              <span class="font-bold">{{ fmt(compteResultat.totalProduits) }}</span>
            </div>
            <table class="w-full text-sm">
              <tbody>
                @for (p of compteResultat.produits; track p.numero) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-1.5 font-mono text-xs text-gray-500">{{ p.numero }}</td>
                    <td class="px-3 py-1.5 text-gray-800 text-xs">{{ p.intitule }}</td>
                    <td class="px-3 py-1.5 text-right font-medium text-green-600">{{ fmt(p.montant) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-red-500 text-white px-4 py-2 flex justify-between">
              <span class="font-semibold text-sm">CHARGES (classe 6)</span>
              <span class="font-bold">{{ fmt(compteResultat.totalCharges) }}</span>
            </div>
            <table class="w-full text-sm">
              <tbody>
                @for (p of compteResultat.charges; track p.numero) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-1.5 font-mono text-xs text-gray-500">{{ p.numero }}</td>
                    <td class="px-3 py-1.5 text-gray-800 text-xs">{{ p.intitule }}</td>
                    <td class="px-3 py-1.5 text-right font-medium text-red-500">{{ fmt(p.montant) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          ℹ {{ compteResultat.note }}
        </p>
      }

      <!-- ─── TFT consolidé ─── -->
      @if (etatTab === 'tft' && tft) {
        <!-- KPIs trésorerie -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Trésorerie ouverture (N-1)</p>
            <p class="text-lg font-bold text-gray-700 mt-1">{{ fmt(tft.tresorerieOuverture) }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Variation trésorerie</p>
            <p class="text-lg font-bold mt-1" [ngClass]="tft.variationTresorerie >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ tft.variationTresorerie >= 0 ? '+' : '' }}{{ fmt(tft.variationTresorerie) }}
            </p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Trésorerie clôture (N)</p>
            <p class="text-lg font-bold text-blue-700 mt-1">{{ fmt(tft.tresorerieCloture) }}</p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <!-- Flux exploitation -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-blue-600 text-white px-4 py-2 flex justify-between">
              <span class="font-semibold text-sm">I. FLUX D'EXPLOITATION</span>
              <span class="font-bold" [ngClass]="tft.totalFluxExploitation >= 0 ? '' : 'text-red-200'">{{ fmt(tft.totalFluxExploitation) }}</span>
            </div>
            <table class="w-full text-xs">
              <tbody>
                @for (p of tft.fluxExploitation; track p.libelle) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-2 text-gray-700">{{ p.libelle }}</td>
                    <td class="px-3 py-2 text-right font-medium" [ngClass]="p.montant >= 0 ? 'text-green-700' : 'text-red-600'">
                      {{ p.montant >= 0 ? '+' : '' }}{{ fmt(p.montant) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Flux investissement -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-amber-600 text-white px-4 py-2 flex justify-between">
              <span class="font-semibold text-sm">II. FLUX D'INVESTISSEMENT</span>
              <span class="font-bold">{{ fmt(tft.totalFluxInvestissement) }}</span>
            </div>
            <table class="w-full text-xs">
              <tbody>
                @for (p of tft.fluxInvestissement; track p.libelle) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-2 text-gray-700">{{ p.libelle }}</td>
                    <td class="px-3 py-2 text-right font-medium" [ngClass]="p.montant >= 0 ? 'text-green-700' : 'text-red-600'">
                      {{ p.montant >= 0 ? '+' : '' }}{{ fmt(p.montant) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Flux financement -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-purple-600 text-white px-4 py-2 flex justify-between">
              <span class="font-semibold text-sm">III. FLUX DE FINANCEMENT</span>
              <span class="font-bold">{{ fmt(tft.totalFluxFinancement) }}</span>
            </div>
            <table class="w-full text-xs">
              <tbody>
                @for (p of tft.fluxFinancement; track p.libelle) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-2 text-gray-700">{{ p.libelle }}</td>
                    <td class="px-3 py-2 text-right font-medium" [ngClass]="p.montant >= 0 ? 'text-green-700' : 'text-red-600'">
                      {{ p.montant >= 0 ? '+' : '' }}{{ fmt(p.montant) }}
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2">
          ℹ {{ tft.note }}
        </p>
      }

      <!-- ─── Éliminations interco ─── -->
      @if (etatTab === 'eliminations') {
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="font-semibold text-gray-800">Éliminations inter-sociétés</h3>
              <p class="text-xs text-gray-500 mt-0.5">Neutralisez les opérations réciproques (créances/dettes, produits/charges intra-groupe)</p>
            </div>
            <button (click)="showElimForm = !showElimForm"
                    class="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
              + Ajouter élimination
            </button>
          </div>

          @if (showElimForm) {
            <form (ngSubmit)="addElimination()" class="bg-gray-50 rounded-lg p-4 mb-4 grid grid-cols-6 gap-3 items-end">
              <div class="col-span-1">
                <label class="text-xs text-gray-500">Compte débit *</label>
                <input type="text" [(ngModel)]="elimForm.compteDebit" name="cd" required
                       placeholder="ex: 411" class="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono">
              </div>
              <div class="col-span-1">
                <label class="text-xs text-gray-500">Compte crédit *</label>
                <input type="text" [(ngModel)]="elimForm.compteCredit" name="cc" required
                       placeholder="ex: 401" class="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm font-mono">
              </div>
              <div class="col-span-2">
                <label class="text-xs text-gray-500">Libellé</label>
                <input type="text" [(ngModel)]="elimForm.libelle" name="lib"
                       placeholder="ex: Créance/dette filiale A ↔ B"
                       class="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm">
              </div>
              <div class="col-span-1">
                <label class="text-xs text-gray-500">Montant *</label>
                <input type="number" [(ngModel)]="elimForm.montant" name="mt" required min="0"
                       class="mt-1 w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right">
              </div>
              <div class="col-span-1 flex gap-2">
                <button type="submit" class="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700">OK</button>
                <button type="button" (click)="showElimForm = false" class="px-2 py-1.5 border border-gray-300 text-gray-500 text-xs rounded hover:bg-gray-100">✕</button>
              </div>
            </form>
          }

          @if (eliminations.length === 0) {
            <p class="text-center text-sm text-gray-400 py-8">Aucune élimination configurée pour l'exercice {{ exercice }}</p>
          } @else {
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr class="text-xs text-gray-500 uppercase tracking-wide">
                  <th class="px-3 py-2 text-left">Compte débit</th>
                  <th class="px-3 py-2 text-left">Compte crédit</th>
                  <th class="px-3 py-2 text-left">Libellé</th>
                  <th class="px-3 py-2 text-right">Montant</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                @for (e of eliminations; track e.id) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-2 font-mono text-blue-600">{{ e.compteDebit }}</td>
                    <td class="px-3 py-2 font-mono text-red-600">{{ e.compteCredit }}</td>
                    <td class="px-3 py-2 text-gray-700">{{ e.libelle || '—' }}</td>
                    <td class="px-3 py-2 text-right font-medium">{{ fmt(e.montant) }}</td>
                    <td class="px-3 py-2 text-right">
                      <button (click)="deleteElimination(e.id)"
                              class="text-red-400 hover:text-red-600 text-xs">Suppr.</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }

          <div class="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
            <p class="font-semibold mb-1">Exemples d'éliminations courantes :</p>
            <ul class="space-y-0.5 list-disc list-inside">
              <li><span class="font-mono">411 ↔ 401</span> — Créances clients / Dettes fournisseurs intra-groupe</li>
              <li><span class="font-mono">706 ↔ 606</span> — Produits / Achats intra-groupe (ventes internes)</li>
              <li><span class="font-mono">26x ↔ 10x</span> — Titres de participation / Capital (élimination des titres)</li>
              <li><span class="font-mono">141 ↔ 786</span> — Provisions sur créances internes</li>
            </ul>
          </div>
        </div>
      }

    </div>
  }

</div>
  `
})
export class ConsolidationComponent implements OnInit {

  private svc = inject(ConsolidationService);
  private cdr = inject(ChangeDetectorRef);

  readonly methodes = METHODES_CONSOLIDATION;
  readonly etatTabs: { key: EtatTab; label: string }[] = [
    { key: 'bilan',        label: 'Bilan' },
    { key: 'resultat',     label: 'Compte de résultat' },
    { key: 'tft',          label: 'TFT' },
    { key: 'eliminations', label: 'Éliminations' },
  ];

  view: View = 'groupes';
  etatTab: EtatTab = 'bilan';

  groupes: GroupeResponse[] = [];
  selectedGroupe: GroupeResponse | null = null;
  editGroupeId: string | null = null;

  exercice = new Date().getFullYear();
  bilan: BilanConsolide | null = null;
  compteResultat: CompteResultatConsolide | null = null;
  tft: TFTConsolide | null = null;
  eliminations: EliminationResponse[] = [];

  form: GroupeRequest = this.emptyForm();
  showElimForm = false;
  elimForm: EliminationRequest = this.emptyElimForm();

  ngOnInit() { this.chargerGroupes(); }

  chargerGroupes() {
    this.svc.listGroupes().subscribe(g => {
      this.groupes = g;
      this.cdr.markForCheck();
    });
  }

  openFormGroupe(g?: GroupeResponse) {
    if (g) {
      this.editGroupeId = g.id;
      this.form = {
        nom: g.nom,
        description: g.description || '',
        membres: g.membres.map(m => ({
          entrepriseId: m.entrepriseId,
          tauxDetention: m.tauxDetention,
          methodeConsolidation: m.methodeConsolidation
        }))
      };
    } else {
      this.editGroupeId = null;
      this.form = this.emptyForm();
    }
    this.view = 'form-groupe';
  }

  addMembre() {
    this.form.membres.push({ entrepriseId: '', tauxDetention: 100, methodeConsolidation: 'INTEGRATION_GLOBALE' });
  }

  removeMembre(i: number) {
    this.form.membres.splice(i, 1);
  }

  saveGroupe() {
    if (!this.form.nom.trim()) return;
    const obs = this.editGroupeId
      ? this.svc.updateGroupe(this.editGroupeId, this.form)
      : this.svc.createGroupe(this.form);
    obs.subscribe(() => { this.chargerGroupes(); this.view = 'groupes'; });
  }

  supprimerGroupe(id: string) {
    if (!confirm('Supprimer ce groupe ?')) return;
    this.svc.deleteGroupe(id).subscribe(() => this.chargerGroupes());
  }

  openEtats(g: GroupeResponse) {
    this.selectedGroupe = g;
    this.bilan = null;
    this.compteResultat = null;
    this.tft = null;
    this.eliminations = [];
    this.view = 'etats';
    this.chargerEtats();
  }

  chargerEtats() {
    if (!this.selectedGroupe) return;
    const id = this.selectedGroupe.id;

    this.svc.getBilan(id, this.exercice).subscribe(b => { this.bilan = b; this.cdr.markForCheck(); });
    this.svc.getCompteResultat(id, this.exercice).subscribe(r => { this.compteResultat = r; this.cdr.markForCheck(); });
    this.svc.getTFT(id, this.exercice).subscribe(t => { this.tft = t; this.cdr.markForCheck(); });
    this.svc.listEliminations(id, this.exercice).subscribe(e => { this.eliminations = e; this.cdr.markForCheck(); });
  }

  addElimination() {
    if (!this.selectedGroupe) return;
    this.elimForm.exercice = this.exercice;
    this.svc.addElimination(this.selectedGroupe.id, this.elimForm).subscribe(e => {
      this.eliminations = [...this.eliminations, e];
      this.elimForm = this.emptyElimForm();
      this.showElimForm = false;
      this.cdr.markForCheck();
    });
  }

  deleteElimination(id: string) {
    if (!this.selectedGroupe) return;
    this.svc.deleteElimination(this.selectedGroupe.id, id).subscribe(() => {
      this.eliminations = this.eliminations.filter(e => e.id !== id);
      this.cdr.markForCheck();
    });
  }

  methodeLabel(m: MethodeConsolidation): string {
    return m === 'INTEGRATION_GLOBALE' ? 'IG' :
           m === 'INTEGRATION_PROPORTIONNELLE' ? 'IP' : 'MEQ';
  }

  methodeClass(m: MethodeConsolidation): string {
    return m === 'INTEGRATION_GLOBALE'         ? 'bg-blue-50 text-blue-700' :
           m === 'INTEGRATION_PROPORTIONNELLE' ? 'bg-amber-50 text-amber-700' :
                                                 'bg-purple-50 text-purple-700';
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  private emptyForm(): GroupeRequest {
    return { nom: '', description: '', membres: [] };
  }

  private emptyElimForm(): EliminationRequest {
    return { compteDebit: '', compteCredit: '', libelle: '', exercice: this.exercice, montant: 0 };
  }
}
