import {
  ChangeDetectionStrategy, Component, inject, signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LettrageService } from '../../core/services/lettrage.service';
import { LigneLettrage, CompteLettrageView } from '../../core/models/lettrage.model';

@Component({
  selector: 'app-lettrage',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Lettrage des comptes</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Rapprochez les débits et crédits par lettres (A, B, C…) sur les comptes tiers 401x / 411x
    </p>
  </div>

  <!-- Sélecteur de compte -->
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <div class="flex flex-wrap gap-4 items-end">
      <div class="flex-1 min-w-[200px]">
        <label class="block text-xs text-gray-500 mb-1">Numéro de compte</label>
        <input [(ngModel)]="compteInput" type="text" placeholder="ex: 411000"
               (keyup.enter)="charger()"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="charger()" [disabled]="loading() || !compteInput.trim()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ loading() ? 'Chargement…' : 'Charger' }}
      </button>
      @for (c of comptesRapides; track c) {
        <button (click)="compteInput = c; charger()"
                class="text-xs px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600">
          {{ c }}
        </button>
      }
    </div>
    @if (loadError()) {
      <p class="text-sm text-red-600 mt-2">{{ loadError() }}</p>
    }
  </div>

  @if (vue()) {
  <!-- Résumé solde -->
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Compte</p>
      <p class="text-lg font-bold text-gray-800 mt-1">{{ vue()!.compteNumero }}</p>
      <p class="text-xs text-gray-400">{{ vue()!.compteIntitule }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Lignes non lettrées</p>
      <p class="text-2xl font-bold text-orange-700 mt-1">{{ nonLettrees().length }}</p>
    </div>
    <div class="bg-white rounded-xl border border-blue-200 bg-blue-50 p-4">
      <p class="text-xs text-blue-600 uppercase tracking-wide">Solde sélection</p>
      <p class="text-2xl font-bold mt-1"
         [ngClass]="soldeSel() === 0 ? 'text-green-700' : 'text-red-700'">
        {{ soldeSel() | number:'1.2-2' }}
      </p>
    </div>
  </div>

  <!-- Actions barre -->
  <div class="flex items-center gap-3">
    <button (click)="lettrerSel()"
            [disabled]="lettrering() || selected().size < 2 || soldeSel() !== 0"
            class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
      {{ lettrering() ? 'Lettrage…' : 'Lettrer la sélection' }}
    </button>
    <p class="text-xs text-gray-400">{{ selected().size }} ligne(s) sélectionnée(s) — solde doit être nul</p>
    @if (lettreSuccess()) {
      <span class="text-sm text-green-700 font-medium">Lettre {{ lettreSuccess() }} attribuée</span>
    }
    @if (lettreError()) {
      <span class="text-sm text-red-600">{{ lettreError() }}</span>
    }
  </div>

  <!-- Table des lignes -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    <!-- Non lettrées -->
    @if (nonLettrees().length > 0) {
    <div class="px-4 py-2 bg-orange-50 border-b border-orange-100">
      <span class="text-xs font-semibold text-orange-700 uppercase">Lignes non lettrées</span>
    </div>
    <table class="w-full text-sm">
      <thead class="bg-gray-50 border-b border-gray-200">
        <tr>
          <th class="px-4 py-2 w-8"></th>
          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pièce</th>
          <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Libellé</th>
          <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Débit</th>
          <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Crédit</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-100">
        @for (l of nonLettrees(); track l.id) {
        <tr class="hover:bg-gray-50 cursor-pointer"
            [ngClass]="selected().has(l.id) ? 'bg-blue-50' : ''"
            (click)="toggleSel(l)">
          <td class="px-4 py-2 text-center">
            <input type="checkbox" [checked]="selected().has(l.id)"
                   (click)="$event.stopPropagation(); toggleSel(l)"
                   class="rounded border-gray-300 text-blue-600" />
          </td>
          <td class="px-4 py-2 font-mono text-gray-600 text-xs">{{ l.dateEcriture }}</td>
          <td class="px-4 py-2 font-mono text-gray-600 text-xs">{{ l.numeroPiece }}</td>
          <td class="px-4 py-2 text-gray-700">{{ l.libelle }}</td>
          <td class="px-4 py-2 text-right font-mono text-red-600">
            {{ l.debit > 0 ? (l.debit | number:'1.2-2') : '' }}
          </td>
          <td class="px-4 py-2 text-right font-mono text-green-600">
            {{ l.credit > 0 ? (l.credit | number:'1.2-2') : '' }}
          </td>
        </tr>
        }
      </tbody>
    </table>
    }

    <!-- Lettrées groupées par lettre -->
    @if (groupesLettres().length > 0) {
    <div class="px-4 py-2 bg-green-50 border-t border-b border-green-100">
      <span class="text-xs font-semibold text-green-700 uppercase">Lignes lettrées</span>
    </div>
    @for (g of groupesLettres(); track g.lettre) {
    <div class="border-b border-gray-100">
      <div class="flex items-center justify-between px-4 py-2 bg-gray-50">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
          {{ g.lettre }}
        </span>
        <span class="text-xs text-gray-400">{{ g.lignes.length }} ligne(s) — lettré le {{ g.lignes[0].lettreDate }}</span>
        <button (click)="delettrer(g.lettre)"
                class="text-xs text-red-500 hover:text-red-700 hover:underline">
          Délettrer
        </button>
      </div>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-gray-50">
          @for (l of g.lignes; track l.id) {
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-1.5 font-mono text-gray-400 text-xs w-[110px]">{{ l.dateEcriture }}</td>
            <td class="px-4 py-1.5 font-mono text-gray-400 text-xs w-[100px]">{{ l.numeroPiece }}</td>
            <td class="px-4 py-1.5 text-gray-500 text-xs">{{ l.libelle }}</td>
            <td class="px-4 py-1.5 text-right font-mono text-red-400 text-xs w-[110px]">
              {{ l.debit > 0 ? (l.debit | number:'1.2-2') : '' }}
            </td>
            <td class="px-4 py-1.5 text-right font-mono text-green-500 text-xs w-[110px]">
              {{ l.credit > 0 ? (l.credit | number:'1.2-2') : '' }}
            </td>
          </tr>
          }
        </tbody>
      </table>
    </div>
    }
    }

    @if (nonLettrees().length === 0 && groupesLettres().length === 0) {
      <div class="flex items-center justify-center h-24 text-gray-400 text-sm">
        Aucun mouvement sur ce compte (écritures validées uniquement).
      </div>
    }
  </div>
  }

</div>
  `,
})
export class LettrageComponent {

  private svc = inject(LettrageService);

  compteInput = '';
  comptesRapides = ['401000', '411000', '401100', '411100'];

  vue        = signal<CompteLettrageView | null>(null);
  loading    = signal(false);
  loadError  = signal<string | null>(null);
  selected   = signal<Set<string>>(new Set());
  lettrering = signal(false);
  lettreSuccess = signal<string | null>(null);
  lettreError   = signal<string | null>(null);

  nonLettrees = computed(() =>
    (this.vue()?.lignes ?? []).filter(l => !l.lettre)
  );

  groupesLettres = computed(() => {
    const lignes = (this.vue()?.lignes ?? []).filter(l => l.lettre);
    const map = new Map<string, LigneLettrage[]>();
    for (const l of lignes) {
      const arr = map.get(l.lettre!) ?? [];
      arr.push(l);
      map.set(l.lettre!, arr);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([lettre, ls]) => ({ lettre, lignes: ls }));
  });

  soldeSel = computed(() => {
    const ids = this.selected();
    const lignes = this.nonLettrees().filter(l => ids.has(l.id));
    return lignes.reduce((s, l) => s + l.debit - l.credit, 0);
  });

  charger() {
    const compte = this.compteInput.trim();
    if (!compte) return;
    this.loading.set(true); this.loadError.set(null);
    this.selected.set(new Set()); this.lettreSuccess.set(null); this.lettreError.set(null);
    this.svc.getLignes(compte).subscribe({
      next: v  => { this.vue.set(v); this.loading.set(false); },
      error: e => { this.loadError.set(e?.error?.message ?? 'Erreur.'); this.loading.set(false); },
    });
  }

  toggleSel(l: LigneLettrage) {
    const s = new Set(this.selected());
    s.has(l.id) ? s.delete(l.id) : s.add(l.id);
    this.selected.set(s);
    this.lettreSuccess.set(null); this.lettreError.set(null);
  }

  lettrerSel() {
    const ids = Array.from(this.selected());
    if (ids.length < 2) return;
    this.lettrering.set(true); this.lettreError.set(null); this.lettreSuccess.set(null);
    this.svc.lettrer(this.compteInput.trim(), ids).subscribe({
      next: r => {
        this.lettrering.set(false);
        this.lettreSuccess.set(r.lettre);
        this.selected.set(new Set());
        this.charger();
      },
      error: e => {
        this.lettrering.set(false);
        this.lettreError.set(e?.error?.message ?? 'Erreur lors du lettrage.');
      },
    });
  }

  delettrer(lettre: string) {
    this.svc.delettrer(this.compteInput.trim(), lettre).subscribe({
      next: () => this.charger(),
      error: e => this.lettreError.set(e?.error?.message ?? 'Erreur.'),
    });
  }
}
