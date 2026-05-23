import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule,
  ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { OHADA_PAYS } from '../../../core/models/auth.model';

const passwordMatch: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const pwd  = group.get('motDePasse')?.value;
  const conf = group.get('confirmMotDePasse')?.value;
  return pwd && conf && pwd !== conf ? { mismatch: true } : null;
};

@Component({
  selector: 'app-register',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-200 p-8">

        <div class="mb-8 text-center">
          <h1 class="text-2xl font-bold text-gray-900">e-Compta</h1>
          <p class="text-sm text-gray-500 mt-1">Créer votre espace comptable</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">

          <!-- Entreprise section -->
          <div class="border border-gray-200 rounded-xl p-4 space-y-3">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Informations entreprise
            </p>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nom de l'entreprise <span class="text-red-500">*</span>
              </label>
              <input type="text" formControlName="nomEntreprise" autocomplete="organization"
                     placeholder="Ex : Comptabilité Sanou & Associés"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                     [class.border-red-400]="isInvalid('nomEntreprise')">
              @if (isInvalid('nomEntreprise')) {
                <p class="text-xs text-red-500 mt-1">Champ requis</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Pays <span class="text-red-500">*</span>
              </label>
              <select formControlName="pays"
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      [class.border-red-400]="isInvalid('pays')">
                <option value="">-- Sélectionnez un pays --</option>
                @for (p of pays; track p.code) {
                  <option [value]="p.code">{{ p.label }}</option>
                }
              </select>
              @if (isInvalid('pays')) {
                <p class="text-xs text-red-500 mt-1">Veuillez sélectionner un pays</p>
              }
            </div>
          </div>

          <!-- User section -->
          <div class="border border-gray-200 rounded-xl p-4 space-y-3">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Compte administrateur
            </p>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Nom complet <span class="text-red-500">*</span>
              </label>
              <input type="text" formControlName="nomUtilisateur" autocomplete="name"
                     placeholder="Ex : Amadou Traoré"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                     [class.border-red-400]="isInvalid('nomUtilisateur')">
              @if (isInvalid('nomUtilisateur')) {
                <p class="text-xs text-red-500 mt-1">Champ requis</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">
                Email <span class="text-red-500">*</span>
              </label>
              <input type="email" formControlName="email" autocomplete="email"
                     placeholder="admin@entreprise.com"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                     [class.border-red-400]="isInvalid('email')">
              @if (isInvalid('email')) {
                <p class="text-xs text-red-500 mt-1">Email invalide</p>
              }
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe <span class="text-red-500">*</span>
                </label>
                <input type="password" formControlName="motDePasse" autocomplete="new-password"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                       [class.border-red-400]="isInvalid('motDePasse')">
                @if (isInvalid('motDePasse')) {
                  <p class="text-xs text-red-500 mt-1">8 caractères minimum</p>
                }
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Confirmation <span class="text-red-500">*</span>
                </label>
                <input type="password" formControlName="confirmMotDePasse" autocomplete="new-password"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                              focus:outline-none focus:ring-2 focus:ring-blue-500"
                       [class.border-red-400]="mismatch()">
                @if (mismatch()) {
                  <p class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                }
              </div>
            </div>
          </div>

          <!-- Strength indicator -->
          @if (form.get('motDePasse')?.value) {
            <div class="space-y-1">
              <div class="flex gap-1">
                @for (i of [1,2,3,4]; track i) {
                  <div class="h-1 flex-1 rounded-full transition-colors"
                       [class]="strengthColor(i)"></div>
                }
              </div>
              <p class="text-xs" [class]="strengthTextColor()">{{ strengthLabel() }}</p>
            </div>
          }

          @if (error()) {
            <div class="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {{ error() }}
            </div>
          }

          <button type="submit" [disabled]="form.invalid || loading()"
                  class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                         text-white font-medium py-2.5 rounded-lg text-sm transition">
            {{ loading() ? 'Création en cours...' : 'Créer mon espace comptable' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?
          <a routerLink="/auth/login" class="text-blue-600 hover:underline font-medium">
            Se connecter
          </a>
        </p>

        <p class="text-center text-xs text-gray-400 mt-4">
          Le plan de comptes SYSCOHADA (32 comptes) est créé automatiquement.
        </p>
      </div>
    </div>
  `
})
export class RegisterComponent {

  pays = OHADA_PAYS;
  loading = signal(false);
  error   = signal('');

  form = this.fb.nonNullable.group({
    nomEntreprise:    ['', Validators.required],
    pays:             ['', Validators.required],
    nomUtilisateur:   ['', Validators.required],
    email:            ['', [Validators.required, Validators.email]],
    motDePasse:       ['', [Validators.required, Validators.minLength(8)]],
    confirmMotDePasse:['', Validators.required],
  }, { validators: passwordMatch });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const { confirmMotDePasse, ...payload } = this.form.getRawValue();
    this.auth.register(payload).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error.set(e?.error?.detail ?? "Erreur lors de la création du compte");
        this.loading.set(false);
      }
    });
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }

  mismatch(): boolean {
    return !!this.form.errors?.['mismatch'] &&
           !!this.form.get('confirmMotDePasse')?.touched;
  }

  private strength(): number {
    const pwd = this.form.get('motDePasse')?.value ?? '';
    let score = 0;
    if (pwd.length >= 8)                        score++;
    if (pwd.length >= 12)                       score++;
    if (/[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd))               score++;
    return score;
  }

  strengthColor(level: number): string {
    const s = this.strength();
    if (s === 0) return 'bg-gray-200';
    const colors = ['bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
    return level <= s ? colors[s - 1] : 'bg-gray-200';
  }

  strengthLabel(): string {
    return ['', 'Faible', 'Acceptable', 'Bon', 'Fort'][this.strength()];
  }

  strengthTextColor(): string {
    return ['', 'text-red-500', 'text-orange-500', 'text-yellow-600', 'text-green-600'][this.strength()];
  }
}
