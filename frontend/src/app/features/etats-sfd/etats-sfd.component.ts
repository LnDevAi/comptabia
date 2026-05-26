import {
  ChangeDetectionStrategy, Component, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CreditSfdService } from '../../core/services/credit-sfd.service';
import { EtatResultatSfd } from '../../core/models/credit-sfd.model';

@Component({
  selector: 'app-etats-sfd',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe],
  template: `
<div class="p-6 space-y-6">

  <!-- En-tête -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">États Financiers SFD</h1>
      <p class="text-sm text-gray-500 mt-1">État de résultat — PC-SFD BCEAO/UMOA</p>
    </div>
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-600">Exercice :</label>
      <select
        [value]="exercice()"
        (change)="onExerciceChange(+$any($event.target).value)"
        class="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (a of annees; track a) {
          <option [value]="a">{{ a }}</option>
        }
      </select>
    </div>
  </div>

  @if (resultat()) {
    <!-- Tableau État de Résultat -->
    <div class="bg-white rounded-xl shadow-sm border overflow-hidden">

      <!-- SECTION PNB -->
      <div class="bg-blue-700 text-white px-4 py-2 text-sm font-bold">
        I. PRODUIT NET BANCAIRE (PNB)
      </div>
      <table class="w-full text-sm">
        <tbody>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Intérêts et produits sur crédits clientèle (71x)</td>
            <td class="px-4 py-2 text-right font-medium text-green-700">{{ resultat()!.interetsCreditClientele | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Produits interbancaires (70x)</td>
            <td class="px-4 py-2 text-right font-medium text-green-700">{{ resultat()!.produitsInterbanc | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Produits divers bancaires (73x + 74x)</td>
            <td class="px-4 py-2 text-right font-medium text-green-700">{{ resultat()!.produitsDiversBancaires | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Intérêts sur dépôts clientèle (61x)</td>
            <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.interetsSurDepots | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Charges interbancaires (60x)</td>
            <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.chargesInterbanc | number:'1.0-0' }}</td>
          </tr>
          <tr class="bg-blue-50 border-b">
            <td class="px-4 py-2 font-bold text-blue-900">PRODUIT NET BANCAIRE</td>
            <td class="px-4 py-2 text-right font-bold text-blue-900 text-base">{{ resultat()!.produitNetBancaire | number:'1.0-0' }}</td>
          </tr>

          <!-- SECTION CHARGES -->
          <tr class="bg-gray-100">
            <td colspan="2" class="px-4 py-2 font-bold text-gray-700 text-xs uppercase tracking-wide">
              II. CHARGES D'EXPLOITATION
            </td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Charges générales d'exploitation (64x)</td>
            <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.chargesGeneralesExploitation | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Dotations aux amortissements et provisions (65x)</td>
            <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.dotationsAmortProv | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Pertes sur créances irrécouvrables (66x)</td>
            <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.pertesCreancesIrrecouvr | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Autres charges diverses (63x)</td>
            <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.autresChargesDiverses | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Reprises de provisions (75x + 78x)</td>
            <td class="px-4 py-2 text-right font-medium text-green-700">+ {{ resultat()!.reprisesProvisions | number:'1.0-0' }}</td>
          </tr>
          <tr class="bg-blue-50 border-b">
            <td class="px-4 py-2 font-bold text-blue-900">RÉSULTAT D'EXPLOITATION</td>
            <td class="px-4 py-2 text-right font-bold text-blue-900 text-base" [class.text-red-700]="resultat()!.resultatExploitation < 0">
              {{ resultat()!.resultatExploitation | number:'1.0-0' }}
            </td>
          </tr>

          <!-- SECTION EXCEPTIONNEL + IS -->
          <tr class="bg-gray-100">
            <td colspan="2" class="px-4 py-2 font-bold text-gray-700 text-xs uppercase tracking-wide">
              III. ÉLÉMENTS EXCEPTIONNELS ET IMPÔTS
            </td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Produits exceptionnels (76x)</td>
            <td class="px-4 py-2 text-right font-medium text-green-700">+ {{ resultat()!.produitsExceptionnels | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Subventions d'exploitation (77x)</td>
            <td class="px-4 py-2 text-right font-medium text-green-700">+ {{ resultat()!.subventionsExploitation | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Charges exceptionnelles (67x)</td>
            <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.chargesExceptionnelles | number:'1.0-0' }}</td>
          </tr>
          <tr class="border-b hover:bg-gray-50">
            <td class="px-4 py-2 text-gray-600 pl-8">Impôts sur résultats (68x)</td>
            <td class="px-4 py-2 text-right font-medium text-red-600">- {{ resultat()!.impotsSurResultats | number:'1.0-0' }}</td>
          </tr>

          <!-- RÉSULTAT NET -->
          <tr class="bg-green-50 border-t-2 border-green-200">
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

    <!-- Ratios synthèse -->
    <div class="grid grid-cols-2 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border"
           [class.border-green-300]="resultat()!.ratioChargesPnb <= 70"
           [class.border-red-300]="resultat()!.ratioChargesPnb > 70">
        <p class="text-xs text-gray-500">Coefficient d'exploitation</p>
        <p class="text-2xl font-bold mt-1"
           [class.text-green-700]="resultat()!.ratioChargesPnb <= 70"
           [class.text-red-600]="resultat()!.ratioChargesPnb > 70">
          {{ resultat()!.ratioChargesPnb | number:'1.2-2' }}%
        </p>
        <p class="text-xs text-gray-400 mt-1">Charges exploitation / PNB — seuil BCEAO ≤ 70%</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <p class="text-xs text-gray-500">Ratio provisions / PNB</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ resultat()!.ratioProvisionsPnb | number:'1.2-2' }}%</p>
        <p class="text-xs text-gray-400 mt-1">Dotations provisions / PNB</p>
      </div>
    </div>
  } @else {
    <div class="text-center text-gray-400 py-16 text-sm">
      Chargement de l'état de résultat SFD...
    </div>
  }

</div>
`,
})
export class EtatsSfdComponent implements OnInit {
  private svc = new CreditSfdService();

  exercice = signal(new Date().getFullYear());
  resultat = signal<EtatResultatSfd | null>(null);
  annees: number[] = [];

  constructor() {
    const current = new Date().getFullYear();
    for (let y = current; y >= current - 5; y--) this.annees.push(y);
  }

  ngOnInit() {
    this.charger();
  }

  onExerciceChange(year: number) {
    this.exercice.set(year);
    this.charger();
  }

  private charger() {
    this.svc.getEtatResultat(this.exercice()).subscribe(r => this.resultat.set(r));
  }
}
