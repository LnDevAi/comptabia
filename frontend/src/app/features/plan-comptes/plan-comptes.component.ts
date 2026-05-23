import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompteService } from '../../core/services/compte.service';
import { Compte } from '../../core/models/compte.model';

const CLASSES = [
  { id: 1, label: 'Classe 1 — Ressources durables' },
  { id: 2, label: 'Classe 2 — Actif immobilisé' },
  { id: 3, label: 'Classe 3 — Stocks' },
  { id: 4, label: 'Classe 4 — Tiers' },
  { id: 5, label: 'Classe 5 — Trésorerie' },
  { id: 6, label: 'Classe 6 — Charges' },
  { id: 7, label: 'Classe 7 — Produits' },
  { id: 8, label: 'Classe 8 — Autres charges/produits' },
  { id: 9, label: 'Classe 9 — Analytique' },
];

@Component({
  selector: 'app-plan-comptes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6 max-w-5xl mx-auto space-y-6">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-bold text-gray-900">Plan de comptes SYSCOHADA</h2>
        <button (click)="showForm.set(!showForm())"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm
                       font-medium rounded-lg transition">
          + Nouveau compte
        </button>
      </div>

      <!-- New account form -->
      @if (showForm()) {
        <div class="bg-white border border-gray-200 rounded-xl p-5">
          <h3 class="text-sm font-semibold text-gray-700 mb-4">Nouveau compte</h3>
          <form [formGroup]="form" (ngSubmit)="submit()" class="flex flex-wrap gap-3 items-end">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Numéro</label>
              <input type="text" formControlName="numero" placeholder="ex: 512"
                     class="w-28 px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex-1 min-w-48">
              <label class="block text-xs text-gray-600 mb-1">Intitulé</label>
              <input type="text" formControlName="intitule" placeholder="Libellé du compte"
                     class="w-full px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                            focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Classe</label>
              <select formControlName="classe"
                      class="px-2 py-1.5 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500">
                @for (c of classes; track c.id) {
                  <option [value]="c.id">{{ c.id }}</option>
                }
              </select>
            </div>
            <button type="submit" [disabled]="form.invalid || saving()"
                    class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50
                           text-white text-sm font-medium rounded-lg transition">
              Enregistrer
            </button>
            <button type="button" (click)="showForm.set(false)"
                    class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">
              Annuler
            </button>
          </form>
          @if (formError()) {
            <p class="text-xs text-red-500 mt-2">{{ formError() }}</p>
          }
        </div>
      }

      <!-- Filter by class -->
      <div class="flex gap-2 flex-wrap">
        <button (click)="activeClasse.set(null)"
                [class]="activeClasse() === null ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                class="px-3 py-1 rounded-full text-xs font-medium transition">
          Tous
        </button>
        @for (c of classes; track c.id) {
          <button (click)="activeClasse.set(c.id)"
                  [class]="activeClasse() === c.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'"
                  class="px-3 py-1 rounded-full text-xs font-medium transition">
            {{ c.id }}
          </button>
        }
      </div>

      <!-- Accounts table -->
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-5 py-3 text-left">Numéro</th>
              <th class="px-5 py-3 text-left">Intitulé</th>
              <th class="px-5 py-3 text-center">Classe</th>
              <th class="px-5 py-3 text-center">Statut</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (c of filteredComptes(); track c.id) {
              <tr class="hover:bg-gray-50" [class.opacity-50]="!c.actif">
                <td class="px-5 py-3 font-mono font-semibold text-gray-900">{{ c.numero }}</td>
                <td class="px-5 py-3 text-gray-700">{{ c.intitule }}</td>
                <td class="px-5 py-3 text-center">
                  <span class="px-2 py-0.5 rounded bg-gray-100 text-gray-600 text-xs">{{ c.classe }}</span>
                </td>
                <td class="px-5 py-3 text-center">
                  <span class="text-xs font-medium" [class]="c.actif ? 'text-green-600' : 'text-gray-400'">
                    {{ c.actif ? 'Actif' : 'Inactif' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-5 py-8 text-center text-gray-400 text-sm">
                  Aucun compte trouvé
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class PlanComptesComponent implements OnInit {

  private readonly service = inject(CompteService);
  private readonly fb      = inject(FormBuilder);

  classes       = CLASSES;
  comptes       = signal<Compte[]>([]);
  activeClasse  = signal<number | null>(null);
  showForm      = signal(false);
  saving        = signal(false);
  formError     = signal('');

  form = this.fb.nonNullable.group({
    numero:   ['', Validators.required],
    intitule: ['', Validators.required],
    classe:   [1, [Validators.required, Validators.min(1), Validators.max(9)]]
  });

  filteredComptes() {
    const classe = this.activeClasse();
    return classe ? this.comptes().filter(c => c.classe === classe) : this.comptes();
  }

  ngOnInit() {
    this.loadComptes();
  }

  submit() {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set('');
    this.service.create(this.form.getRawValue()).subscribe({
      next: (c) => {
        this.comptes.update(list => [...list, c].sort((a, b) => a.numero.localeCompare(b.numero)));
        this.form.reset({ classe: 1 });
        this.showForm.set(false);
        this.saving.set(false);
      },
      error: (e) => {
        this.formError.set(e?.error?.detail ?? 'Erreur lors de la création');
        this.saving.set(false);
      }
    });
  }

  private loadComptes() {
    this.service.findAll().subscribe(list => this.comptes.set(list));
  }
}
