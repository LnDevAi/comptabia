import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatiosService } from '../../core/services/ratios.service';
import { RatiosData, RatioItem } from '../../core/models/ratios.model';

@Component({
  selector: 'app-ratios',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Ratios Financiers SYSCOHADA</h1>
      <p class="text-xs text-gray-400 mt-0.5">Analyse de la situation financière — exercice {{ exercice() }}</p>
    </div>
    <div class="flex items-center gap-3">
      <select [ngModel]="exercice()" (ngModelChange)="changeExercice($event)"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of years(); track y) { <option [value]="y">{{ y }}</option> }
      </select>
    </div>
  </div>

  @if (loading()) {
    <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Calcul en cours…</div>
  } @else if (error()) {
    <div class="flex items-center justify-center h-48 text-red-500 text-sm">{{ error() }}</div>
  } @else if (data()) {

    <!-- Cartes de synthèse -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Total Actif</p>
        <p class="text-lg font-bold text-gray-800 mt-1 font-mono">{{ data()!.totalActif | number:'1.0-0' }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Chiffre d'affaires</p>
        <p class="text-lg font-bold text-blue-700 mt-1 font-mono">{{ data()!.chiffreAffaires | number:'1.0-0' }}</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Résultat net</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'">
          {{ data()!.resultatNet | number:'1.0-0' }}
        </p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-500 uppercase tracking-wide">Capitaux propres</p>
        <p class="text-lg font-bold mt-1 font-mono"
           [class]="data()!.capitauxPropres >= 0 ? 'text-gray-800' : 'text-red-700'">
          {{ data()!.capitauxPropres | number:'1.0-0' }}
        </p>
      </div>
    </div>

    <!-- FRNG / BFR / TN -->
    <div class="grid grid-cols-3 gap-4">
      <div class="rounded-xl border p-4 text-center"
           [class]="data()!.frng >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">FRNG</p>
        <p class="text-xl font-bold mt-1 font-mono"
           [class]="data()!.frng >= 0 ? 'text-green-700' : 'text-red-700'">
          {{ data()!.frng | number:'1.0-0' }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Fonds de Roulement Net Global</p>
      </div>
      <div class="rounded-xl border p-4 text-center"
           [class]="data()!.bfr <= 0 ? 'bg-green-50 border-green-200' : (data()!.bfr <= data()!.frng ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200')">
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">BFR</p>
        <p class="text-xl font-bold mt-1 font-mono"
           [class]="data()!.bfr <= 0 ? 'text-green-700' : (data()!.bfr <= data()!.frng ? 'text-yellow-700' : 'text-red-700')">
          {{ data()!.bfr | number:'1.0-0' }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Besoin en Fonds de Roulement</p>
      </div>
      <div class="rounded-xl border p-4 text-center"
           [class]="(data()!.frng - data()!.bfr) >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-red-50 border-red-200'">
        <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">TN</p>
        <p class="text-xl font-bold mt-1 font-mono"
           [class]="(data()!.frng - data()!.bfr) >= 0 ? 'text-blue-700' : 'text-red-700'">
          {{ (data()!.frng - data()!.bfr) | number:'1.0-0' }}
        </p>
        <p class="text-xs text-gray-400 mt-0.5">Trésorerie Nette</p>
      </div>
    </div>

    <!-- Groupes de ratios -->
    @for (groupe of data()!.groupes; track groupe.titre) {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold">{{ groupe.titre }}</div>
        <div class="divide-y divide-gray-100">
          @for (r of groupe.ratios; track r.code) {
            <div class="px-4 py-3 flex items-center gap-4">
              <!-- Indicateur de niveau -->
              <span class="shrink-0 w-2 h-8 rounded-full"
                    [class]="niveauColor(r.niveau, 'bg')"></span>
              <!-- Libellé + formule -->
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-800">{{ r.libelle }}</p>
                <p class="text-xs text-gray-400 truncate">{{ r.formule }}</p>
              </div>
              <!-- Valeur -->
              <div class="text-right shrink-0 w-40">
                <p class="text-base font-bold font-mono" [class]="niveauColor(r.niveau, 'text')">
                  {{ formatValeur(r) }}
                </p>
                <p class="text-xs" [class]="niveauColor(r.niveau, 'text-light')">
                  {{ niveauLabel(r.niveau) }}
                </p>
              </div>
              <!-- Badge -->
              <span class="shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold"
                    [class]="niveauColor(r.niveau, 'badge')">
                {{ r.niveau }}
              </span>
            </div>
          }
        </div>
      </div>
    }

    <p class="text-xs text-gray-400 text-center">
      Ratios calculés depuis les écritures validées de l'exercice {{ data()!.exercice }} — SYSCOHADA Système Normal
    </p>
  }
</div>
  `
})
export class RatiosComponent implements OnInit {

  constructor(private svc: RatiosService) {}

  exercice = signal(new Date().getFullYear());
  loading  = signal(false);
  error    = signal<string | null>(null);
  data     = signal<RatiosData | null>(null);

  years = computed(() => {
    const y = new Date().getFullYear();
    return [y, y - 1, y - 2, y - 3];
  });

  ngOnInit() { this.load(); }

  changeExercice(y: number) {
    this.exercice.set(Number(y));
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.error.set(null);
    this.svc.calculer(this.exercice()).subscribe({
      next: d => { this.data.set(d); this.loading.set(false); },
      error: (e: any) => { this.error.set(e?.error?.message ?? 'Erreur de calcul'); this.loading.set(false); }
    });
  }

  formatValeur(r: RatioItem): string {
    const interp = r.interpretation ?? '';
    const unite = interp.includes('%') ? '%' : interp.includes('jours') ? ' j' :
                  interp.includes('ans') ? ' ans' : '';
    const v = r.valeur;
    if (unite === '%') return v.toFixed(1) + '%';
    if (unite === ' j') return v.toFixed(0) + ' j';
    if (unite === ' ans') return v.toFixed(1) + ' ans';
    // monetary or ratio
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(2) + ' M';
    if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(1) + ' K';
    return v.toFixed(2) + ' ×';
  }

  niveauColor(niveau: string, variant: 'bg' | 'text' | 'text-light' | 'badge'): string {
    const map: Record<string, Record<string, string>> = {
      BON:    { bg: 'bg-green-500', text: 'text-green-700', 'text-light': 'text-green-500', badge: 'bg-green-100 text-green-700' },
      MOYEN:  { bg: 'bg-yellow-400', text: 'text-yellow-700', 'text-light': 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-700' },
      FAIBLE: { bg: 'bg-red-500', text: 'text-red-700', 'text-light': 'text-red-400', badge: 'bg-red-100 text-red-700' },
      INFO:   { bg: 'bg-blue-400', text: 'text-blue-700', 'text-light': 'text-blue-400', badge: 'bg-blue-100 text-blue-700' },
    };
    return (map[niveau] ?? map['INFO'])[variant] ?? '';
  }

  niveauLabel(niveau: string): string {
    return { BON: 'Satisfaisant', MOYEN: 'À surveiller', FAIBLE: 'Insuffisant', INFO: '' }[niveau] ?? '';
  }
}
