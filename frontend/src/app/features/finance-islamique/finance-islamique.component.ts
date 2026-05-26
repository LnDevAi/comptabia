import {
  ChangeDetectionStrategy, Component, OnInit, signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FinanceIslamiqueService } from '../../core/services/finance-islamique.service';
import {
  ProduitIslamiqueResponse, IslamiqueDashboard, ZakatResponse, EtatResultatIslamique,
  TypeProduitIslamique, StatutProduit, StatutZakat, TYPES_PRODUIT_ISLAMIQUE
} from '../../core/models/finance-islamique.model';

type Tab = 'dashboard' | 'portefeuille' | 'zakat' | 'resultat';

@Component({
  selector: 'app-finance-islamique',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  template: `
<div class="p-6 space-y-6">

  <!-- En-tête -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900">Finance Islamique</h1>
    <p class="text-sm text-gray-500 mt-1">Produits halal conformes à la Charia — Mourabaha, Ijara, Moudaraba, Moucharaka, Sukuk, Zakat</p>
  </div>

  <!-- Sélecteur exercice -->
  <div class="flex items-center gap-2">
    <label class="text-sm text-gray-600">Exercice :</label>
    <select [value]="exercice()" (change)="onExerciceChange(+$any($event.target).value)"
            class="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
      @for (a of annees; track a) { <option [value]="a">{{ a }}</option> }
    </select>
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 border-b border-gray-200">
    @for (t of onglets; track t.key) {
      <button (click)="tab.set(t.key)"
              class="px-4 py-2 text-sm font-medium border-b-2 transition"
              [class.border-green-600]="tab() === t.key" [class.text-green-700]="tab() === t.key"
              [class.border-transparent]="tab() !== t.key" [class.text-gray-500]="tab() !== t.key">
        {{ t.label }}
      </button>
    }
  </div>

  <!-- ══ DASHBOARD ══ -->
  @if (tab() === 'dashboard' && dashboard()) {
    <div class="space-y-6">
      <!-- KPIs -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <p class="text-xs text-gray-500">Encours total actif</p>
          <p class="text-xl font-bold text-gray-900 mt-1">{{ dashboard()!.encoursTotalActif | number:'1.0-0' }}</p>
          <p class="text-xs text-gray-400">{{ dashboard()!.nbContrats }} contrats</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border" [class]="ratioClass(dashboard()!.ratioPAR30, 5, false)">
          <p class="text-xs text-gray-500">PAR 30</p>
          <p class="text-xl font-bold mt-1">{{ dashboard()!.ratioPAR30 | number:'1.2-2' }}%</p>
          <p class="text-xs opacity-70">Seuil ≤ 5%</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <p class="text-xs text-gray-500">Marge totale</p>
          <p class="text-xl font-bold text-green-700 mt-1">{{ dashboard()!.margeTotale | number:'1.0-0' }}</p>
          <p class="text-xs text-gray-400">Rendement moy. {{ dashboard()!.rendementMoyen | number:'1.2-2' }}%</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border bg-emerald-50 border-emerald-200">
          <p class="text-xs text-emerald-600">Participatifs (Moudaraba/Moucharaka)</p>
          <p class="text-xl font-bold text-emerald-800 mt-1">{{ dashboard()!.pourcentageParticipatifsVsTotal | number:'1.1-1' }}%</p>
          <p class="text-xs text-emerald-600">du portefeuille</p>
        </div>
      </div>

      <!-- Ratios financiers -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <p class="text-xs text-gray-500">PNI (Produit Net Islamique)</p>
          <p class="text-xl font-bold text-gray-900 mt-1">{{ dashboard()!.produitNetIslamique | number:'1.0-0' }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <p class="text-xs text-gray-500">Résultat net</p>
          <p class="text-xl font-bold mt-1"
             [class.text-green-700]="dashboard()!.resultat >= 0"
             [class.text-red-600]="dashboard()!.resultat < 0">
            {{ dashboard()!.resultat | number:'1.0-0' }}
          </p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-amber-200 bg-amber-50">
          <p class="text-xs text-amber-600">Zakat due</p>
          <p class="text-xl font-bold text-amber-800 mt-1">{{ dashboard()!.zakatDue | number:'1.0-0' }}</p>
          <p class="text-xs text-amber-600">Versée : {{ dashboard()!.zakatVersee | number:'1.0-0' }}</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border">
          <p class="text-xs text-gray-500">Total Actif</p>
          <p class="text-xl font-bold text-gray-900 mt-1">{{ dashboard()!.totalActif | number:'1.0-0' }}</p>
        </div>
      </div>

      <!-- Répartition par type -->
      @if (dashboard()!.repartitionParType.length > 0) {
        <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div class="px-4 py-3 border-b bg-gray-50">
            <h2 class="text-sm font-semibold text-gray-700">Répartition du portefeuille par type de produit</h2>
          </div>
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50 text-xs text-gray-500 uppercase">
              <th class="px-4 py-2 text-left">Type</th>
              <th class="px-4 py-2 text-right">Contrats</th>
              <th class="px-4 py-2 text-right">Encours</th>
              <th class="px-4 py-2 text-right">Marges</th>
              <th class="px-4 py-2 text-right">%</th>
            </tr></thead>
            <tbody>
              @for (r of dashboard()!.repartitionParType; track r.typeProduit) {
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-4 py-2">
                    <span class="px-2 py-0.5 rounded text-xs" [class]="typeBadge(r.typeProduit)">{{ r.typeProduitLabel }}</span>
                  </td>
                  <td class="px-4 py-2 text-right">{{ r.nbContrats }}</td>
                  <td class="px-4 py-2 text-right">{{ r.encours | number:'1.0-0' }}</td>
                  <td class="px-4 py-2 text-right text-green-700">{{ r.marges | number:'1.0-0' }}</td>
                  <td class="px-4 py-2 text-right font-semibold">{{ r.pourcentage | number:'1.1-1' }}%</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  }

  <!-- ══ PORTEFEUILLE ══ -->
  @if (tab() === 'portefeuille') {
    <div class="space-y-4">
      <div class="flex justify-end">
        <button (click)="ouvrirModal()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
          + Nouveau produit islamique
        </button>
      </div>

      @if (produits().length === 0) {
        <div class="text-center text-gray-400 py-16 text-sm">Aucun produit islamique enregistré.</div>
      } @else {
        <div class="overflow-x-auto bg-white rounded-xl shadow-sm border">
          <table class="w-full text-sm">
            <thead><tr class="bg-gray-50 text-xs text-gray-500 uppercase">
              <th class="px-3 py-2 text-left">Client / Référence</th>
              <th class="px-3 py-2 text-left">Type</th>
              <th class="px-3 py-2 text-right">Financement</th>
              <th class="px-3 py-2 text-right">Encours</th>
              <th class="px-3 py-2 text-right">Marge</th>
              <th class="px-3 py-2 text-right">Taux</th>
              <th class="px-3 py-2 text-right">J. retard</th>
              <th class="px-3 py-2 text-left">Statut</th>
              <th class="px-3 py-2"></th>
            </tr></thead>
            <tbody>
              @for (p of produits(); track p.id) {
                <tr class="border-t hover:bg-gray-50">
                  <td class="px-3 py-2">
                    <p class="font-medium">{{ p.nomClient }}</p>
                    <p class="text-xs text-gray-400">{{ p.reference ?? '—' }}</p>
                  </td>
                  <td class="px-3 py-2">
                    <span class="px-2 py-0.5 rounded text-xs" [class]="typeBadge(p.typeProduit)">{{ p.typeProduitLabel }}</span>
                  </td>
                  <td class="px-3 py-2 text-right">{{ p.montantFinancement | number:'1.0-0' }}</td>
                  <td class="px-3 py-2 text-right font-semibold">{{ p.montantEncours | number:'1.0-0' }}</td>
                  <td class="px-3 py-2 text-right text-green-700">{{ p.margeBeneficiaire | number:'1.0-0' }}</td>
                  <td class="px-3 py-2 text-right">{{ p.tauxMarge | number:'1.2-2' }}%</td>
                  <td class="px-3 py-2 text-right" [class]="retardClass(p.joursRetard)">{{ p.joursRetard }}</td>
                  <td class="px-3 py-2">
                    <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="statutBadge(p.statut)">{{ p.statutLabel }}</span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex gap-1">
                      <button (click)="ouvrirModal(p)" class="text-blue-600 hover:text-blue-800 text-xs">Modifier</button>
                      <button (click)="confirmerSuppression(p)" class="text-red-500 hover:text-red-700 text-xs">Suppr.</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  }

  <!-- ══ ZAKAT ══ -->
  @if (tab() === 'zakat') {
    <div class="space-y-4">
      <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p class="text-sm text-amber-800 font-medium">Calcul de la Zakat</p>
        <p class="text-xs text-amber-700 mt-1">
          La Zakat est calculée à 2,5% de la base zakatable (liquidités + créances Mourabaha + Sukuk)
          détenue depuis un hawl complet (1 an lunaire). Elle constitue une obligation réglementaire
          et est comptabilisée en compte 67x (charges).
        </p>
      </div>

      <div class="flex justify-end">
        <button (click)="ouvrirModalZakat()" class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm font-medium">
          + Calculer la Zakat {{ exercice() }}
        </button>
      </div>

      @if (zakats().length === 0) {
        <div class="text-center text-gray-400 py-12 text-sm">Aucun calcul de Zakat enregistré.</div>
      } @else {
        <div class="space-y-3">
          @for (z of zakats(); track z.id) {
            <div class="bg-white rounded-xl shadow-sm border p-5">
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-semibold text-gray-900">Zakat {{ z.exercice }}</p>
                  <p class="text-xs text-gray-500">Calculé le {{ z.dateCalcul }} — Taux {{ z.tauxZakat | number:'1.2-2' }}%</p>
                </div>
                <span class="px-2 py-1 rounded-full text-xs font-medium" [class]="zakatStatutBadge(z.statut)">{{ z.statutLabel }}</span>
              </div>
              <div class="grid grid-cols-3 gap-4 mt-4">
                <div class="text-center">
                  <p class="text-xs text-gray-500">Base zakatable</p>
                  <p class="text-lg font-bold text-gray-900">{{ z.baseZakatable | number:'1.0-0' }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-amber-600">Zakat due</p>
                  <p class="text-lg font-bold text-amber-700">{{ z.montantZakat | number:'1.0-0' }}</p>
                </div>
                <div class="text-center">
                  <p class="text-xs text-red-500">Reste à verser</p>
                  <p class="text-lg font-bold" [class.text-red-600]="z.resteAVerser > 0" [class.text-green-600]="z.resteAVerser === 0">
                    {{ z.resteAVerser | number:'1.0-0' }}
                  </p>
                </div>
              </div>
              <div class="flex justify-end mt-3">
                <button (click)="ouvrirModalVersementZakat(z)" class="text-xs text-amber-600 hover:text-amber-800 font-medium">
                  Enregistrer un versement
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  }

  <!-- ══ ÉTAT DE RÉSULTAT ══ -->
  @if (tab() === 'resultat' && resultat()) {
    <div class="space-y-4">
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">

        <div class="bg-green-700 text-white px-4 py-2 text-sm font-bold">
          I. PRODUIT NET ISLAMIQUE (PNI)
        </div>
        <table class="w-full text-sm">
          <tbody>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Marges bénéficiaires Mourabaha (71x)</td>
              <td class="px-4 py-2 text-right font-medium text-green-700">{{ resultat()!.margesMourabaha | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Loyers Ijara (72x)</td>
              <td class="px-4 py-2 text-right font-medium text-green-700">{{ resultat()!.loyersIjara | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Quotes-parts Moudaraba / Moucharaka (73x)</td>
              <td class="px-4 py-2 text-right font-medium text-green-700">{{ resultat()!.quotesPartsMoudarabaMoucharaka | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Profits Sukuk (74x)</td>
              <td class="px-4 py-2 text-right font-medium text-green-700">{{ resultat()!.profitsSukuk | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Produits interbancaires islamiques (70x)</td>
              <td class="px-4 py-2 text-right font-medium text-green-700">{{ resultat()!.produitsInterbanc | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Quotes-parts dépôts Moudaraba versées (60x)</td>
              <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.chargesRessources | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Profits partagés dépôts clientèle (61x)</td>
              <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.chargesDepots | number:'1.0-0' }}</td>
            </tr>
            <tr class="bg-green-50 border-b">
              <td class="px-4 py-2 font-bold text-green-900">PRODUIT NET ISLAMIQUE</td>
              <td class="px-4 py-2 text-right font-bold text-green-900 text-base">{{ resultat()!.produitNetIslamique | number:'1.0-0' }}</td>
            </tr>

            <tr class="bg-gray-100">
              <td colspan="2" class="px-4 py-2 font-bold text-gray-700 text-xs uppercase tracking-wide">
                II. CHARGES D'EXPLOITATION
              </td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Charges générales d'exploitation (64x)</td>
              <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.chargesGenerales | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Dotations amortissements et provisions (65x)</td>
              <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.dotationsAmortProv | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Pertes sur financements irrécouvrables (66x)</td>
              <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.pertesIrrecouvr | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Charges diverses islamiques (63x)</td>
              <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.chargesDiverses | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Reprises de provisions (75x + 78x)</td>
              <td class="px-4 py-2 text-right font-medium text-green-700">+ {{ resultat()!.reprises | number:'1.0-0' }}</td>
            </tr>
            <tr class="bg-green-50 border-b">
              <td class="px-4 py-2 font-bold text-green-900">RÉSULTAT D'EXPLOITATION</td>
              <td class="px-4 py-2 text-right font-bold text-green-900 text-base"
                  [class.text-red-700]="resultat()!.resultatExploitation < 0">
                {{ resultat()!.resultatExploitation | number:'1.0-0' }}
              </td>
            </tr>

            <tr class="bg-gray-100">
              <td colspan="2" class="px-4 py-2 font-bold text-gray-700 text-xs uppercase tracking-wide">
                III. ZAKAT ET IMPÔTS
              </td>
            </tr>
            <tr class="border-b hover:bg-amber-50">
              <td class="px-4 py-2 text-amber-700 pl-8 font-medium">Zakat due — obligation réglementaire (67x)</td>
              <td class="px-4 py-2 text-right font-medium text-amber-700">- {{ resultat()!.zakatDue | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Produits exceptionnels (76x + 77x)</td>
              <td class="px-4 py-2 text-right font-medium text-green-700">+ {{ resultat()!.produitsExceptionnels | number:'1.0-0' }}</td>
            </tr>
            <tr class="border-b hover:bg-gray-50">
              <td class="px-4 py-2 text-gray-600 pl-8">Impôts sur les bénéfices (68x)</td>
              <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.impots | number:'1.0-0' }}</td>
            </tr>

            <tr class="bg-green-100 border-t-2 border-green-300">
              <td class="px-4 py-3 font-bold text-green-900 text-base">RÉSULTAT NET</td>
              <td class="px-4 py-3 text-right font-bold text-base"
                  [class.text-green-900]="resultat()!.resultatNet >= 0"
                  [class.text-red-700]="resultat()!.resultatNet < 0">
                {{ resultat()!.resultatNet | number:'1.0-0' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Ratios -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-white rounded-xl p-4 shadow-sm border"
             [class.border-green-300]="resultat()!.ratioChargesPni <= 70"
             [class.border-red-300]="resultat()!.ratioChargesPni > 70">
          <p class="text-xs text-gray-500">Coefficient d'exploitation</p>
          <p class="text-2xl font-bold mt-1"
             [class.text-green-700]="resultat()!.ratioChargesPni <= 70"
             [class.text-red-600]="resultat()!.ratioChargesPni > 70">
            {{ resultat()!.ratioChargesPni | number:'1.2-2' }}%
          </p>
          <p class="text-xs text-gray-400">Charges / PNI — seuil ≤ 70%</p>
        </div>
        <div class="bg-white rounded-xl p-4 shadow-sm border border-amber-200">
          <p class="text-xs text-amber-600">Ratio Zakat / Résultat brut</p>
          <p class="text-2xl font-bold text-amber-700 mt-1">{{ resultat()!.ratioZakatResultat | number:'1.2-2' }}%</p>
          <p class="text-xs text-amber-500">Taux théorique : 2,5%</p>
        </div>
      </div>
    </div>
  }

</div>

<!-- ══ MODAL PRODUIT ══ -->
@if (modalProduitOuvert()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div class="px-6 py-4 border-b flex justify-between items-center sticky top-0 bg-white">
        <h2 class="font-semibold text-gray-900">{{ produitEnEdition() ? 'Modifier' : 'Nouveau produit islamique' }}</h2>
        <button (click)="fermerModal()" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>
      <form [formGroup]="form" (ngSubmit)="sauvegarder()" class="px-6 py-4 space-y-3">
        @if (!produitEnEdition()) {
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Nom client *</label>
              <input formControlName="nomClient" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Référence</label>
              <input formControlName="reference" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Type de produit</label>
            <select formControlName="typeProduit" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              @for (t of typesProduit; track t.value) {
                <option [value]="t.value">{{ t.label }} — {{ t.description }}</option>
              }
            </select>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Montant financé *</label>
              <input type="number" formControlName="montantFinancement" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Marge bénéficiaire</label>
              <input type="number" formControlName="margeBeneficiaire" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Taux de marge (%)</label>
              <input type="number" step="0.01" formControlName="tauxMarge" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Date contrat *</label>
              <input type="date" formControlName="dateContrat" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Objet du financement</label>
            <input formControlName="objetFinancement" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Ex: Acquisition d'un véhicule..." />
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Encours actuel</label>
              <input type="number" formControlName="montantEncours" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Jours de retard</label>
              <input type="number" formControlName="joursRetard" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Statut</label>
              <select formControlName="statut" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">Auto</option>
                <option value="ACTIF">Actif</option>
                <option value="EN_RETARD">En retard</option>
                <option value="DOUTEUX">Douteux</option>
                <option value="CLOTURE">Clôturé</option>
                <option value="PASSE_EN_PERTES">Passé en pertes</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Marge bénéficiaire</label>
              <input type="number" formControlName="margeBeneficiaire" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
        }
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea formControlName="notes" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="fermerModal()" class="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button type="submit" [disabled]="form.invalid" class="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
            {{ produitEnEdition() ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
}

<!-- ══ MODAL ZAKAT ══ -->
@if (modalZakatOuvert()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md">
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <h2 class="font-semibold text-gray-900">{{ zakatEnVersement() ? 'Enregistrer un versement' : 'Calculer la Zakat' }}</h2>
        <button (click)="fermerModalZakat()" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>
      <form [formGroup]="formZakat" (ngSubmit)="sauvegarderZakat()" class="px-6 py-4 space-y-3">
        @if (!zakatEnVersement()) {
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Exercice</label>
            <input type="number" formControlName="exercice" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Base zakatable (laisser vide pour calcul auto)</label>
            <input type="number" formControlName="baseZakatable" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Taux Zakat (%)</label>
            <input type="number" step="0.01" formControlName="tauxZakat" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        } @else {
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Montant versé</label>
            <input type="number" formControlName="montantVerse" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Statut</label>
            <select formControlName="statutZakat" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
              <option value="VERSE_PARTIELLEMENT">Versé partiellement</option>
              <option value="VERSE_INTEGRALEMENT">Versé intégralement</option>
            </select>
          </div>
        }
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea formControlName="notesZakat" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="fermerModalZakat()" class="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button type="submit" class="px-4 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700">
            {{ zakatEnVersement() ? 'Enregistrer' : 'Calculer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
}

<!-- Confirmation suppression -->
@if (produitASupprimer()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h3 class="font-semibold text-gray-900">Supprimer ce produit ?</h3>
      <p class="text-sm text-gray-600">{{ produitASupprimer()!.nomClient }} — {{ produitASupprimer()!.typeProduitLabel }}</p>
      <div class="flex justify-end gap-3">
        <button (click)="produitASupprimer.set(null)" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Annuler</button>
        <button (click)="supprimer()" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
      </div>
    </div>
  </div>
}
`,
})
export class FinanceIslamiqueComponent implements OnInit {
  private svc = new FinanceIslamiqueService();
  private fb = new FormBuilder();

