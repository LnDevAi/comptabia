import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { BalanceAgeeService } from '../../core/services/balance-agee.service';
import { BalanceAgeeResponse } from '../../core/models/balance-agee.model';

@Component({
  selector: 'app-balance-agee',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DecimalPipe, DatePipe],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Balance âgée</h1>
      @if (data()) {
        <p class="text-xs text-gray-400 mt-0.5">Arrêtée au {{ data()!.dateArrete | date:'dd/MM/yyyy' }}</p>
      }
    </div>
    <div class="flex gap-2">
      <button (click)="charger('CLIENT')"
              [class]="type() === 'CLIENT'
                ? 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium'">
        Clients (41x)
      </button>
      <button (click)="charger('FOURNISSEUR')"
              [class]="type() === 'FOURNISSEUR'
                ? 'bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium'
                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium'">
        Fournisseurs (40x)
      </button>
    </div>
  </div>

  <!-- Loading -->
  @if (loading()) {
    <div class="flex items-center justify-center py-20 text-gray-400 text-sm">
      <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-3"></div>
      Calcul en cours…
    </div>
  }

  <!-- Error -->
  @if (error()) {
    <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
      {{ error() }}
    </div>
  }

  <!-- Table -->
  @if (!loading() && data()) {
    @if (data()!.lignes.length === 0) {
      <div class="bg-white border border-gray-200 rounded-2xl p-12 text-center text-gray-400 text-sm">
        Aucune créance / dette non lettrée pour les comptes {{ data()!.type === 'CLIENT' ? '41x' : '40x' }}.
      </div>
    } @else {
      <!-- Summary cards -->
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div class="bg-blue-50 rounded-xl p-3 text-center">
          <div class="text-xs text-blue-500 mb-1">0-30 jours</div>
          <div class="font-bold text-blue-700 font-mono text-sm">{{ data()!.totaux.j0 | number:'1.2-2' }}</div>
        </div>
        <div class="bg-yellow-50 rounded-xl p-3 text-center">
          <div class="text-xs text-yellow-600 mb-1">31-60 jours</div>
          <div class="font-bold text-yellow-700 font-mono text-sm">{{ data()!.totaux.j30 | number:'1.2-2' }}</div>
        </div>
        <div class="bg-orange-50 rounded-xl p-3 text-center">
          <div class="text-xs text-orange-600 mb-1">61-90 jours</div>
          <div class="font-bold text-orange-700 font-mono text-sm">{{ data()!.totaux.j60 | number:'1.2-2' }}</div>
        </div>
        <div class="bg-red-50 rounded-xl p-3 text-center">
          <div class="text-xs text-red-500 mb-1">&gt; 90 jours</div>
          <div class="font-bold text-red-700 font-mono text-sm">{{ data()!.totaux.j90 | number:'1.2-2' }}</div>
        </div>
        <div class="bg-gray-800 rounded-xl p-3 text-center">
          <div class="text-xs text-gray-300 mb-1">Total</div>
          <div class="font-bold text-white font-mono text-sm">{{ data()!.totaux.total | number:'1.2-2' }}</div>
        </div>
      </div>

      <!-- Detail table -->
      <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase border-b border-gray-200">
              <tr>
                <th class="px-4 py-3 text-left">Tiers</th>
                <th class="px-4 py-3 text-left">Code</th>
                <th class="px-4 py-3 text-left">Compte</th>
                <th class="px-4 py-3 text-right w-28">0-30j</th>
                <th class="px-4 py-3 text-right w-28">31-60j</th>
                <th class="px-4 py-3 text-right w-28">61-90j</th>
                <th class="px-4 py-3 text-right w-28">&gt;90j</th>
                <th class="px-4 py-3 text-right w-32 font-bold">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (ligne of data()!.lignes; track ligne.compteNumero) {
                <tr class="hover:bg-gray-50 transition-colors">
                  <td class="px-4 py-3 font-medium text-gray-800">{{ ligne.nom }}</td>
                  <td class="px-4 py-3 text-gray-500 text-xs">{{ ligne.code }}</td>
                  <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ ligne.compteNumero }}</td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="ligne.buckets.j0 > 0 ? 'text-blue-700' : 'text-gray-300'">
                    {{ ligne.buckets.j0 > 0 ? (ligne.buckets.j0 | number:'1.2-2') : '–' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="ligne.buckets.j30 > 0 ? 'text-yellow-700' : 'text-gray-300'">
                    {{ ligne.buckets.j30 > 0 ? (ligne.buckets.j30 | number:'1.2-2') : '–' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="ligne.buckets.j60 > 0 ? 'text-orange-700' : 'text-gray-300'">
                    {{ ligne.buckets.j60 > 0 ? (ligne.buckets.j60 | number:'1.2-2') : '–' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono"
                      [class]="ligne.buckets.j90 > 0 ? 'text-red-700 font-semibold' : 'text-gray-300'">
                    {{ ligne.buckets.j90 > 0 ? (ligne.buckets.j90 | number:'1.2-2') : '–' }}
                  </td>
                  <td class="px-4 py-3 text-right font-mono font-bold text-gray-800">
                    {{ ligne.buckets.total | number:'1.2-2' }}
                  </td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-gray-800 text-white text-xs font-bold">
              <tr>
                <td class="px-4 py-3" colspan="3">
                  TOTAL ({{ data()!.lignes.length }} tiers)
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{ data()!.totaux.j0 | number:'1.2-2' }}
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{ data()!.totaux.j30 | number:'1.2-2' }}
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{ data()!.totaux.j60 | number:'1.2-2' }}
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{ data()!.totaux.j90 | number:'1.2-2' }}
                </td>
                <td class="px-4 py-3 text-right font-mono">
                  {{ data()!.totaux.total | number:'1.2-2' }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    }
  }
</div>
  `
})
export class BalanceAgeeComponent implements OnInit {

  type    = signal<'CLIENT' | 'FOURNISSEUR'>('CLIENT');
  loading = signal(false);
  error   = signal<string | null>(null);
  data    = signal<BalanceAgeeResponse | null>(null);

  constructor(private balanceSvc: BalanceAgeeService) {}

  ngOnInit() { this.charger('CLIENT'); }

  charger(t: 'CLIENT' | 'FOURNISSEUR') {
    this.type.set(t);
    this.loading.set(true);
    this.error.set(null);
    this.data.set(null);

    this.balanceSvc.calculer(t).subscribe({
      next: res => { this.data.set(res); this.loading.set(false); },
      error: (err: any) => {
        this.error.set(err?.error?.message ?? 'Erreur lors du calcul.');
        this.loading.set(false);
      }
    });
  }
}
