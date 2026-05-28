import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RelanceService } from '../../core/services/relance.service';
import { TiersImpaye, ListeImpayes, RelanceRecord } from '../../core/models/relance.model';

type Onglet = 'impayes' | 'historique';
const NIVEAUX = ['1 — Amiable', '2 — Rappel', '3 — Mise en demeure'];

@Component({
  selector: 'app-relances',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Relances clients</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Créances impayées (comptes 411x non lettrés) et historique des relances
    </p>
  </div>

  <!-- Onglets -->
  <div class="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
    <button (click)="onglet.set('impayes')"
            [class]="onglet() === 'impayes'
              ? 'px-4 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm'
              : 'px-4 py-1.5 rounded-lg text-gray-500 text-sm hover:text-gray-700'">
      Impayés
    </button>
    <button (click)="onglet.set('historique'); chargerHistorique()"
            [class]="onglet() === 'historique'
              ? 'px-4 py-1.5 rounded-lg bg-white text-gray-800 text-sm font-medium shadow-sm'
              : 'px-4 py-1.5 rounded-lg text-gray-500 text-sm hover:text-gray-700'">
      Historique
    </button>
  </div>

  <!-- ═══ ONGLET IMPAYÉS ═══ -->
  @if (onglet() === 'impayes') {

  <!-- KPI -->
  @if (impayes()) {
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white rounded-xl border border-red-200 bg-red-50 p-4">
      <p class="text-xs text-red-600 uppercase tracking-wide">Total impayés</p>
      <p class="text-2xl font-bold text-red-800 mt-1">{{ impayes()!.totalImpaye | number:'1.2-2' }}</p>
    </div>
    <div class="bg-white rounded-xl border border-orange-200 bg-orange-50 p-4">
      <p class="text-xs text-orange-600 uppercase tracking-wide">Clients concernés</p>
      <p class="text-2xl font-bold text-orange-800 mt-1">{{ impayes()!.nbClientsImpaye }}</p>
    </div>
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <p class="text-xs text-gray-500 uppercase tracking-wide">Source</p>
      <p class="text-sm font-medium text-gray-700 mt-1">Comptes 411x — lignes non lettrées</p>
    </div>
  </div>
  }

  <!-- Table impayés -->
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (loadingImp()) {
      <div class="flex items-center justify-center h-24 text-gray-400 text-sm">Chargement…</div>
    } @else if (!impayes() || impayes()!.clients.length === 0) {
      <div class="flex items-center justify-center h-24 text-gray-400 text-sm">
        Aucun impayé détecté sur les comptes 411x.
      </div>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compte</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant impayé</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Relances</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dernière relance</th>
            <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (c of impayes()!.clients; track c.tiersId) {
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <p class="font-medium text-gray-800">{{ c.tiersNom }}</p>
              <p class="text-xs text-gray-400">{{ c.tiersCode }}
                @if (c.tiersEmail) { · {{ c.tiersEmail }} }
              </p>
            </td>
            <td class="px-4 py-3 font-mono text-gray-600 text-xs">{{ c.compteNumero }}</td>
            <td class="px-4 py-3 text-right font-mono font-bold text-red-700">
              {{ c.montantImpaye | number:'1.2-2' }}
            </td>
            <td class="px-4 py-3 text-center">
              @if (c.nbRelances > 0) {
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      [ngClass]="c.nbRelances >= 3 ? 'bg-red-100 text-red-700'
                                : c.nbRelances === 2 ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'">
                  {{ c.nbRelances }}× relancé
                </span>
              } @else {
                <span class="text-xs text-gray-300">—</span>
              }
            </td>
            <td class="px-4 py-3 text-xs text-gray-400 font-mono">
              {{ c.derniereRelance ?? '—' }}
            </td>
            <td class="px-4 py-3 text-center">
              <button (click)="ouvrirModal(c)"
                      class="text-xs px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                Relancer
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    }
  </div>

  }

  <!-- ═══ ONGLET HISTORIQUE ═══ -->
  @if (onglet() === 'historique') {
  <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
    @if (historique().length === 0) {
      <div class="flex items-center justify-center h-24 text-gray-400 text-sm">
        Aucune relance enregistrée.
      </div>
    } @else {
      <table class="w-full text-sm">
        <thead class="bg-gray-50 border-b border-gray-200">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
            <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau</th>
            <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          @for (r of historique(); track r.id) {
          <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 font-mono text-xs text-gray-500">{{ r.dateRelance }}</td>
            <td class="px-4 py-3 font-medium text-gray-700">{{ r.tiersNom }}</td>
            <td class="px-4 py-3 text-right font-mono text-orange-700 font-semibold">
              {{ r.montantRelance | number:'1.2-2' }}
            </td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    [ngClass]="r.niveau === 3 ? 'bg-red-100 text-red-700'
                              : r.niveau === 2 ? 'bg-orange-100 text-orange-700'
                              : 'bg-yellow-100 text-yellow-700'">
                N{{ r.niveau }}
              </span>
            </td>
            <td class="px-4 py-3 text-xs text-gray-400">{{ r.note ?? '—' }}</td>
            <td class="px-4 py-3 text-right">
              <button (click)="supprimer(r.id)"
                      class="text-xs text-red-400 hover:text-red-600 hover:underline">
                Supprimer
              </button>
            </td>
          </tr>
          }
        </tbody>
      </table>
    }
  </div>
  }

</div>

<!-- Modal relance -->
@if (modalClient()) {
<div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
     (click)="fermerModal()">
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4"
       (click)="$event.stopPropagation()">
    <h2 class="text-base font-semibold text-gray-800">
      Enregistrer une relance — {{ modalClient()!.tiersNom }}
    </h2>

    <div class="space-y-3">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Montant relancé</label>
        <input [(ngModel)]="modalMontant" type="number" step="0.01" min="0"
               class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        <p class="text-xs text-gray-400 mt-0.5">Impayé détecté : {{ modalClient()!.montantImpaye | number:'1.2-2' }}</p>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Niveau</label>
        <select [(ngModel)]="modalNiveau"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
          @for (n of niveaux; track n) {
            <option [value]="$index + 1">{{ n }}</option>
          }
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Note (optionnelle)</label>
        <textarea [(ngModel)]="modalNote" rows="2"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                  placeholder="Email envoyé, appel téléphonique…"></textarea>
      </div>
    </div>

    @if (modalError()) {
      <p class="text-sm text-red-600">{{ modalError() }}</p>
    }

    <div class="flex justify-end gap-3 pt-2">
      <button (click)="fermerModal()"
              class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
        Annuler
      </button>
      <button (click)="enregistrerRelance()" [disabled]="saving()"
              class="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </div>
  </div>
</div>
}
  `,
})
export class RelancesComponent implements OnInit {

  private svc = inject(RelanceService);

  onglet    = signal<Onglet>('impayes');
  impayes   = signal<ListeImpayes | null>(null);
  historique = signal<RelanceRecord[]>([]);
  loadingImp = signal(false);

  modalClient  = signal<TiersImpaye | null>(null);
  modalMontant = 0;
  modalNiveau  = 1;
  modalNote    = '';
  modalError   = signal<string | null>(null);
  saving       = signal(false);

  niveaux = NIVEAUX;

  ngOnInit() { this.chargerImpayes(); }

  chargerImpayes() {
    this.loadingImp.set(true);
    this.svc.getImpayes().subscribe({
      next: d => { this.impayes.set(d); this.loadingImp.set(false); },
      error: () => this.loadingImp.set(false),
    });
  }

  chargerHistorique() {
    this.svc.lister().subscribe({ next: list => this.historique.set(list) });
  }

  ouvrirModal(c: TiersImpaye) {
    this.modalClient.set(c);
    this.modalMontant = c.montantImpaye;
    this.modalNiveau  = Math.min(c.nbRelances + 1, 3);
    this.modalNote    = '';
    this.modalError.set(null);
  }

  fermerModal() { this.modalClient.set(null); }

  enregistrerRelance() {
    const c = this.modalClient();
    if (!c) return;
    this.saving.set(true); this.modalError.set(null);
    this.svc.creer(c.tiersId, this.modalMontant, this.modalNiveau, this.modalNote).subscribe({
      next: () => {
        this.saving.set(false);
        this.fermerModal();
        this.chargerImpayes();
      },
      error: e => { this.modalError.set(e?.error?.message ?? 'Erreur.'); this.saving.set(false); },
    });
  }

  supprimer(id: string) {
    this.svc.supprimer(id).subscribe({
      next: () => this.historique.update(list => list.filter(r => r.id !== id)),
    });
  }
}