  exercice = signal(new Date().getFullYear());
  annees: number[] = [];
  tab = signal<Tab>('dashboard');
  onglets = [
    { key: 'dashboard' as Tab,   label: 'Dashboard' },
    { key: 'portefeuille' as Tab, label: 'Portefeuille' },
    { key: 'zakat' as Tab,       label: 'Zakat' },
    { key: 'resultat' as Tab,    label: 'État de résultat' },
  ];

  produits = signal<ProduitIslamiqueResponse[]>([]);
  dashboard = signal<IslamiqueDashboard | null>(null);
  zakats = signal<ZakatResponse[]>([]);
  resultat = signal<EtatResultatIslamique | null>(null);

  modalProduitOuvert = signal(false);
  modalZakatOuvert = signal(false);
  produitEnEdition = signal<ProduitIslamiqueResponse | null>(null);
  produitASupprimer = signal<ProduitIslamiqueResponse | null>(null);
  zakatEnVersement = signal<ZakatResponse | null>(null);

  typesProduit = TYPES_PRODUIT_ISLAMIQUE;

  form = this.fb.group({
    nomClient:          ['', Validators.required],
    reference:          [''],
    typeProduit:        ['MOURABAHA' as TypeProduitIslamique],
    montantFinancement: [0, [Validators.required, Validators.min(1)]],
    montantEncours:     [null as number | null],
    margeBeneficiaire:  [0],
    tauxMarge:          [0],
    dateContrat:        ['', Validators.required],
    dateEcheance:       [''],
    joursRetard:        [0],
    statut:             ['' as StatutProduit | ''],
    objetFinancement:   [''],
    notes:              [''],
  });

