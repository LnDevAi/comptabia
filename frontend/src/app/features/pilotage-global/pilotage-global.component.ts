import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardGlobalService } from '../../core/services/dashboard-global.service';
import {
  DashboardGlobal, Alerte, TopAxe, MoisTendance, MOIS_COURTS
} from '../../core/models/dashboard-global.model';

@Component({
  selector: 'app-pilotage-global',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Tableau de bord dirigeant</h1>
      <p class="text-sm text-gray-500 mt-0.5">Vue consolidée — financier · budgets · analytique · alertes</p>
    </div>
    <div class="flex items-center gap-3">
      <select [(ngModel)]="exercice" (ngModelChange)="charger()"
              class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        @for (y of years; track y) { <option [value]="y">{{ y }}</option> }
      </select>
      <button (click)="charger()" [disabled]="loading()"
              class="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-40">
        ↺ Actualiser
      </button>
    </div>
  </div>

  @if (loading()) {
    <div class="flex items-center justify-center h-64 text-gray-400">Chargement…</div>
  } @else if (error()) {
    <div class="flex items-center justify-center h-64 text-red-500">{{ error() }}</div>
  } @else if (d()) {

  <!-- ═══ ALERTES ══════════════════════════════════════════════════════════ -->
  @if (d()!.alertes.length > 0) {
  <div class="flex flex-wrap gap-2">
    @for (a of d()!.alertes; track a.type) {
      <div class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
           [ngClass]="alerteClass(a)">
        <span>{{ alerteIcon(a) }}</span>
        <span>{{ a.message }}</span>
      </div>
    }
  </div>
  }

  <!-- ═══ KPI FINANCIERS ════════════════════════════════════════════════════ -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Chiffre d'affaires</p>
      <p class="text-2xl font-bold text-blue-700 mt-1 font-mono">{{ fmt(d()!.financier.ca) }}</p>
      <p class="text-xs text-gray-400 mt-1">Produits classe 7</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Charges</p>
      <p class="text-2xl font-bold text-orange-600 mt-1 font-mono">{{ fmt(d()!.financier.charges) }}</p>
      <p class="text-xs text-gray-400 mt-1">Charges classe 6</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Résultat net</p>
      <p class="text-2xl font-bold mt-1 font-mono"
         [ngClass]="d()!.financier.resultatNet >= 0 ? 'text-green-600' : 'text-red-600'">
        {{ fmt(d()!.financier.resultatNet) }}
      </p>
      <p class="text-xs mt-1" [ngClass]="d()!.financier.margeNette >= 0 ? 'text-gray-400' : 'text-red-400'">
        Marge : {{ d()!.financier.margeNette | number:'1.1-1' }}%
      </p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
      <p class="text-xs text-gray-400 uppercase tracking-wide">Trésorerie nette</p>
      <p class="text-2xl font-bold mt-1 font-mono"
         [ngClass]="d()!.financier.tresorerie >= 0 ? 'text-emerald-600' : 'text-red-600'">
        {{ fmt(d()!.financier.tresorerie) }}
      </p>
      <p class="text-xs text-gray-400 mt-1">Solde comptes classe 5</p>
    </div>
  </div>

  <!-- ═══ BUDGETS ═══════════════════════════════════════════════════════════ -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">

    <!-- Budget comptable -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-semibold text-gray-700">Budget comptable</h2>
          <p class="text-xs text-gray-400">{{ d()!.budgetComptable.nbLignes }} lignes budgétaires</p>
        </div>
        @if (d()!.budgetComptable.nbDepassees > 0) {
          <span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            {{ d()!.budgetComptable.nbDepassees }} dépassé(s)
          </span>
        }
      </div>
      @if (d()!.budgetComptable.nbLignes === 0) {
        <p class="text-sm text-gray-400 text-center py-4">Aucun budget défini</p>
      } @else {
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-gray-500">
            <span>Réalisé : <strong class="text-gray-800">{{ fmt(d()!.budgetComptable.realise) }}</strong></span>
            <span>Budget : <strong class="text-gray-800">{{ fmt(d()!.budgetComptable.previsionnel) }}</strong></span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-3 rounded-full transition-all duration-700"
                 [ngClass]="barColor(d()!.budgetComptable.pct)"
                 [style.width.%]="d()!.budgetComptable.pct > 100 ? 100 : d()!.budgetComptable.pct"></div>
          </div>
          <div class="flex justify-between text-xs">
            <span class="font-bold text-lg" [ngClass]="barTextColor(d()!.budgetComptable.pct)">
              {{ d()!.budgetComptable.pct | number:'1.1-1' }}%
            </span>
            <span [ngClass]="d()!.budgetComptable.ecart >= 0 ? 'text-green-600' : 'text-red-600'"
                  class="text-xs font-medium">
              {{ d()!.budgetComptable.ecart >= 0 ? 'Marge : ' : 'Dépassement : ' }}
              {{ d()!.budgetComptable.ecart < 0
                  ? ((-d()!.budgetComptable.ecart) | number:'1.0-0')
                  : (d()!.budgetComptable.ecart | number:'1.0-0') }}
            </span>
          </div>
        </div>
      }
    </div>

    <!-- Budget RH -->
    <div class="bg-white rounded-xl border border-gray-200 p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-semibold text-gray-700">Budget RH</h2>
          <p class="text-xs text-gray-400">{{ d()!.budgetRh.nbLignes }} catégories budgétisées</p>
        </div>
        @if (d()!.budgetRh.nbDepassees > 0) {
          <span class="px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            {{ d()!.budgetRh.nbDepassees }} dépassé(s)
          </span>
        }
      </div>
      @if (d()!.budgetRh.nbLignes === 0) {
        <p class="text-sm text-gray-400 text-center py-4">Aucun budget RH défini</p>
      } @else {
        <div class="space-y-2">
          <div class="flex justify-between text-xs text-gray-500">
            <span>Réalisé : <strong class="text-gray-800">{{ fmt(d()!.budgetRh.realise) }}</strong></span>
            <span>Budget : <strong class="text-gray-800">{{ fmt(d()!.budgetRh.previsionnel) }}</strong></span>
          </div>
          <div class="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-3 rounded-full transition-all duration-700"
                 [ngClass]="barColor(d()!.budgetRh.pct)"
                 [style.width.%]="d()!.budgetRh.pct > 100 ? 100 : d()!.budgetRh.pct"></div>
          </div>
          <div class="flex justify-between text-xs">
            <span class="font-bold text-lg" [ngClass]="barTextColor(d()!.budgetRh.pct)">
              {{ d()!.budgetRh.pct | number:'1.1-1' }}%
            </span>
            <span [ngClass]="d()!.budgetRh.ecart >= 0 ? 'text-green-600' : 'text-red-600'"
                  class="text-xs font-medium">
              {{ d()!.budgetRh.ecart >= 0 ? 'Marge : ' : 'Dépassement : ' }}
              {{ d()!.budgetRh.ecart < 0
                  ? ((-d()!.budgetRh.ecart) | number:'1.0-0')
                  : (d()!.budgetRh.ecart | number:'1.0-0') }}
            </span>
          </div>
        </div>
      }
    </div>
  </div>

  <!-- ═══ TENDANCE MENSUELLE + TOP AXES ═════════════════════════════════════ -->
  <div class="grid grid-cols-1 xl:grid-cols-5 gap-4">

    <!-- Tendance mensuelle (3/5) -->
    <div class="xl:col-span-3 bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Tendance mensuelle — Produits vs Charges</h2>
      @if (d()!.tendance.length === 0) {
        <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Aucune donnée</div>
      } @else {
        <div class="space-y-1">
          @for (row of d()!.tendance; track row.mois) {
          <div class="flex items-center gap-2 text-xs">
            <span class="w-7 text-right text-gray-400 font-medium shrink-0">{{ moisCourt(row.mois) }}</span>
            <div class="flex-1 flex flex-col gap-0.5">
              <!-- CA bar -->
              <div class="flex items-center gap-1.5">
                <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-2 bg-blue-500 rounded-full"
                       [style.width.%]="barWidthTendance(row.ca)"></div>
                </div>
                <span class="text-blue-700 font-mono text-xs w-24">{{ fmtK(row.ca) }}</span>
              </div>
              <!-- Charges bar -->
              <div class="flex items-center gap-1.5">
                <div class="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-2 bg-orange-400 rounded-full"
                       [style.width.%]="barWidthTendance(row.charges)"></div>
                </div>
                <span class="text-orange-600 font-mono text-xs w-24">{{ fmtK(row.charges) }}</span>
              </div>
            </div>
            <!-- Résultat mensuel -->
            <span class="w-16 text-right font-mono text-xs font-semibold"
                  [ngClass]="(row.ca - row.charges) >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ fmtK(row.ca - row.charges) }}
            </span>
          </div>
          }
        </div>
        <div class="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span class="flex items-center gap-1"><span class="w-3 h-1.5 bg-blue-500 rounded inline-block"></span> Produits</span>
          <span class="flex items-center gap-1"><span class="w-3 h-1.5 bg-orange-400 rounded inline-block"></span> Charges</span>
          <span class="flex items-center gap-1"><span class="w-3 h-1.5 bg-green-500 rounded inline-block"></span> Résultat net</span>
        </div>
      }
    </div>

    <!-- Top 5 axes (2/5) -->
    <div class="xl:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
      <h2 class="text-sm font-semibold text-gray-700 mb-4">Top 5 axes analytiques</h2>
      @if (d()!.topAxes.length === 0) {
        <div class="flex flex-col items-center justify-center h-32 text-gray-400 text-sm gap-1">
          <span class="text-2xl">📊</span>
          <span>Aucune ventilation</span>
        </div>
      } @else {
        <div class="space-y-3">
          @for (axe of d()!.topAxes; track axe.code) {
          <div>
            <div class="flex items-center justify-between mb-0.5">
              <div class="flex items-center gap-1.5 min-w-0">
                <span class="inline-flex shrink-0 items-center px-1.5 py-0.5 rounded text-xs font-medium"
                      [ngClass]="typeAxeColor(axe.type)">
                  {{ typeAxeLabel(axe.type) }}
                </span>
                <span class="text-xs font-mono text-gray-600 truncate">{{ axe.code }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0 ml-1">
                <span class="text-xs font-mono text-gray-700">{{ fmtK(axe.depenses) }}</span>
                @if (axe.tauxExecution != null) {
                  <span class="text-xs font-bold"
                        [ngClass]="axe.tauxExecution > 100 ? 'text-red-600' : axe.tauxExecution > 80 ? 'text-orange-500' : 'text-green-600'">
                    {{ axe.tauxExecution | number:'1.0-1' }}%
                  </span>
                }
              </div>
            </div>
            <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div class="h-1.5 rounded-full"
                   [ngClass]="typeAxeBar(axe.type)"
                   [style.width.%]="barWidthAxe(axe.depenses)"></div>
            </div>
            <p class="text-xs text-gray-400 truncate mt-0.5">{{ axe.intitule }}</p>
          </div>
          }
        </div>
      }
    </div>
  </div>

  }
</div>
  `,
})
export class PilotageGlobalComponent implements OnInit {

  private svc = inject(DashboardGlobalService);

  exercice = new Date().getFullYear();
  years    = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  d       = signal<DashboardGlobal | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  ngOnInit() { this.charger(); }

  charger() {
    this.loading.set(true); this.error.set(null);
    this.svc.get(this.exercice).subscribe({
      next:  r  => { this.d.set(r); this.loading.set(false); },
      error: () => { this.error.set('Erreur de chargement.'); this.loading.set(false); },
    });
  }

  // ─── Formatage ───────────────────────────────────────────────────────────

  fmt(n: number): string {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + ' M';
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(0) + ' K';
    return n.toFixed(0);
  }

  fmtK(n: number): string {
    if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(n) >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toFixed(0);
  }

  moisCourt(m: number): string { return MOIS_COURTS[m] ?? ''; }

  // ─── Barres tendance ─────────────────────────────────────────────────────

  private get maxTendance(): number {
    const t = this.d()?.tendance ?? [];
    return Math.max(1, ...t.map(r => Math.max(r.ca, r.charges)));
  }

  barWidthTendance(v: number): number {
    return Math.min(100, (v / this.maxTendance) * 100);
  }

  // ─── Barres top axes ─────────────────────────────────────────────────────

  private get maxAxe(): number {
    const top = this.d()?.topAxes ?? [];
    return Math.max(1, ...top.map(a => a.depenses));
  }

  barWidthAxe(v: number): number {
    return Math.min(100, (v / this.maxAxe) * 100);
  }

  // ─── Couleurs ────────────────────────────────────────────────────────────

  barColor(pct: number): string {
    if (pct > 100) return 'bg-red-500';
    if (pct > 80)  return 'bg-orange-400';
    return 'bg-green-500';
  }

  barTextColor(pct: number): string {
    if (pct > 100) return 'text-red-600';
    if (pct > 80)  return 'text-orange-500';
    return 'text-green-600';
  }

  alerteClass(a: Alerte): string {
    const base = 'border ';
    if (a.niveau === 'DANGER')  return base + 'bg-red-50 border-red-200 text-red-700';
    if (a.niveau === 'WARNING') return base + 'bg-orange-50 border-orange-200 text-orange-700';
    return base + 'bg-blue-50 border-blue-200 text-blue-700';
  }

  alerteIcon(a: Alerte): string {
    if (a.niveau === 'DANGER')  return '⛔';
    if (a.niveau === 'WARNING') return '⚠';
    return 'ℹ';
  }

  typeAxeColor(type: string): string {
    switch (type) {
      case 'PROJET':      return 'bg-blue-100 text-blue-700';
      case 'BAILLEUR':    return 'bg-green-100 text-green-700';
      case 'ACTIVITE':    return 'bg-purple-100 text-purple-700';
      case 'CENTRE_COUT': return 'bg-orange-100 text-orange-700';
      default:            return 'bg-gray-100 text-gray-600';
    }
  }

  typeAxeLabel(type: string): string {
    switch (type) {
      case 'PROJET':      return 'Proj';
      case 'BAILLEUR':    return 'Bail';
      case 'ACTIVITE':    return 'Act';
      case 'CENTRE_COUT': return 'CC';
      default:            return 'Axe';
    }
  }

  typeAxeBar(type: string): string {
    switch (type) {
      case 'PROJET':      return 'bg-blue-500';
      case 'BAILLEUR':    return 'bg-green-500';
      case 'ACTIVITE':    return 'bg-purple-500';
      case 'CENTRE_COUT': return 'bg-orange-500';
      default:            return 'bg-gray-400';
    }
  }
}
