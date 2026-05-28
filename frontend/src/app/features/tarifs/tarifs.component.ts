import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { PaiementService } from '../../core/services/paiement.service';
import { PlanPublic, Periodicite } from '../../core/models/paiement.model';

@Component({
  selector: 'app-tarifs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, DecimalPipe],
  template: `
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 py-16 px-4">

  <!-- Header -->
  <div class="text-center mb-12">
    <h1 class="text-4xl font-bold text-gray-900 mb-3">Choisissez votre plan</h1>
    <p class="text-gray-500 text-lg">Gérez votre comptabilité avec e-Compta IA</p>

    <!-- Toggle mensuel/annuel -->
    <div class="flex items-center justify-center gap-4 mt-8">
      <span class="text-sm font-medium" [class]="periodicite() === 'MENSUEL' ? 'text-gray-900' : 'text-gray-400'">Mensuel</span>
      <button (click)="togglePeriodicite()"
              class="relative w-12 h-6 rounded-full transition-colors"
              [class]="periodicite() === 'ANNUEL' ? 'bg-emerald-500' : 'bg-gray-300'">
        <span class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
              [class]="periodicite() === 'ANNUEL' ? 'translate-x-6 left-0.5' : 'left-0.5'"></span>
      </button>
      <span class="text-sm font-medium" [class]="periodicite() === 'ANNUEL' ? 'text-gray-900' : 'text-gray-400'">
        Annuel <span class="ml-1 text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">-17%</span>
      </span>
    </div>
  </div>

  <!-- Grille plans -->
  @if (loading()) {
    <p class="text-center text-gray-400">Chargement des plans…</p>
  } @else {
    <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      @for (plan of plans(); track plan.code) {
        <div class="bg-white rounded-2xl shadow-sm border-2 flex flex-col transition hover:shadow-md"
             [class]="plan.populaire ? 'border-emerald-500 relative' : 'border-gray-200'">

          @if (plan.populaire) {
            <div class="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span class="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                Le plus populaire
              </span>
            </div>
          }

          <div class="p-6 flex-1">
            <h2 class="text-xl font-bold text-gray-900">{{ plan.nom }}</h2>
            <p class="text-sm text-gray-500 mt-1 mb-4">{{ plan.description }}</p>

            <div class="mb-6">
              <span class="text-4xl font-extrabold text-gray-900">
                {{ (periodicite() === 'ANNUEL' ? plan.prixAnnuel : plan.prixMensuel) | number:'1.0-0' }}
              </span>
              <span class="text-gray-400 text-sm ml-1">FCFA / {{ periodicite() === 'ANNUEL' ? 'an' : 'mois' }}</span>
              @if (periodicite() === 'ANNUEL') {
                <p class="text-xs text-emerald-600 mt-0.5">
                  soit {{ (plan.prixAnnuel / 12) | number:'1.0-0' }} FCFA/mois
                </p>
              }
            </div>

            <ul class="space-y-2 text-sm text-gray-600 mb-6">
              <li class="flex items-center gap-2">
                <span class="text-emerald-500 font-bold">✓</span>
                {{ plan.maxUtilisateurs >= 1000 ? 'Utilisateurs illimités' : 'Jusqu\'à ' + plan.maxUtilisateurs + ' utilisateurs' }}
              </li>
              @for (mod of plan.modules.slice(0, 5); track mod) {
                <li class="flex items-center gap-2">
                  <span class="text-emerald-500 font-bold">✓</span>
                  {{ moduleLabel(mod) }}
                </li>
              }
              @if (plan.modules.length > 5 || plan.modules.includes('all')) {
                <li class="flex items-center gap-2 text-gray-400">
                  <span class="font-bold">+</span>
                  {{ plan.modules.includes('all') ? 'Tous les modules' : (plan.modules.length - 5) + ' modules de plus' }}
                </li>
              }
            </ul>
          </div>

          <div class="p-6 pt-0">
            <button (click)="choisir(plan)"
                    class="w-full py-3 rounded-xl font-semibold text-sm transition"
                    [class]="plan.populaire
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'">
              Commencer avec {{ plan.nom }}
            </button>
          </div>
        </div>
      }
    </div>
  }

  <!-- Footer note -->
  <p class="text-center text-xs text-gray-400 mt-10">
    Paiement sécurisé · CinetPay · Stripe · Virement bancaire · Annulation à tout moment
  </p>
</div>
`
})
export class TarifsComponent implements OnInit {
  private svc   = inject(PaiementService);
  private router = inject(Router);
  private cdr   = inject(ChangeDetectorRef);

  plans    = signal<PlanPublic[]>([]);
  loading  = signal(true);
  periodicite = signal<Periodicite>('MENSUEL');

  ngOnInit() {
    this.svc.getPlans().subscribe({
      next: d => { this.plans.set(d); this.loading.set(false); this.cdr.markForCheck(); },
      error: () => this.loading.set(false)
    });
  }

  togglePeriodicite() {
    this.periodicite.set(this.periodicite() === 'MENSUEL' ? 'ANNUEL' : 'MENSUEL');
  }

  choisir(plan: PlanPublic) {
    this.router.navigate(['/paiement'], {
      queryParams: { plan: plan.code, periodicite: this.periodicite() }
    });
  }

  moduleLabel(mod: string): string {
    const m: Record<string, string> = {
      comptabilite: 'Comptabilité SYSCOHADA', tiers: 'Gestion des tiers',
      ecritures: 'Saisie écritures', etats: 'États financiers',
      tva: 'Déclaration TVA', paie: 'Gestion de la paie',
      rh: 'Ressources humaines', facturation: 'Facturation',
      immobilisations: 'Immobilisations', analytique: 'Comptabilité analytique',
      budget: 'Budget', stocks: 'Gestion des stocks', all: 'Tous les modules'
    };
    return m[mod] ?? mod;
  }
}
