import {
  ChangeDetectionStrategy, Component, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlerteService } from '../../core/services/alerte.service';
import { Alerte } from '../../core/models/alerte.model';

@Component({
  selector: 'app-alertes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  template: `
<div class="p-6 max-w-3xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Alertes & Notifications</h1>
      <p class="text-sm text-gray-500 mt-0.5">Contrôles automatiques sur tous les modules</p>
    </div>
    <button (click)="refresh()"
            class="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
      Actualiser
    </button>
  </div>

  @if (svc.alertes()) {
  <!-- KPIs -->
  <div class="grid grid-cols-3 gap-4">
    <div class="rounded-xl border p-4 text-center"
         [ngClass]="svc.alertes()!.countDanger > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'">
      <p class="text-2xl font-bold"
         [ngClass]="svc.alertes()!.countDanger > 0 ? 'text-red-700' : 'text-gray-400'">
        {{ svc.alertes()!.countDanger }}
      </p>
      <p class="text-xs uppercase tracking-wide mt-1"
         [ngClass]="svc.alertes()!.countDanger > 0 ? 'text-red-500' : 'text-gray-400'">
        Critiques
      </p>
    </div>
    <div class="rounded-xl border p-4 text-center"
         [ngClass]="svc.alertes()!.countWarning > 0 ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'">
      <p class="text-2xl font-bold"
         [ngClass]="svc.alertes()!.countWarning > 0 ? 'text-orange-700' : 'text-gray-400'">
        {{ svc.alertes()!.countWarning }}
      </p>
      <p class="text-xs uppercase tracking-wide mt-1"
         [ngClass]="svc.alertes()!.countWarning > 0 ? 'text-orange-500' : 'text-gray-400'">
        Avertissements
      </p>
    </div>
    <div class="rounded-xl border border-gray-200 bg-gray-50 p-4 text-center">
      <p class="text-2xl font-bold text-gray-500">{{ svc.alertes()!.countInfo }}</p>
      <p class="text-xs text-gray-400 uppercase tracking-wide mt-1">Informations</p>
    </div>
  </div>

  <!-- Liste alertes -->
  @if (svc.alertes()!.alertes.length === 0) {
    <div class="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
      <p class="text-2xl mb-2">✓</p>
      <p class="text-sm font-medium text-green-700">Tout est en ordre</p>
      <p class="text-xs text-green-500 mt-1">Aucune alerte détectée sur vos données comptables.</p>
    </div>
  } @else {
    <div class="space-y-3">
      @for (a of svc.alertes()!.alertes; track a.id) {
      <div class="bg-white rounded-xl border p-4 flex items-start gap-4"
           [ngClass]="borderClass(a)">
        <div class="mt-0.5 flex-shrink-0">
          <span class="text-lg">{{ icone(a) }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <p class="font-medium text-sm text-gray-800">{{ a.titre }}</p>
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium flex-shrink-0"
                  [ngClass]="badgeClass(a)">
              {{ a.module }}
            </span>
          </div>
          <p class="text-xs text-gray-500 mt-0.5">{{ a.message }}</p>
        </div>
        <a [routerLink]="a.lien"
           class="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 whitespace-nowrap">
          Voir →
        </a>
      </div>
      }
    </div>
  }
  } @else {
    <div class="flex items-center justify-center h-32 text-gray-400 text-sm">
      Chargement des alertes…
    </div>
  }

</div>
  `,
})
export class AlertesComponent implements OnInit {
  svc = inject(AlerteService);

  ngOnInit() { this.svc.charger(); }

  refresh() { this.svc.charger(); }

  icone(a: Alerte): string {
    if (a.niveau === 'DANGER')  return '🔴';
    if (a.niveau === 'WARNING') return '🟠';
    return '🔵';
  }

  borderClass(a: Alerte): string {
    if (a.niveau === 'DANGER')  return 'border-red-200';
    if (a.niveau === 'WARNING') return 'border-orange-200';
    return 'border-blue-200';
  }

  badgeClass(a: Alerte): string {
    if (a.niveau === 'DANGER')  return 'bg-red-100 text-red-700';
    if (a.niveau === 'WARNING') return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  }
}
