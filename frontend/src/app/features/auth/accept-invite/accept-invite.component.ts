import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-accept-invite',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div class="mb-8 text-center">
          <h1 class="text-2xl font-bold text-gray-900">e-Compta</h1>
          <p class="text-sm text-gray-500 mt-1">Activez votre compte</p>
        </div>

        @if (!token()) {
          <div class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-center">
            Lien d'invitation invalide. Vérifiez votre email.
          </div>
        } @else if (success()) {
          <div class="space-y-4 text-center">
            <div class="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <p class="text-gray-700 font-medium">Compte activé avec succès !</p>
            <a routerLink="/auth/login"
               class="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium
                      py-2.5 rounded-lg text-sm text-center transition">
              Se connecter
            </a>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
            <p class="text-sm text-gray-600 mb-2">Définissez votre mot de passe pour accéder à votre espace comptable.</p>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <input type="password" formControlName="motDePasse" autocomplete="new-password"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                     [class.border-red-400]="form.get('motDePasse')!.invalid && form.get('motDePasse')!.touched">
              @if (form.get('motDePasse')!.invalid && form.get('motDePasse')!.touched) {
                <p class="text-xs text-red-500 mt-1">8 caractères minimum</p>
              }
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
              <input type="password" formControlName="confirmer" autocomplete="new-password"
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500"
                     [class.border-red-400]="mismatch()">
              @if (mismatch()) {
                <p class="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              }
            </div>

            @if (error()) {
              <div class="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {{ error() }}
              </div>
            }

            <button type="submit" [disabled]="form.invalid || mismatch() || loading()"
                    class="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                           text-white font-medium py-2.5 rounded-lg text-sm transition">
              {{ loading() ? 'Activation...' : 'Activer mon compte' }}
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class AcceptInviteComponent implements OnInit {

  form = this.fb.nonNullable.group({
    motDePasse: ['', [Validators.required, Validators.minLength(8)]],
    confirmer:  ['', Validators.required],
  });

  token   = signal('');
  loading = signal(false);
  error   = signal('');
  success = signal(false);

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    const t = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.token.set(t);
  }

  submit() {
    if (this.form.invalid || this.mismatch()) return;
    this.loading.set(true);
    this.error.set('');
    const { motDePasse } = this.form.getRawValue();
    this.http.post('/api/auth/accept-invite', { token: this.token(), motDePasse }).subscribe({
      next: () => { this.success.set(true); this.loading.set(false); },
      error: (e) => { this.error.set(e?.error?.detail ?? 'Lien invalide ou expiré.'); this.loading.set(false); }
    });
  }

  mismatch(): boolean {
    const f = this.form;
    return f.get('motDePasse')!.value !== f.get('confirmer')!.value && f.get('confirmer')!.touched;
  }
}
