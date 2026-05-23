import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { ProfileResponse } from '../../core/models/auth.model';

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
              <p class="text-sm text-green-600">✓ Informations mises à jour</p>
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
              <p class="text-sm text-green-600">✓ Mot de passe modifié</p>
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

  profile    = signal<ProfileResponse | null>(null);
  savingInfo = signal(false);
  infoSuccess = signal(false);
  infoError  = signal('');
  savingPwd  = signal(false);
  pwdSuccess = signal(false);
  pwdError   = signal('');

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
