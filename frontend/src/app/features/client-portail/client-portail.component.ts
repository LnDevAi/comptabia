import {
  ChangeDetectionStrategy, Component, OnInit, inject, signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ClientPortailService } from '../../core/services/client-portail.service';
import { FactureClientResponse } from '../../core/models/client-portail.model';

const STATUT_LABELS: Record<string, string> = {
  EMISE: 'À payer', PAYEE: 'Payée', ANNULEE: 'Annulée'
};
const STATUT_COLORS: Record<string, string> = {
  EMISE: 'bg-orange-100 text-orange-700',
  PAYEE: 'bg-green-100 text-green-700',
  ANNULEE: 'bg-gray-100 text-gray-500'
};

@Component({
  selector: 'app-client-portail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header portail -->
      <header class="bg-white border-b border-gray-200 px-6 py-4">
        <div class="max-w-4xl mx-auto flex items-center gap-3">
          <span class="font-bold text-blue-700 text-lg">e-Compta</span>
          <span class="text-gray-300">|</span>
          <span class="text-sm text-gray-500">Portail client</span>
          @if (session()) {
            <div class="ml-auto flex items-center gap-3">
              <span class="text-sm text-gray-700 font-medium">{{ session()!.nomTiers }}</span>
              <button (click)="logout()" class="text-xs text-gray-400 hover:text-red-500 transition">
                Déconnexion
              </button>
            </div>
          }
        </div>
      </header>

      <main class="max-w-4xl mx-auto p-6 space-y-6">

        @if (!entrepriseId()) {
          <!-- Pas d'entreprise ID dans l'URL -->
          <div class="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <p class="text-gray-500 text-sm">Lien portail invalide. Contactez votre prestataire.</p>
          </div>

        } @else if (!session()) {
          <!-- Étape 1 / 2 : connexion -->
          <div class="max-w-sm mx-auto pt-8">
            <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 space-y-6">
              <div class="text-center">
                <h1 class="text-xl font-bold text-gray-900">Espace client</h1>
                <p class="text-sm text-gray-500 mt-1">Consultez vos factures en toute sécurité</p>
              </div>

              @if (step() === 1) {
                <form [formGroup]="emailForm" (ngSubmit)="requestOtp()" class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Votre adresse email
                    </label>
                    <input type="email" formControlName="email" autocomplete="email"
                           placeholder="votre@email.com"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                  focus:outline-none focus:ring-2 focus:ring-blue-500"
                           [class.border-red-400]="emailForm.get('email')!.invalid
                                                    && emailForm.get('email')!.touched">
                  </div>
                  @if (error()) {
                    <p class="text-sm text-red-500">{{ error() }}</p>
                  }
                  <button type="submit" [disabled]="emailForm.invalid || loading()"
                          class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                                 text-white font-medium py-2.5 rounded-lg text-sm transition">
                    {{ loading() ? 'Envoi...' : 'Recevoir un code' }}
                  </button>
                </form>

              } @else {
                <div class="space-y-4">
                  <p class="text-sm text-gray-600 text-center">
                    Un code à 6 chiffres a été envoyé à<br>
                    <strong>{{ emailForm.get('email')!.value }}</strong>
                  </p>
                  <form [formGroup]="otpForm" (ngSubmit)="verifyOtp()" class="space-y-4">
                    <div>
                      <input type="text" formControlName="code" [value]="otpForm.get('code')!.value"
                             (input)="onOtpInput($event)"
                             maxlength="6" inputmode="numeric" placeholder="000000"
                             autocomplete="one-time-code"
                             class="w-full px-3 py-3 border border-gray-300 rounded-lg text-sm
                                    text-center tracking-[0.5em] font-mono text-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-500">
                    </div>
                    @if (error()) {
                      <p class="text-sm text-red-500 text-center">{{ error() }}</p>
                    }
                    <button type="submit"
                            [disabled]="otpForm.invalid || loading()"
                            class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                                   text-white font-medium py-2.5 rounded-lg text-sm transition">
                      {{ loading() ? 'Vérification...' : 'Accéder à mes factures' }}
                    </button>
                    <button type="button" (click)="step.set(1); error.set('')"
                            class="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                      Changer d'email
                    </button>
                  </form>
                </div>
              }
            </div>
          </div>

        } @else {
          <!-- Espace client connecté -->
          <div class="space-y-2">
            <h2 class="text-xl font-bold text-gray-900">Mes factures</h2>
            <p class="text-sm text-gray-500">
              Espace de <strong>{{ session()!.nomEntreprise }}</strong>
            </p>
          </div>

          @if (loadingFactures()) {
            <div class="flex items-center justify-center h-32 text-gray-400 text-sm">
              Chargement...
            </div>
          } @else if (factures().length === 0) {
            <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p class="text-gray-400 text-sm">Aucune facture disponible pour le moment.</p>
            </div>
          } @else {
            <!-- Summary stats -->
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p class="text-2xl font-bold text-gray-900">{{ factures().length }}</p>
                <p class="text-xs text-gray-500 mt-0.5">Factures</p>
              </div>
              <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p class="text-2xl font-bold text-orange-600">{{ countEmises() }}</p>
                <p class="text-xs text-gray-500 mt-0.5">À payer</p>
              </div>
              <div class="bg-white rounded-xl border border-gray-200 p-4 text-center">
                <p class="text-lg font-bold text-gray-900">{{ totalEmis() | number:'1.0-0' }}</p>
                <p class="text-xs text-gray-500 mt-0.5">Total dû (TTC)</p>
              </div>
            </div>

            <!-- Invoice list -->
            <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Facture</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Échéance</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Montant TTC</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Statut</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  @for (f of factures(); track f.id) {
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-3 font-medium text-gray-900">{{ f.numero }}</td>
                      <td class="px-4 py-3 text-gray-600">{{ formatDate(f.dateFacture) }}</td>
                      <td class="px-4 py-3 text-gray-600">
                        {{ f.dateEcheance ? formatDate(f.dateEcheance) : '—' }}
                        @if (isOverdue(f)) {
                          <span class="ml-1 text-xs text-red-500 font-medium">En retard</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-right font-semibold text-gray-900">
                        {{ f.montantTtc | number:'1.2-2' }}
                      </td>
                      <td class="px-4 py-3">
                        <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                              [class]="statutColor(f.statut)">
                          {{ statutLabel(f.statut) }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        }
      </main>
    </div>
  `
})
export class ClientPortailComponent implements OnInit {

  private readonly svc   = inject(ClientPortailService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb    = inject(FormBuilder);

  entrepriseId    = signal('');
  step            = signal(1);
  loading         = signal(false);
  loadingFactures = signal(false);
  error           = signal('');

  session  = signal<{ token: string; nomTiers: string; nomEntreprise: string } | null>(null);
  factures = signal<FactureClientResponse[]>([]);

  emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  otpForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('entrepriseId') ?? '';
    this.entrepriseId.set(id);
  }

  requestOtp() {
    if (this.emailForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email } = this.emailForm.getRawValue();
    this.svc.requestOtp(this.entrepriseId(), email).subscribe({
      next: () => { this.step.set(2); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.detail ?? 'Aucun client trouvé avec cet email.'); this.loading.set(false); }
    });
  }

  onOtpInput(event: Event) {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
    this.otpForm.patchValue({ code: val });
  }

  verifyOtp() {
    if (this.otpForm.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { email } = this.emailForm.getRawValue();
    const { code } = this.otpForm.getRawValue();
    this.svc.verify(this.entrepriseId(), email, code).subscribe({
      next: (res) => {
        this.session.set(res);
        this.loading.set(false);
        this.loadFactures(res.token);
      },
      error: (e) => { this.error.set(e?.error?.detail ?? 'Code invalide ou expiré.'); this.loading.set(false); }
    });
  }

  private loadFactures(token: string) {
    this.loadingFactures.set(true);
    this.svc.getFactures(token).subscribe({
      next: (list) => { this.factures.set(list); this.loadingFactures.set(false); },
      error: () => this.loadingFactures.set(false)
    });
  }

  logout() {
    this.session.set(null);
    this.factures.set([]);
    this.step.set(1);
    this.emailForm.reset();
    this.otpForm.reset();
  }

  countEmises(): number {
    return this.factures().filter(f => f.statut === 'EMISE').length;
  }

  totalEmis(): number {
    return this.factures()
      .filter(f => f.statut === 'EMISE')
      .reduce((sum, f) => sum + Number(f.montantTtc), 0);
  }

  isOverdue(f: FactureClientResponse): boolean {
    if (f.statut !== 'EMISE' || !f.dateEcheance) return false;
    return new Date(f.dateEcheance) < new Date();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  statutLabel(s: string): string { return STATUT_LABELS[s] ?? s; }
  statutColor(s: string): string { return STATUT_COLORS[s] ?? 'bg-gray-100 text-gray-600'; }
}
