import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ProfileResponse, TotpSetupResponse } from '../../core/models/auth.model';

const PLAN_LABELS: Record<string, string> = {
  FREE: 'Gratuit', PRO: 'Pro', ENTERPRISE: 'Entreprise'
};
const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  PRO: 'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-purple-100 text-purple-700'
};

@Component({
  selector: 'app-profile',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-2xl mx-auto space-y-6">
      <h2 class="text-xl font-bold text-gray-900">Mon profil</h2>

      @if (profile()) {
        <!-- Identity card -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-5">
          <div class="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center
                      text-white text-2xl font-bold shrink-0">
            {{ initials() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-lg font-semibold text-gray-900">{{ profile()!.nom }}</p>
            <p class="text-sm text-gray-500">{{ profile()!.email }}</p>
            <div class="flex items-center gap-2 mt-1">
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                    [class]="roleColor()">
                {{ profile()!.role }}
              </span>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                    [class]="planColor()">
                {{ planLabel() }}
              </span>
            </div>
          </div>
          <div class="text-right text-xs text-gray-400">
            <p>{{ profile()!.nomEntreprise }}</p>
            <p class="mt-0.5">{{ profile()!.pays }}</p>
            <p class="mt-0.5">Depuis {{ formatDate(profile()!.createdAt) }}</p>
          </div>
        </div>

        <!-- Edit form -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
          <h3 class="text-sm font-semibold text-gray-700">Modifier les informations</h3>

          <form [formGroup]="infoForm" (ngSubmit)="saveInfo()" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input type="text" formControlName="nom"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" formControlName="email"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                       [class.border-red-400]="infoForm.get('email')!.invalid && infoForm.get('email')!.touched">
              </div>
            </div>

            @if (infoSuccess()) {
              <p class="text-sm text-green-600">Informations mises à jour</p>
            }
            @if (infoError()) {
              <p class="text-sm text-red-500">{{ infoError() }}</p>
            }

            <div class="flex justify-end">
              <button type="submit"
                      [disabled]="infoForm.pristine || infoForm.invalid || savingInfo()"
                      class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ savingInfo() ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Password change -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 class="text-sm font-semibold text-gray-700">Changer le mot de passe</h3>

          <form [formGroup]="pwdForm" (ngSubmit)="changePwd()" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe actuel
              </label>
              <input type="password" formControlName="motDePasseActuel"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Nouveau mot de passe
                </label>
                <input type="password" formControlName="nouveauMotDePasse"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                       [class.border-red-400]="pwdForm.get('nouveauMotDePasse')!.invalid
                                               && pwdForm.get('nouveauMotDePasse')!.touched">
                @if (pwdForm.get('nouveauMotDePasse')!.invalid && pwdForm.get('nouveauMotDePasse')!.touched) {
                  <p class="text-xs text-red-500 mt-1">8 caractères minimum</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Confirmation
                </label>
                <input type="password" formControlName="confirmer"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                       [class.border-red-400]="pwdMismatch()">
                @if (pwdMismatch()) {
                  <p class="text-xs text-red-500 mt-1">Ne correspond pas</p>
                }
              </div>
            </div>

            @if (pwdSuccess()) {
              <p class="text-sm text-green-600">Mot de passe modifié</p>
            }
            @if (pwdError()) {
              <p class="text-sm text-red-500">{{ pwdError() }}</p>
            }

            <div class="flex justify-end">
              <button type="submit"
                      [disabled]="pwdForm.invalid || pwdMismatch() || savingPwd()"
                      class="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ savingPwd() ? 'Modification...' : 'Modifier le mot de passe' }}
              </button>
            </div>
          </form>
        </div>

        <!-- 2FA section -->
        <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-sm font-semibold text-gray-700">Double authentification (2FA)</h3>
              <p class="text-xs text-gray-500 mt-0.5">
                Sécurisez votre compte avec une application TOTP (Google Authenticator, Authy…)
              </p>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold"
                  [class]="profile()!.totpEnabled
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'">
              {{ profile()!.totpEnabled ? 'Activée' : 'Désactivée' }}
            </span>
          </div>

          @if (!profile()!.totpEnabled) {
            @if (!totpSetup()) {
              <button (click)="startSetup()" [disabled]="twoFaLoading()"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                             text-white text-sm font-medium rounded-lg transition">
                {{ twoFaLoading() ? 'Chargement...' : 'Configurer la 2FA' }}
              </button>
            } @else {
              <div class="space-y-4">
                <p class="text-sm text-gray-600">
                  Scannez ce QR code avec votre application d'authentification, puis entrez le code généré.
                </p>
                <div class="flex flex-col items-center gap-3">
                  <img [src]="totpSetup()!.qrCodeImage" alt="QR Code 2FA"
                       class="w-44 h-44 border border-gray-200 rounded-lg">
                  <p class="text-xs text-gray-400 font-mono break-all text-center px-2">
                    {{ totpSetup()!.secret }}
                  </p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Code de confirmation
                  </label>
                  <input type="text" [value]="twoFaCode()" (input)="onTwoFaInput($event)"
                         maxlength="6" inputmode="numeric" placeholder="000000"
                         class="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm
                                text-center tracking-[0.4em] font-mono
                                focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                @if (twoFaError()) {
                  <p class="text-sm text-red-500">{{ twoFaError() }}</p>
                }
                @if (twoFaSuccess()) {
                  <p class="text-sm text-green-600">2FA activée avec succès !</p>
                }
                <div class="flex gap-3">
                  <button (click)="confirmEnable()" [disabled]="twoFaCode().length !== 6 || twoFaLoading()"
                          class="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50
                                 text-white text-sm font-medium rounded-lg transition">
                    {{ twoFaLoading() ? 'Activation...' : 'Activer' }}
                  </button>
                  <button (click)="cancelSetup()" type="button"
                          class="px-4 py-2 border border-gray-300 hover:bg-gray-50
                                 text-gray-700 text-sm font-medium rounded-lg transition">
                    Annuler
                  </button>
                </div>
              </div>
            }
          } @else {
            @if (!showDisableForm()) {
              <button (click)="showDisableForm.set(true)" type="button"
                      class="px-4 py-2 border border-red-300 hover:bg-red-50
                             text-red-600 text-sm font-medium rounded-lg transition">
                Désactiver la 2FA
              </button>
            } @else {
              <div class="space-y-3">
                <p class="text-sm text-gray-600">
                  Entrez un code TOTP valide pour désactiver la double authentification.
                </p>
                <div>
                  <input type="text" [value]="twoFaCode()" (input)="onTwoFaInput($event)"
                         maxlength="6" inputmode="numeric" placeholder="000000"
                         class="w-40 px-3 py-2 border border-gray-300 rounded-lg text-sm
                                text-center tracking-[0.4em] font-mono
                                focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                @if (twoFaError()) {
                  <p class="text-sm text-red-500">{{ twoFaError() }}</p>
                }
                @if (twoFaSuccess()) {
                  <p class="text-sm text-green-600">2FA désactivée.</p>
                }
                <div class="flex gap-3">
                  <button (click)="confirmDisable()" [disabled]="twoFaCode().length !== 6 || twoFaLoading()"
                          class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50
                                 text-white text-sm font-medium rounded-lg transition">
                    {{ twoFaLoading() ? 'Désactivation...' : 'Confirmer la désactivation' }}
                  </button>
                  <button (click)="cancelDisable()" type="button"
                          class="px-4 py-2 border border-gray-300 hover:bg-gray-50
                                 text-gray-700 text-sm font-medium rounded-lg transition">
                    Annuler
                  </button>
                </div>
              </div>
            }
          }
        </div>
      } @else {
        <div class="flex items-center justify-center h-40 text-gray-400 text-sm">
          Chargement...
        </div>
      }
    </div>
  `
})
export class ProfileComponent implements OnInit {

  private readonly auth = inject(AuthService);
  private readonly fb   = inject(FormBuilder);

  profile     = signal<ProfileResponse | null>(null);
  savingInfo  = signal(false);
  infoSuccess = signal(false);
  infoError   = signal('');
  savingPwd   = signal(false);
  pwdSuccess  = signal(false);
  pwdError    = signal('');

  // 2FA state
  totpSetup      = signal<TotpSetupResponse | null>(null);
  twoFaCode      = signal('');
  twoFaLoading   = signal(false);
  twoFaError     = signal('');
  twoFaSuccess   = signal(false);
  showDisableForm = signal(false);

  infoForm = this.fb.nonNullable.group({
    nom:   ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  pwdForm = this.fb.nonNullable.group({
    motDePasseActuel:  ['', Validators.required],
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(8)]],
    confirmer:         ['', Validators.required],
  });

  ngOnInit() {
    this.auth.getProfile().subscribe(p => {
      this.profile.set(p);
      this.infoForm.patchValue({ nom: p.nom, email: p.email });
    });
  }

  saveInfo() {
    if (this.infoForm.invalid) return;
    this.savingInfo.set(true);
    this.infoSuccess.set(false);
    this.infoError.set('');
    const { nom, email } = this.infoForm.getRawValue();
    this.auth.updateProfile({ nom, email }).subscribe({
      next: (p) => {
        this.profile.set(p);
        this.infoForm.markAsPristine();
        this.infoSuccess.set(true);
        this.savingInfo.set(false);
      },
      error: (e) => {
        this.infoError.set(e?.error?.detail ?? 'Erreur lors de la mise à jour');
        this.savingInfo.set(false);
      }
    });
  }

  changePwd() {
    if (this.pwdForm.invalid || this.pwdMismatch()) return;
    this.savingPwd.set(true);
    this.pwdSuccess.set(false);
    this.pwdError.set('');
    const { motDePasseActuel, nouveauMotDePasse } = this.pwdForm.getRawValue();
    this.auth.updateProfile({ motDePasseActuel, nouveauMotDePasse }).subscribe({
      next: () => {
        this.pwdForm.reset();
        this.pwdSuccess.set(true);
        this.savingPwd.set(false);
      },
      error: (e) => {
        this.pwdError.set(e?.error?.detail ?? 'Mot de passe actuel incorrect');
        this.savingPwd.set(false);
      }
    });
  }

  // ─── 2FA actions ─────────────────────────────────────────────────────────

  startSetup() {
    this.twoFaLoading.set(true);
    this.twoFaError.set('');
    this.auth.setup2fa().subscribe({
      next: (res) => { this.totpSetup.set(res); this.twoFaLoading.set(false); },
      error: (e) => { this.twoFaError.set(e?.error?.detail ?? 'Erreur'); this.twoFaLoading.set(false); }
    });
  }

  confirmEnable() {
    this.twoFaLoading.set(true);
    this.twoFaError.set('');
    this.auth.enable2fa(this.twoFaCode()).subscribe({
      next: () => {
        this.twoFaSuccess.set(true);
        this.twoFaLoading.set(false);
        this.totpSetup.set(null);
        this.twoFaCode.set('');
        const p = this.profile();
        if (p) this.profile.set({ ...p, totpEnabled: true });
      },
      error: (e) => { this.twoFaError.set(e?.error?.detail ?? 'Code invalide'); this.twoFaLoading.set(false); }
    });
  }

  cancelSetup() {
    this.totpSetup.set(null);
    this.twoFaCode.set('');
    this.twoFaError.set('');
  }

  confirmDisable() {
    this.twoFaLoading.set(true);
    this.twoFaError.set('');
    this.auth.disable2fa(this.twoFaCode()).subscribe({
      next: () => {
        this.twoFaSuccess.set(true);
        this.twoFaLoading.set(false);
        this.showDisableForm.set(false);
        this.twoFaCode.set('');
        const p = this.profile();
        if (p) this.profile.set({ ...p, totpEnabled: false });
      },
      error: (e) => { this.twoFaError.set(e?.error?.detail ?? 'Code invalide'); this.twoFaLoading.set(false); }
    });
  }

  cancelDisable() {
    this.showDisableForm.set(false);
    this.twoFaCode.set('');
    this.twoFaError.set('');
  }

  onTwoFaInput(event: Event) {
    const val = (event.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
    this.twoFaCode.set(val);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  pwdMismatch(): boolean {
    const f = this.pwdForm;
    return f.get('nouveauMotDePasse')!.value !== f.get('confirmer')!.value
           && f.get('confirmer')!.touched;
  }

  initials(): string {
    return (this.profile()?.nom ?? '?')
      .split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  roleColor(): string {
    const r = this.profile()?.role;
    if (r === 'ADMIN')     return 'bg-red-100 text-red-700';
    if (r === 'COMPTABLE') return 'bg-blue-100 text-blue-700';
    return 'bg-gray-100 text-gray-600';
  }

  planLabel(): string { return PLAN_LABELS[this.profile()?.plan ?? 'FREE']; }
  planColor():  string { return PLAN_COLORS[this.profile()?.plan ?? 'FREE']; }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long' });
  }
}