  formZakat = this.fb.group({
    exercice:       [new Date().getFullYear()],
    baseZakatable:  [null as number | null],
    tauxZakat:      [2.5],
    montantVerse:   [null as number | null],
    statutZakat:    ['VERSE_PARTIELLEMENT' as StatutZakat],
    notesZakat:     [''],
  });

  constructor() {
    const y = new Date().getFullYear();
    for (let i = y; i >= y - 5; i--) this.annees.push(i);
  }

  ngOnInit() { this.charger(); }

  onExerciceChange(y: number) { this.exercice.set(y); this.charger(); }

  private charger() {
    this.svc.lister().subscribe(d => this.produits.set(d));
    this.svc.getDashboard(this.exercice()).subscribe(d => this.dashboard.set(d));
    this.svc.listerZakat().subscribe(d => this.zakats.set(d));
    this.svc.getEtatResultat(this.exercice()).subscribe(d => this.resultat.set(d));
  }

  // ─── Produits ──────────────────────────────────────────────────────────────

  ouvrirModal(p?: ProduitIslamiqueResponse) {
    this.produitEnEdition.set(p ?? null);
    this.form.reset({ typeProduit: 'MOURABAHA', joursRetard: 0, margeBeneficiaire: 0, tauxMarge: 0 });
    if (p) {
      this.form.patchValue({
        montantEncours: p.montantEncours, joursRetard: p.joursRetard,
        statut: p.statut, margeBeneficiaire: p.margeBeneficiaire,
        dateEcheance: p.dateEcheance ?? '', notes: p.notes ?? '',
      });
    }
    this.modalProduitOuvert.set(true);
  }

