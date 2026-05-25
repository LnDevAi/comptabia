import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviseService } from '../../core/services/devise.service';
import {
  TauxResponse, TauxLatest, SoldeDevise,
  TauxRequest, ConversionRequest, ConversionResponse
} from '../../core/models/devise.model';

type View = 'taux' | 'soldes' | 'conversion';

const DEVISES_COMMUNES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CAD', 'CNY', 'MAD', 'NGN', 'GHS', 'CFA'];

@Component({
  selector: 'app-devises',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Multi-devises</h1>
      <p class="text-sm text-gray-500 mt-0.5">Gestion des taux de change et soldes en devises étrangères</p>
    </div>
    <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
      @for (v of views; track v.key) {
        <button (click)="activeView = v.key"
                class="px-3 py-1.5 text-sm rounded-md font-medium transition"
                [ngClass]="activeView === v.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'">
          {{ v.label }}
        </button>
      }
    </div>
  </div>

  <!-- Taux du jour (badges) -->
  @if (tauxLatest.length > 0) {
    <div class="flex flex-wrap gap-2">
      @for (t of tauxLatest; track t.devise) {
        <span class="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
          1 {{ t.devise }} = {{ t.taux | number:'1.2-4' }} XOF
          <span class="text-gray-400 font-normal ml-1">{{ t.dateTaux | date:'dd/MM' }}</span>
        </span>
      }
    </div>
  }

  <!-- ── Vue Taux ─────────────────────────────────────────────────── -->
  @if (activeView === 'taux') {
    <div class="grid grid-cols-3 gap-6">

      <!-- Formulaire ajout/mise à jour -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 class="text-sm font-semibold text-gray-800">Enregistrer un taux</h2>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Devise</label>
          <input [(ngModel)]="form.devise" type="text" placeholder="USD"
                 list="devises-list" maxlength="3"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-400">
          <datalist id="devises-list">
            @for (d of DEVISES_COMMUNES; track d) {
              <option [value]="d">{{ d }}</option>
            }
          </datalist>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input [(ngModel)]="form.dateTaux" type="date"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Taux (1 devise = ? XOF)</label>
          <input [(ngModel)]="form.taux" type="number" min="0" step="0.0001"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
        </div>

        @if (formError) {
          <p class="text-xs text-red-600">{{ formError }}</p>
        }

        <button (click)="saveTaux()" [disabled]="saving"
                class="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
          {{ saving ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </div>

      <!-- Historique des taux -->
      <div class="col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-100">
          <span class="text-sm font-semibold text-gray-800">Historique des taux</span>
        </div>
        @if (taux.length === 0) {
          <p class="text-sm text-gray-400 text-center py-8">Aucun taux enregistré.</p>
        } @else {
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-2 text-left">Devise</th>
                <th class="px-4 py-2 text-left">Date</th>
                <th class="px-4 py-2 text-right">Taux (→ XOF)</th>
                <th class="px-4 py-2 text-right">Inverse (→ devise)</th>
                <th class="px-4 py-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              @for (t of taux; track t.id) {
                <tr class="border-t border-gray-100 hover:bg-gray-50">
                  <td class="px-4 py-2 font-bold text-blue-700">{{ t.devise }}</td>
                  <td class="px-4 py-2 text-gray-600">{{ t.dateTaux | date:'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-2 text-right font-mono text-gray-800">{{ t.taux | number:'1.4-6' }}</td>
                  <td class="px-4 py-2 text-right font-mono text-gray-500 text-xs">{{ inverse(t.taux) | number:'1.6-8' }}</td>
                  <td class="px-4 py-2 text-center">
                    <button (click)="deleteTaux(t.id)"
                            class="px-2 py-1 text-xs rounded border border-red-200 text-red-600 hover:bg-red-50">
                      ✕
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  }

  <!-- ── Vue Soldes ──────────────────────────────────────────────── -->
  @if (activeView === 'soldes') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <span class="text-sm font-semibold text-gray-800">Soldes par devise (écritures validées)</span>
        <button (click)="chargerSoldes()"
                class="text-xs text-blue-600 hover:text-blue-800">Actualiser</button>
      </div>
      @if (soldes.length === 0) {
        <p class="text-sm text-gray-400 text-center py-8">Aucune écriture en devise étrangère.</p>
      } @else {
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-2 text-left">Devise</th>
              <th class="px-4 py-2 text-right">Débit (devise)</th>
              <th class="px-4 py-2 text-right">Crédit (devise)</th>
              <th class="px-4 py-2 text-right">Solde (devise)</th>
              <th class="px-4 py-2 text-right">Taux actuel</th>
              <th class="px-4 py-2 text-right">Solde (XOF)</th>
            </tr>
          </thead>
          <tbody>
            @for (s of soldes; track s.devise) {
              <tr class="border-t border-gray-100 hover:bg-gray-50">
                <td class="px-4 py-2 font-bold text-blue-700">{{ s.devise }}</td>
                <td class="px-4 py-2 text-right text-green-600">{{ s.totalDebitDevise | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right text-red-500">{{ s.totalCreditDevise | number:'1.2-2' }}</td>
                <td class="px-4 py-2 text-right font-semibold"
                    [ngClass]="s.soldeDevise >= 0 ? 'text-gray-800' : 'text-red-600'">
                  {{ s.soldeDevise | number:'1.2-2' }}
                </td>
                <td class="px-4 py-2 text-right text-gray-500 font-mono text-xs">{{ s.tauxActuel | number:'1.4-6' }}</td>
                <td class="px-4 py-2 text-right font-bold"
                    [ngClass]="s.soldeXof >= 0 ? 'text-green-700' : 'text-red-600'">
                  {{ fmt(s.soldeXof) }}
                </td>
              </tr>
            }
          </tbody>
          <tfoot class="bg-gray-100 font-bold text-sm">
            <tr>
              <td class="px-4 py-2 text-gray-700" colspan="5">TOTAL en XOF</td>
              <td class="px-4 py-2 text-right"
                  [ngClass]="totalSoldeXof() >= 0 ? 'text-green-700' : 'text-red-600'">
                {{ fmt(totalSoldeXof()) }}
              </td>
            </tr>
          </tfoot>
        </table>
      }
    </div>
  }

  <!-- ── Vue Conversion ─────────────────────────────────────────── -->
  @if (activeView === 'conversion') {
    <div class="max-w-md mx-auto bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h2 class="text-sm font-semibold text-gray-800">Convertisseur de devises</h2>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Montant</label>
          <input [(ngModel)]="conv.montant" type="number" min="0" step="0.01"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Date</label>
          <input [(ngModel)]="conv.date" type="date"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">De</label>
          <input [(ngModel)]="conv.deviseSource" type="text" placeholder="USD" maxlength="3"
                 list="devises-list" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-400">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Vers</label>
          <input [(ngModel)]="conv.deviseCible" type="text" placeholder="XOF" maxlength="3"
                 list="devises-list" class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-400">
        </div>
      </div>

      <button (click)="convertir()" [disabled]="converting"
              class="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
        {{ converting ? 'Calcul…' : 'Convertir' }}
      </button>

      @if (convResult) {
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p class="text-2xl font-bold text-blue-800">
            {{ convResult.montantSource | number:'1.2-2' }} {{ convResult.deviseSource }}
          </p>
          <p class="text-gray-500 text-sm my-1">↓ taux {{ convResult.taux | number:'1.4-6' }}</p>
          <p class="text-3xl font-extrabold text-blue-900">
            {{ convResult.montantCible | number:'1.2-2' }} {{ convResult.deviseCible }}
          </p>
          <p class="text-xs text-gray-400 mt-1">Au {{ convResult.date | date:'dd/MM/yyyy' }}</p>
        </div>
      }
      @if (convError) {
        <p class="text-sm text-red-600 text-center">{{ convError }}</p>
      }
    </div>
  }

  <!-- Toast -->
  @if (toast) {
    <div class="fixed bottom-4 right-4 px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
         [ngClass]="toastError ? 'bg-red-600 text-white' : 'bg-green-600 text-white'">
      {{ toast }}
    </div>
  }

</div>
  `
})
export class DevisesComponent implements OnInit {

  private svc = inject(DeviseService);
  private cdr = inject(ChangeDetectorRef);

  readonly DEVISES_COMMUNES = DEVISES_COMMUNES;
  readonly views = [
    { key: 'taux' as View,       label: 'Taux de change' },
    { key: 'soldes' as View,     label: 'Soldes par devise' },
    { key: 'conversion' as View, label: 'Convertisseur' },
  ];

  activeView: View = 'taux';
  taux: TauxResponse[] = [];
  tauxLatest: TauxLatest[] = [];
  soldes: SoldeDevise[] = [];

  form: TauxRequest = { devise: '', dateTaux: new Date().toISOString().split('T')[0], taux: 0 };
  formError = '';
  saving = false;

  conv: ConversionRequest = {
    montant: 1, deviseSource: 'USD', deviseCible: 'XOF',
    date: new Date().toISOString().split('T')[0]
  };
  convResult: ConversionResponse | null = null;
  convError = '';
  converting = false;

  toast = '';
  toastError = false;

  ngOnInit() {
    this.chargerTaux();
    this.chargerSoldes();
  }

  chargerTaux() {
    this.svc.listTaux().subscribe(d => {
      this.taux = d;
      this.cdr.detectChanges();
    });
    this.svc.tauxLatest().subscribe(d => {
      this.tauxLatest = d;
      this.cdr.detectChanges();
    });
  }

  chargerSoldes() {
    this.svc.soldesParDevise().subscribe(d => {
      this.soldes = d;
      this.cdr.detectChanges();
    });
  }

  saveTaux() {
    if (!this.form.devise || !this.form.taux || !this.form.dateTaux) {
      this.formError = 'Tous les champs sont requis.';
      return;
    }
    this.formError = '';
    this.saving = true;
    this.svc.upsertTaux({ ...this.form, devise: this.form.devise.toUpperCase() }).subscribe({
      next: () => {
        this.saving = false;
        this.form = { devise: '', dateTaux: new Date().toISOString().split('T')[0], taux: 0 };
        this.chargerTaux();
        this.showToast('Taux enregistré');
      },
      error: () => {
        this.saving = false;
        this.formError = 'Erreur lors de l\'enregistrement.';
        this.cdr.detectChanges();
      }
    });
  }

  deleteTaux(id: string) {
    if (!confirm('Supprimer ce taux ?')) return;
    this.svc.deleteTaux(id).subscribe(() => {
      this.taux = this.taux.filter(t => t.id !== id);
      this.chargerTaux();
      this.showToast('Taux supprimé');
      this.cdr.detectChanges();
    });
  }

  convertir() {
    this.convError = '';
    this.convResult = null;
    this.converting = true;
    this.svc.convertir({
      ...this.conv,
      deviseSource: this.conv.deviseSource.toUpperCase(),
      deviseCible: this.conv.deviseCible.toUpperCase()
    }).subscribe({
      next: r => { this.convResult = r; this.converting = false; this.cdr.detectChanges(); },
      error: () => {
        this.converting = false;
        this.convError = 'Taux introuvable pour cette devise ou cette date.';
        this.cdr.detectChanges();
      }
    });
  }

  inverse(taux: number): number {
    return taux > 0 ? 1 / taux : 0;
  }

  totalSoldeXof(): number {
    return this.soldes.reduce((s, d) => s + d.soldeXof, 0);
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  private showToast(msg: string, error = false) {
    this.toast = msg;
    this.toastError = error;
    this.cdr.detectChanges();
    setTimeout(() => { this.toast = ''; this.cdr.detectChanges(); }, 3000);
  }
}
