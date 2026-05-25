import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../core/services/audit.service';
import {
  AuditEvent, PageResponse, ACTION_LABELS, ACTION_COLORS
} from '../../core/models/audit.model';

const ACTIONS = [
  'ECRITURE_CREEE', 'ECRITURE_VALIDEE', 'ECRITURE_SUPPRIMEE',
  'EXERCICE_CLOTURE', 'LETTRAGE_APPLIQUE', 'LETTRAGE_ANNULE',
];

@Component({
  selector: 'app-audit',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-6xl mx-auto space-y-5">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Journal des événements</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Traçabilité SYSCOHADA — historique de toutes les actions utilisateurs
    </p>
  </div>

  <!-- Filtres -->
  <div class="bg-white rounded-xl border border-gray-200 p-4">
    <div class="flex flex-wrap gap-3 items-end">
      <div>
        <label class="block text-xs text-gray-500 mb-1">Action</label>
        <select [(ngModel)]="filtres.action" name="action"
                class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
          <option value="">Toutes les actions</option>
          @for (a of actions; track a) {
            <option [value]="a">{{ actionLabel(a) }}</option>
          }
        </select>
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Utilisateur</label>
        <input [(ngModel)]="filtres.userEmail" name="user" type="email"
               placeholder="email@..."
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Du</label>
        <input [(ngModel)]="filtres.from" name="from" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">Au</label>
        <input [(ngModel)]="filtres.to" name="to" type="date"
               class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button (click)="charger(0)"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
        Filtrer
      </button>
      <button (click)="resetFiltres()"
              class="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm rounded-lg">
        Réinitialiser
      </button>
    </div>
  </div>

  <!-- Tableau -->
  @if (page()) {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <span class="text-sm text-gray-500">
          {{ page()!.totalElements }} événement(s)
        </span>
        <span class="text-xs text-gray-400">
          Page {{ page()!.number + 1 }} / {{ page()!.totalPages }}
        </span>
      </div>

      <table class="w-full text-sm">
        <thead class="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
          <tr>
            <th class="px-4 py-3 text-left w-36">Date / Heure</th>
            <th class="px-4 py-3 text-left w-40">Utilisateur</th>
            <th class="px-4 py-3 text-left w-44">Action</th>
            <th class="px-4 py-3 text-left w-28">Type</th>
            <th class="px-4 py-3 text-left">Référence</th>
            <th class="px-4 py-3 text-left">Détails</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-50">
          @for (ev of page()!.content; track ev.id) {
            <tr class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                {{ ev.createdAt | date:'dd/MM/yyyy HH:mm' }}
              </td>
              <td class="px-4 py-3 text-gray-700 text-xs truncate max-w-[160px]" [title]="ev.userEmail">
                {{ ev.userEmail }}
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                      [ngClass]="actionColor(ev.action)">
                  {{ actionLabel(ev.action) }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500 text-xs">{{ ev.entityType }}</td>
              <td class="px-4 py-3 font-mono text-xs text-gray-700">{{ ev.entityRef }}</td>
              <td class="px-4 py-3 text-gray-500 text-xs truncate max-w-[200px]" [title]="ev.details ?? ''">
                {{ ev.details }}
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="6" class="px-4 py-8 text-center text-gray-400 text-sm">
                Aucun événement trouvé
              </td>
            </tr>
          }
        </tbody>
      </table>

      <!-- Pagination -->
      @if (page()!.totalPages > 1) {
        <div class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <button (click)="charger(page()!.number - 1)"
                  [disabled]="page()!.number === 0"
                  class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            ← Précédent
          </button>
          <span class="text-xs text-gray-500">
            {{ page()!.number + 1 }} / {{ page()!.totalPages }}
          </span>
          <button (click)="charger(page()!.number + 1)"
                  [disabled]="page()!.number >= page()!.totalPages - 1"
                  class="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            Suivant →
          </button>
        </div>
      }
    </div>
  } @else {
    <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
  }

</div>
  `
})
export class AuditComponent implements OnInit {

  private svc = inject(AuditService);

  page    = signal<PageResponse<AuditEvent> | null>(null);
  actions = ACTIONS;

  filtres = { action: '', userEmail: '', from: '', to: '' };

  ngOnInit() { this.charger(0); }

  charger(pageNum: number) {
    this.page.set(null);
    this.svc.lister({
      action:    this.filtres.action    || undefined,
      userEmail: this.filtres.userEmail || undefined,
      from:      this.filtres.from      || undefined,
      to:        this.filtres.to        || undefined,
      page: pageNum,
    }).subscribe({ next: p => this.page.set(p) });
  }

  resetFiltres() {
    this.filtres = { action: '', userEmail: '', from: '', to: '' };
    this.charger(0);
  }

  actionLabel(action: string) { return ACTION_LABELS[action] ?? action; }
  actionColor(action: string) { return ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-600'; }
}
