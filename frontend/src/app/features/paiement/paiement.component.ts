import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaiementService } from '../../core/services/paiement.service';
import {
  InitPaiementResponse, ModePaiement, Periodicite, VirementDetails
} from '../../core/models/paiement.model';

type Step = 'form' | 'redirect' | 'virement' | 'succes' | 'erreur';

@Component({
  selector: 'app-paiement',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
<div class="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center py-12 px-4">
  <div class="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">

    <!-- ── Étape : formulaire ──────────────────────────────── -->
    @if (step() === 'form') {
      <div class="mb-6">
        <button (click)="retour()" class="text-sm text-gray-400 hover:text-gray-600 flex items-center gap-1 mb-4">
          ← Retour aux tarifs
        </button>
        <h1 class="text-2xl font-bold text-gray-900">Finaliser votre abonnement</h1>
        <p class="text-gray-500 text-sm mt-1">Plan <strong>{{ planCode() }}</strong> · {{ periodicite() }}</p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
          <input [(ngModel)]="form.customerName" type="text" placeholder="Jean Dupont"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Email *</label>
          <input [(ngModel)]="form.customerEmail" type="email" placeholder="jean@entreprise.com"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
        </div>

        <!-- Choix gateway -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-2">Mode de paiement *</label>
          <div class="grid grid-cols-3 gap-2">
            @for (g of gateways; track g.mode) {
              <button (click)="form.modePaiement = g.mode"
                      class="border-2 rounded-xl p-3 text-center transition"
                      [class]="form.modePaiement === g.mode
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-gray-300'">
                <p class="text-lg">{{ g.icon }}</p>
                <p class="text-xs font-semibold mt-0.5" [class]="form.modePaiement === g.mode ? 'text-emerald-700' : 'text-gray-600'">
                  {{ g.label }}
                </p>
                <p class="text-xs text-gray-400">{{ g.desc }}</p>
              </button>
            }
          </div>
        </div>

        @if (erreur()) {
          <p class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ erreur() }}</p>
        }

        <button (click)="payer()" [disabled]="loading()"
                class="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition disabled:opacity-50">
          {{ loading() ? 'Traitement…' : 'Confirmer le paiement' }}
        </button>
      </div>
    }

    <!-- ── Redirection CinetPay/Stripe ─────────────────────── -->
    @if (step() === 'redirect') {
      <div class="text-center py-6">
        <div class="text-5xl mb-4">🔗</div>
        <h2 class="text-xl font-bold text-gray-900 mb-2">Redirection vers la page de paiement</h2>
        <p class="text-gray-500 text-sm mb-6">
          Vous allez être redirigé vers <strong>{{ modePaiementLabel() }}</strong> pour finaliser le paiement.
        </p>
        <a [href]="paymentUrl()" target="_blank"
           class="inline-block bg-emerald-500 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-600 transition">
          Payer maintenant →
        </a>
        <p class="text-xs text-gray-400 mt-4">
          Une fois le paiement effectué, revenez ici — votre compte sera activé automatiquement.
        </p>
      </div>
    }

    <!-- ── Virement bancaire ────────────────────────────────── -->
    @if (step() === 'virement' && virementDetails()) {
      <div>
        <div class="flex items-center gap-3 mb-6">
          <span class="text-4xl">🏦</span>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Virement bancaire</h2>
            <p class="text-gray-500 text-sm">Activé sous 24–48h après réception</p>
          </div>
        </div>

        <div class="bg-gray-50 rounded-xl p-4 space-y-3 text-sm mb-6">
          <div class="flex justify-between">
            <span class="text-gray-500">Banque</span>
            <span class="font-medium">{{ virementDetails()!.banque }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Titulaire</span>
            <span class="font-medium">{{ virementDetails()!.titulaire }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">IBAN</span>
            <span class="font-mono font-medium text-xs">{{ virementDetails()!.iban }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Code SWIFT</span>
            <span class="font-mono font-medium">{{ virementDetails()!.swift }}</span>
          </div>
          <div class="border-t border-gray-200 pt-3 flex justify-between">
            <span class="text-gray-500">Montant</span>
            <span class="font-bold text-gray-900">{{ virementDetails()!.montant | number:'1.0-0' }} FCFA</span>
          </div>
          <div class="flex justify-between items-start">
            <span class="text-gray-500">Référence obligatoire</span>
            <span class="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{{ virementDetails()!.reference }}</span>
          </div>
        </div>

        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          ⚠️ Indiquez impérativement la référence <strong>{{ virementDetails()!.reference }}</strong> en objet du virement.
        </div>

        <button (click)="router.navigate(['/dashboard'])"
                class="w-full mt-6 bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-sm hover:bg-gray-200 transition">
          Retour au tableau de bord
        </button>
      </div>
    }

    <!-- ── Succès ───────────────────────────────────────────── -->
    @if (step() === 'succes') {
      <div class="text-center py-6">
        <div class="text-6xl mb-4">🎉</div>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé !</h2>
        <p class="text-gray-500 mb-6">Votre abonnement <strong>{{ planCode() }}</strong> est actif.</p>
        <button (click)="router.navigate(['/dashboard'])"
                class="bg-emerald-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-600 transition">
          Accéder au tableau de bord
        </button>
      </div>
    }

  </div>
</div>
`
})
export class PaiementComponent implements OnInit {
  private svc   = inject(PaiementService);
  private route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private cdr   = inject(ChangeDetectorRef);

  step         = signal<Step>('form');
  planCode     = signal('');
  periodicite  = signal<Periodicite>('MENSUEL');
  loading      = signal(false);
  erreur       = signal('');
  paymentUrl   = signal('');
  virementDetails = signal<VirementDetails | null>(null);

  form = {
    customerName: '',
    customerEmail: '',
    modePaiement: 'CINETPAY' as ModePaiement
  };

  readonly gateways = [
    { mode: 'CINETPAY' as ModePaiement, icon: '📱', label: 'CinetPay', desc: 'Mobile Money' },
    { mode: 'STRIPE'   as ModePaiement, icon: '💳', label: 'Stripe',   desc: 'Carte bancaire' },
    { mode: 'VIREMENT' as ModePaiement, icon: '🏦', label: 'Virement', desc: 'Banque' },
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(p => {
      if (p['plan'])       this.planCode.set(p['plan']);
      if (p['periodicite']) this.periodicite.set(p['periodicite'] as Periodicite);
      if (p['succes'])     this.step.set('succes');
    });
  }

  payer() {
    if (!this.form.customerName || !this.form.customerEmail) {
      this.erreur.set('Veuillez remplir tous les champs.');
      return;
    }
    this.loading.set(true);
    this.erreur.set('');

    this.svc.initier({
      planCode:      this.planCode(),
      periodicite:   this.periodicite(),
      modePaiement:  this.form.modePaiement,
      customerName:  this.form.customerName,
      customerEmail: this.form.customerEmail
    }).subscribe({
      next: (res: InitPaiementResponse) => {
        this.loading.set(false);
        if (res.modePaiement === 'VIREMENT') {
          this.virementDetails.set(res.virementDetails);
          this.step.set('virement');
        } else {
          this.paymentUrl.set(res.paymentUrl ?? '');
          this.step.set('redirect');
        }
        this.cdr.markForCheck();
      },
      error: (e: any) => {
        this.loading.set(false);
        this.erreur.set(e?.error?.message ?? 'Une erreur est survenue. Réessayez.');
        this.cdr.markForCheck();
      }
    });
  }

  modePaiementLabel(): string {
    return { CINETPAY: 'CinetPay (Mobile Money)', STRIPE: 'Stripe (Carte)', VIREMENT: 'Virement' }[this.form.modePaiement] ?? '';
  }

  retour() { this.router.navigate(['/tarifs']); }
}
