import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div class="mb-8 text-center">
          <h1 class="text-2xl font-bold text-gray-900">e-Compta</h1>
          <p class="text-sm text-gray-500 mt-1">Plateforme comptable SYSCOHADA</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" formControlName="email" autocomplete="email"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500"
                   [class.border-red-400]="showError('email')">
            @if (showError('email')) {
              <p class="text-xs text-red-500 mt-1">Email invalide</p>
            }
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
            <input type="password" formControlName="motDePasse" autocomplete="current-password"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                          focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>

          @if (error()) {
            <div class="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              {{ error() }}
            </div>
          }

          <button type="submit" [disabled]="loading() || form.invalid"
                  class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                         text-white font-medium py-2.5 rounded-lg text-sm transition">
            {{ loading() ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <p class="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?
          <a routerLink="/auth/register" class="text-blue-600 hover:underline font-medium">
            Créer un espace comptable
          </a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {

  form = this.fb.nonNullable.group({
    email:      ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required]
  });

  loading = signal(false);
  error   = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (e) => {
        this.error.set(e?.error?.detail ?? 'Identifiants invalides');
        this.loading.set(false);
      }
    });
  }

  showError(field: 'email'): boolean {
    const ctrl = this.form.get(field)!;
    return ctrl.invalid && ctrl.touched;
  }
}
