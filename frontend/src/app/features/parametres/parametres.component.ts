import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParametresService } from '../../core/services/parametres.service';
import { EntrepriseParametres } from '../../core/models/parametres.model';

const DEVISES = ['XOF', 'XAF', 'MAD', 'TND', 'EUR', 'USD', 'GNF', 'MGA'];
const MOIS = ['Janvier','Février','Mars','Avril','Mai','Juin',
              'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

@Component({
  selector: 'app-parametres',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-3xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Paramètres de l'entreprise</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Informations légales, coordonnées et configuration comptable
    </p>
  </div>

  @if (params()) {
  <form (ngSubmit)="sauvegarder()" class="space-y-6">

    <!-- Identité -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 class="text-sm font-semibold text-gray-700">Identité légale</h2>
      <div class="grid grid-cols-2 gap-4">
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Raison sociale *</label>
          <input [(ngModel)]="form.nom" name="nom" required
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Pays *</label>
          <input [(ngModel)]="form.pays" name="pays" required
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">NIF / NINEA</label>
          <input [(ngModel)]="form.nif" name="nif"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div class="col-span-2">
          <label class="block text-xs text-gray-500 mb-1">Adresse</label>
          <textarea [(ngModel)]="form.adresse" name="adresse" rows="2"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
        </div>
      </div>
    </div>

    <!-- Coordonnées -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 class="text-sm font-semibold text-gray-700">Coordonnées</h2>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Téléphone</label>
          <input [(ngModel)]="form.telephone" name="telephone" type="tel"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Email</label>
          <input [(ngModel)]="form.email" name="email" type="email"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Site web</label>
          <input [(ngModel)]="form.siteWeb" name="siteWeb"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 placeholder="https://..." />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">URL du logo</label>
          <input [(ngModel)]="form.logoUrl" name="logoUrl"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                 placeholder="https://..." />
        </div>
      </div>
      @if (form.logoUrl) {
        <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <img [src]="form.logoUrl" alt="Logo" class="h-10 w-auto object-contain rounded"
               onerror="this.style.display='none'" />
          <span class="text-xs text-gray-400">Aperçu du logo</span>
        </div>
      }
    </div>

    <!-- Configuration comptable -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <h2 class="text-sm font-semibold text-gray-700">Configuration comptable</h2>
      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Devise</label>
          <select [(ngModel)]="form.devise" name="devise"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            @for (d of devises; track d) {
              <option [value]="d">{{ d }}</option>
            }
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Taux TVA par défaut (%)</label>
          <input [(ngModel)]="form.tauxTvaDefaut" name="tauxTvaDefaut" type="number"
                 min="0" max="100" step="0.01"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Début d'exercice</label>
          <select [(ngModel)]="form.debutExerciceMois" name="debutExerciceMois"
                  class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            @for (m of mois; track $index) {
              <option [value]="$index + 1">{{ m }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Infos en lecture seule -->
      <div class="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
        <div>
          <p class="text-xs text-gray-400">Système comptable</p>
          <p class="text-sm font-medium text-gray-700 mt-0.5">
            SYSCOHADA — {{ params()!.systemeComptable === 'NORMAL' ? 'Système normal' : 'SMT' }}
          </p>
        </div>
        <div>
          <p class="text-xs text-gray-400">Plan tarifaire</p>
          <p class="text-sm font-medium text-gray-700 mt-0.5">
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  [ngClass]="params()!.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700'
                            : params()!.plan === 'PRO' ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'">
              {{ params()!.plan }}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    @if (error()) {
      <p class="text-sm text-red-600">{{ error() }}</p>
    }
    @if (success()) {
      <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
        Paramètres enregistrés.
      </div>
    }

    <div class="flex justify-end gap-3">
      <button type="button" (click)="resetForm()"
              class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
        Annuler
      </button>
      <button type="submit" [disabled]="saving()"
              class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
        {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </div>

  </form>
  } @else {
    <div class="flex items-center justify-center h-32 text-gray-400 text-sm">Chargement…</div>
  }

</div>
  `,
})
export class ParametresComponent implements OnInit {

  private svc = inject(ParametresService);

  params  = signal<EntrepriseParametres | null>(null);
  saving  = signal(false);
  error   = signal<string | null>(null);
  success = signal(false);

  devises = DEVISES;
  mois    = MOIS;

  form: Partial<EntrepriseParametres> = {};

  ngOnInit() {
    this.svc.get().subscribe({
      next: p => { this.params.set(p); this.resetForm(); },
    });
  }

  resetForm() {
    const p = this.params();
    if (!p) return;
    this.form = { ...p };
    this.error.set(null);
    this.success.set(false);
  }

  sauvegarder() {
    this.saving.set(true);
    this.error.set(null);
    this.success.set(false);
    this.svc.update(this.form).subscribe({
      next: p => {
        this.params.set(p);
        this.saving.set(false);
        this.success.set(true);
        setTimeout(() => this.success.set(false), 3000);
      },
      error: e => {
        this.error.set(e?.error?.message ?? 'Erreur lors de la sauvegarde.');
        this.saving.set(false);
      },
    });
  }
}
