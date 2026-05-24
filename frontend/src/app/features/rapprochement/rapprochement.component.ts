import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RapprochementService } from '../../core/services/rapprochement.service';
import { EtatRapprochement, LigneEcritureRapp, LigneReleve } from '../../core/models/rapprochement.model';

@Component({
  selector: 'app-rapprochement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-7xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-3">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Rapprochement bancaire</h1>
      <p class="text-sm text-gray-500 mt-0.5">Comparez le relevé bancaire avec les écritures comptables</p>
    </div>
    <div class="flex items-center gap-3 flex-wrap">
      <div class="flex items-center gap-2">
        <label class="text-sm text-gray-600">Compte</label>
        <select [(ngModel)]="selectedCompte" (ngModelChange)="onCompteChange()"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">— Sélectionner —</option>
          @for (c of comptes(); track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
        <input [(ngModel)]="newCompte" placeholder="Saisir un compte…" maxlength="20"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button (click)="loadEtat()" [disabled]="!activeCompte()"
                class="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm rounded-lg">
          Charger
        </button>
      </div>

      <!-- Import CSV button -->
      @if (activeCompte()) {
      <label class="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm rounded-lg cursor-pointer">
        Importer relevé CSV
        <input type="file" accept=".csv" class="hidden" (change)="onCsvSelected($event)" />
      </label>
      }
    </div>
  </div>

  <!-- Import result -->
  @if (importResult()) {
  <div class="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 flex items-center justify-between">
    <span>{{ importResult()!.imported }} ligne(s) importée(s) · {{ importResult()!.skipped }} ignorée(s)</span>
    <button (click)="importResult.set(null)" class="text-green-500 hover:text-green-700">&times;</button>
  </div>
  }
  @if (importError()) {
  <div class="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">{{ importError() }}</div>
  }

  <!-- Format guide -->
  @if (!etat() && !loading()) {
  <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-2">
    <p class="font-semibold">Format du fichier CSV de relevé bancaire :</p>
    <code class="block bg-white border border-blue-100 rounded p-2 text-xs font-mono text-gray-700">
      date;libelle;debit;credit;reference<br>
      2024-01-05;Virement client DUPONT;;1500.00;REF001<br>
      2024-01-10;Loyer janvier;800.00;;REF002
    </code>
    <p class="text-xs text-blue-600">Séparateur <strong>;</strong> · date au format <strong>YYYY-MM-DD</strong> · debit/credit en format numérique (vide = 0)</p>
  </div>
  }

  @if (loading()) {
    <div class="flex items-center justify-center h-40 text-gray-400 text-sm">Chargement…</div>
  } @else if (etat()) {

  <!-- Stats bar -->
  <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Solde relevé</p>
      <p class="text-xl font-bold mt-1" [ngClass]="etat()!.soldeReleve >= 0 ? 'text-gray-900' : 'text-red-600'">
        {{ etat()!.soldeReleve | number:'1.2-2' }}
      </p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Solde comptable</p>
      <p class="text-xl font-bold mt-1 text-gray-900">{{ etat()!.soldeComptable | number:'1.2-2' }}</p>
    </div>
    <div class="bg-white rounded-xl border p-4"
         [ngClass]="etat()!.ecart === 0 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'">
      <p class="text-xs uppercase tracking-wide" [ngClass]="etat()!.ecart === 0 ? 'text-green-600' : 'text-orange-600'">Écart</p>
      <p class="text-xl font-bold mt-1" [ngClass]="etat()!.ecart === 0 ? 'text-green-700' : 'text-orange-700'">
        {{ etat()!.ecart | number:'1.2-2' }}
      </p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-orange-600 uppercase tracking-wide">Non rapprochés relevé</p>
      <p class="text-xl font-bold text-gray-900 mt-1">{{ etat()!.nonRapprochesReleve }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-blue-600 uppercase tracking-wide">Non rapprochés écritures</p>
      <p class="text-xl font-bold text-gray-900 mt-1">{{ etat()!.nonRapprochesEcriture }}</p>
    </div>
  </div>

  <!-- Matching hint -->
  @if (selectedReleve()) {
  <div class="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800 flex items-center justify-between">
    <span>
      Ligne relevé sélectionnée : <strong>{{ selectedReleve()!.libelle }}</strong>
      ({{ selectedReleve()!.montant | number:'1.2-2' }} {{ selectedReleve()!.sens }})
      — Cliquez une écriture non rapprochée pour les associer.
    </span>
    <button (click)="selectedReleve.set(null)" class="text-yellow-600 hover:text-yellow-800 text-xs underline">Annuler</button>
  </div>
  }

  <!-- Two-column layout -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

    <!-- Relevé bancaire -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 class="text-sm font-semibold text-gray-700">Relevé bancaire — {{ activeCompte() }}</h2>
        <p class="text-xs text-gray-400 mt-0.5">Cliquez une ligne non rapprochée pour la sélectionner</p>
      </div>
      @if (etat()!.lignesReleve.length === 0) {
        <div class="flex items-center justify-center h-24 text-gray-400 text-sm">Aucune ligne importée.</div>
      } @else {
        <div class="overflow-y-auto max-h-[500px]">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Libellé</th>
                <th class="px-3 py-2 text-right font-medium text-gray-500">Montant</th>
                <th class="px-3 py-2 text-center font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (r of etat()!.lignesReleve; track r.id) {
              <tr class="transition-colors"
                  [ngClass]="releveRowClass(r)"
                  (click)="onReleveClick(r)">
                <td class="px-3 py-2 font-mono text-gray-600">{{ r.dateReleve }}</td>
                <td class="px-3 py-2 text-gray-700 max-w-[160px] truncate" [title]="r.libelle">{{ r.libelle }}</td>
                <td class="px-3 py-2 text-right font-mono font-medium"
                    [ngClass]="r.sens === 'CREDIT' ? 'text-green-600' : 'text-red-600'">
                  {{ r.sens === 'CREDIT' ? '+' : '-' }}{{ r.montant | number:'1.2-2' }}
                </td>
                <td class="px-3 py-2 text-center">
                  @if (r.statut === 'RAPPROCHE') {
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">✓</span>
                    <button (click)="derapprocher(r, $event)"
                            class="ml-1 text-gray-300 hover:text-orange-500 text-xs">↩</button>
                  } @else {
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">—</span>
                    <button (click)="supprimerReleve(r, $event)"
                            class="ml-1 text-gray-300 hover:text-red-500 text-xs">✕</button>
                  }
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>

    <!-- Écritures comptables -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h2 class="text-sm font-semibold text-gray-700">Écritures comptables validées</h2>
        <p class="text-xs text-gray-400 mt-0.5">Cliquez une ligne (après avoir sélectionné un relevé) pour rapprocher</p>
      </div>
      @if (etat()!.lignesEcriture.length === 0) {
        <div class="flex items-center justify-center h-24 text-gray-400 text-sm">Aucune écriture validée pour ce compte.</div>
      } @else {
        <div class="overflow-y-auto max-h-[500px]">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 sticky top-0">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Date</th>
                <th class="px-3 py-2 text-left font-medium text-gray-500">Pièce / Libellé</th>
                <th class="px-3 py-2 text-right font-medium text-gray-500">Débit</th>
                <th class="px-3 py-2 text-right font-medium text-gray-500">Crédit</th>
                <th class="px-3 py-2 text-center font-medium text-gray-500">Statut</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (l of etat()!.lignesEcriture; track l.id) {
              <tr class="transition-colors"
                  [ngClass]="ecritureRowClass(l)"
                  (click)="onEcritureClick(l)">
                <td class="px-3 py-2 font-mono text-gray-600">{{ l.dateEcriture }}</td>
                <td class="px-3 py-2 max-w-[170px]">
                  <div class="font-medium text-gray-700 truncate" [title]="l.numeroPiece">{{ l.numeroPiece }}</div>
                  <div class="text-gray-400 truncate" [title]="l.libelle">{{ l.libelle }}</div>
                </td>
                <td class="px-3 py-2 text-right font-mono text-red-600">
                  {{ l.debit > 0 ? (l.debit | number:'1.2-2') : '' }}
                </td>
                <td class="px-3 py-2 text-right font-mono text-green-600">
                  {{ l.credit > 0 ? (l.credit | number:'1.2-2') : '' }}
                </td>
                <td class="px-3 py-2 text-center">
                  @if (l.rapprochee) {
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">✓</span>
                  } @else {
                    <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">—</span>
                  }
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  </div>

  } <!-- end @if etat() -->

</div>
  `,
})
export class RapprochementComponent implements OnInit {

  private svc = inject(RapprochementService);

  comptes      = signal<string[]>([]);
  selectedCompte = '';
  newCompte      = '';

  etat    = signal<EtatRapprochement | null>(null);
  loading = signal(false);

  importResult = signal<{ imported: number; skipped: number } | null>(null);
  importError  = signal<string | null>(null);

  selectedReleve = signal<LigneReleve | null>(null);

  ngOnInit() {
    this.svc.getComptes().subscribe({ next: c => this.comptes.set(c) });
  }

  activeCompte(): string {
    return this.newCompte.trim() || this.selectedCompte;
  }

  onCompteChange() { this.newCompte = ''; }

  loadEtat() {
    const c = this.activeCompte();
    if (!c) return;
    this.loading.set(true);
    this.etat.set(null);
    this.selectedReleve.set(null);
    this.svc.getEtat(c).subscribe({
      next: e => { this.etat.set(e); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ─── Import ───────────────────────────────────────────────────────────────

  onCsvSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.importResult.set(null); this.importError.set(null);
    this.svc.importerReleve(this.activeCompte(), file).subscribe({
      next: r => { this.importResult.set(r); this.loadEtat(); },
      error: e => this.importError.set(e?.error?.message ?? 'Erreur import.'),
    });
    (event.target as HTMLInputElement).value = '';
  }

  // ─── Matching ─────────────────────────────────────────────────────────────

  onReleveClick(r: LigneReleve) {
    if (r.statut === 'RAPPROCHE') return;
    this.selectedReleve.set(this.selectedReleve()?.id === r.id ? null : r);
  }

  onEcritureClick(l: LigneEcritureRapp) {
    const releve = this.selectedReleve();
    if (!releve || l.rapprochee) return;
    this.svc.rapprocher(releve.id, l.id).subscribe({
      next: () => { this.selectedReleve.set(null); this.loadEtat(); },
    });
  }

  derapprocher(r: LigneReleve, event: Event) {
    event.stopPropagation();
    this.svc.derapprocher(r.id).subscribe({ next: () => this.loadEtat() });
  }

  supprimerReleve(r: LigneReleve, event: Event) {
    event.stopPropagation();
    if (!confirm('Supprimer cette ligne du relevé ?')) return;
    this.svc.supprimerReleve(r.id).subscribe({ next: () => this.loadEtat() });
  }

  // ─── Row styles ───────────────────────────────────────────────────────────

  releveRowClass(r: LigneReleve): string {
    if (r.statut === 'RAPPROCHE') return 'bg-green-50 opacity-60';
    if (this.selectedReleve()?.id === r.id) return 'bg-yellow-50 ring-1 ring-yellow-300 cursor-pointer';
    return 'hover:bg-blue-50 cursor-pointer';
  }

  ecritureRowClass(l: LigneEcritureRapp): string {
    if (l.rapprochee) return 'bg-green-50 opacity-60';
    if (this.selectedReleve()) return 'hover:bg-yellow-50 cursor-pointer';
    return 'hover:bg-gray-50';
  }
}