  fermerModal() { this.modalProduitOuvert.set(false); this.produitEnEdition.set(null); }

  sauvegarder() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const ed = this.produitEnEdition();
    if (ed) {
      this.svc.mettrAJour(ed.id, {
        montantEncours: v.montantEncours ?? undefined, joursRetard: v.joursRetard ?? 0,
        statut: (v.statut || undefined) as StatutProduit | undefined,
        margeBeneficiaire: v.margeBeneficiaire ?? undefined,
        dateEcheance: v.dateEcheance || undefined, notes: v.notes || undefined,
      }).subscribe(() => { this.fermerModal(); this.charger(); });
    } else {
      this.svc.creer({
        nomClient: v.nomClient!, reference: v.reference || undefined,
        typeProduit: (v.typeProduit as TypeProduitIslamique) || 'MOURABAHA',
        montantFinancement: v.montantFinancement!,
        margeBeneficiaire: v.margeBeneficiaire ?? 0, tauxMarge: v.tauxMarge ?? 0,
        dateContrat: v.dateContrat!, dateEcheance: v.dateEcheance || undefined,
        joursRetard: v.joursRetard ?? 0,
        objetFinancement: v.objetFinancement || undefined, notes: v.notes || undefined,
      }).subscribe(() => { this.fermerModal(); this.charger(); });
    }
  }

  confirmerSuppression(p: ProduitIslamiqueResponse) { this.produitASupprimer.set(p); }
  supprimer() {
    const p = this.produitASupprimer();
    if (!p) return;
    this.svc.supprimer(p.id).subscribe(() => { this.produitASupprimer.set(null); this.charger(); });
  }

  // ─── Zakat ─────────────────────────────────────────────────────────────────

  ouvrirModalZakat() { this.zakatEnVersement.set(null); this.formZakat.reset({ exercice: this.exercice(), tauxZakat: 2.5, statutZakat: 'VERSE_PARTIELLEMENT' }); this.modalZakatOuvert.set(true); }
  ouvrirModalVersementZakat(z: ZakatResponse) { this.zakatEnVersement.set(z); this.formZakat.reset({ montantVerse: z.resteAVerser, statutZakat: 'VERSE_INTEGRALEMENT' }); this.modalZakatOuvert.set(true); }
  fermerModalZakat() { this.modalZakatOuvert.set(false); this.zakatEnVersement.set(null); }

  sauvegarderZakat() {
    const v = this.formZakat.value;
    const vers = this.zakatEnVersement();
    if (vers) {
      this.svc.mettreAJourZakat(vers.id, {
        montantVerse: v.montantVerse ?? undefined,
        statut: (v.statutZakat as StatutZakat) || undefined,
        notes: v.notesZakat || undefined,
      }).subscribe(() => { this.fermerModalZakat(); this.charger(); });
    } else {
      this.svc.calculerZakat({
        exercice: v.exercice ?? this.exercice(),
        baseZakatable: v.baseZakatable ?? undefined,
        tauxZakat: v.tauxZakat ?? 2.5,
        notes: v.notesZakat || undefined,
      }).subscribe(() => { this.fermerModalZakat(); this.charger(); });
    }
  }

  // ─── Styles ────────────────────────────────────────────────────────────────

  ratioClass(v: number, threshold: number, higherIsBetter: boolean): string {
    const ok = higherIsBetter ? v >= threshold : v <= threshold;
    return ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800';
  }

  typeBadge(type: TypeProduitIslamique): string {
    const map: Partial<Record<TypeProduitIslamique, string>> = {
      MOURABAHA:   'bg-green-100 text-green-800',
      IJARA:       'bg-blue-100 text-blue-800',
      IJARA_IMB:   'bg-blue-100 text-blue-800',
      MOUDARABA:   'bg-purple-100 text-purple-800',
      MOUCHARAKA:  'bg-indigo-100 text-indigo-800',
      SALAM:       'bg-teal-100 text-teal-800',
      ISTISNAA:    'bg-cyan-100 text-cyan-800',
      QARD_HASSAN: 'bg-amber-100 text-amber-800',
      SUKUK:       'bg-emerald-100 text-emerald-800',
    };
    return map[type] ?? 'bg-gray-100 text-gray-700';
  }

  statutBadge(s: StatutProduit): string {
    const map: Record<StatutProduit, string> = {
      ACTIF:           'bg-green-100 text-green-800',
      EN_RETARD:       'bg-orange-100 text-orange-800',
      DOUTEUX:         'bg-red-100 text-red-800',
      CLOTURE:         'bg-blue-100 text-blue-800',
      PASSE_EN_PERTES: 'bg-gray-100 text-gray-600',
    };
    return map[s] ?? 'bg-gray-100 text-gray-700';
  }

  zakatStatutBadge(s: StatutZakat): string {
    const map: Record<StatutZakat, string> = {
      CALCULE:               'bg-amber-100 text-amber-800',
      VERSE_PARTIELLEMENT:   'bg-orange-100 text-orange-800',
      VERSE_INTEGRALEMENT:   'bg-green-100 text-green-800',
    };
    return map[s] ?? 'bg-gray-100 text-gray-700';
  }

  retardClass(j: number): string {
    if (j > 90) return 'text-red-600 font-semibold';
    if (j > 30) return 'text-orange-500 font-semibold';
    return 'text-gray-700';
  }
}
