import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModeleService } from '../../core/services/modele.service';
import { CompteService } from '../../core/services/compte.service';
import { LigneModele, ModeleRequest, ModeleResponse } from '../../core/models/modele.model';

type Vue = 'liste' | 'form' | 'instancier';

@Component({
  selector: 'app-modeles',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-5xl mx-auto space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Modèles d'écritures</h1>
      <p class="text-sm text-gray-500 mt-0.5">Gabarits réutilisables pour les saisies récurrentes</p>
    </div>
    @if (vue() === 'liste') {
      <button (click)="ouvrirForm(null)"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
        + Nouveau modèle
      </button>
    }
  </div>

  <!-- Liste -->
  @if (vue() === 'liste') {
    @if (modeles().length === 0) {
      <div class="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400 text-sm">
        Aucun modèle. Créez-en un pour accélérer vos saisies récurrentes.
      </div>
    } @else {
      <div class="space-y-3">
        @for (m of modeles(); track m.id) {
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h3 class="font-semibold text-gray-800">{{ m.nom }}</h3>
                  <span class="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{{ m.journal }}</span>
                </div>
                @if (m.libelleDefaut) {
                  <p class="text-sm text-gray-500 mt-0.5">{{ m.libelleDefaut }}</p>
                }
                <!-- Preview lignes -->
                <div class="mt-2 space-y-1">
                  @for (l of m.lignes; track l.id) {
                    <div class="flex items-center gap-3 text-xs text-gray-500">
                      <span class="font-mono w-16 shrink-0">{{ l.compteNumero }}</span>
                      <span class="truncate flex-1">{{ l.compteIntitule }}</span>
                      @if ((l.debit ?? 0) > 0) {
                        <span class="text-blue-600 w-24 text-right">D {{ l.debit | number:'1.2-2' }}</span>
                      }
                      @if ((l.credit ?? 0) > 0) {
                        <span class="text-green-600 w-24 text-right">C {{ l.credit | number:'1.2-2' }}</span>
                      }
                    </div>
                  }
                </div>
              </div>
              <div class="flex gap-2 shrink-0">
                <button (click)="ouvrirInstancier(m)"
                        class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg">
                  Utiliser
                </button>
                <button (click)="ouvrirForm(m)"
                        class="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs rounded-lg">
                  Modifier
                </button>
                <button (click)="supprimer(m)"
                        class="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 text-xs rounded-lg">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  }

  <!-- Formulaire création/édition -->
  @if (vue() === 'form') {
    <form (ngSubmit)="sauvegarder()" class="space-y-5">
      <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 class="text-sm font-semibold text-gray-700">
          {{ modeleEnCours ? 'Modifier' : 'Nouveau' }} modèle
        </h2>
        <div class="grid grid-cols-3 gap-4">
          <div class="col-span-2">
            <label class="block text-xs text-gray-500 mb-1">Nom du modèle *</label>
            <input [(ngModel)]="form.nom" name="nom" required
                   placeholder="Ex. Salaires mensuels"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Journal</label>
            <select [(ngModel)]="form.journal" name="journal"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="OD">OD — Opérations diverses</option>
              <option value="AC">AC — Achats</option>
              <option value="VT">VT — Ventes</option>
              <option value="BQ">BQ — Banque</option>
            </select>
          </div>
          <div class="col-span-3">
            <label class="block text-xs text-gray-500 mb-1">Libellé par défaut</label>
            <input [(ngModel)]="form.libelleDefaut" name="libelleDefaut"
                   placeholder="Libellé pré-rempli lors de l'utilisation"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      <!-- Lignes -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700">Lignes</h2>
          <button type="button" (click)="ajouterLigne()"
                  class="text-xs text-blue-600 hover:text-blue-800 font-medium">
            + Ajouter une ligne
          </button>
        </div>

        <div class="grid grid-cols-12 gap-2 text-xs text-gray-400 font-medium px-1">
          <span class="col-span-3">Compte</span>
          <span class="col-span-3">Libellé</span>
          <span class="col-span-2 text-right">Débit</span>
          <span class="col-span-2 text-right">Crédit</span>
          <span class="col-span-1"></span>
        </div>

        @for (ligne of form.lignes; track ligne) {
          <div class="grid grid-cols-12 gap-2 items-center">
            <div class="col-span-3">
              <select [(ngModel)]="ligne.compteId" [name]="'compte-' + $index"
                      class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Compte —</option>
                @for (c of comptes(); track c.id) {
                  <option [value]="c.id">{{ c.numero }} — {{ c.intitule }}</option>
                }
              </select>
            </div>
            <div class="col-span-3">
              <input [(ngModel)]="ligne.libelle" [name]="'libelle-' + $index"
                     placeholder="Libellé"
                     class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="col-span-2">
              <input [(ngModel)]="ligne.debit" [name]="'debit-' + $index"
                     type="number" min="0" step="0.01"
                     class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="col-span-2">
              <input [(ngModel)]="ligne.credit" [name]="'credit-' + $index"
                     type="number" min="0" step="0.01"
                     class="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div class="col-span-1 flex justify-center">
              <button type="button" (click)="supprimerLigne($index)"
                      class="text-gray-400 hover:text-red-600 text-sm">✕</button>
            </div>
          </div>
        }

        <!-- Solde contrôle -->
        <div class="flex justify-between text-xs pt-2 border-t border-gray-100 px-1">
          <span class="text-gray-400">Solde (débit − crédit)</span>
          <span [ngClass]="solde() === 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'">
            {{ solde() | number:'1.2-2' }}
          </span>
        </div>
      </div>

      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }

      <div class="flex justify-end gap-3">
        <button type="button" (click)="vue.set('liste')"
                class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          Annuler
        </button>
        <button type="submit" [disabled]="saving() || solde() !== 0"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
          {{ saving() ? 'Enregistrement…' : 'Enregistrer le modèle' }}
        </button>
      </div>
    </form>
  }

  <!-- Instancier -->
  @if (vue() === 'instancier' && modeleEnCours) {
    <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4 max-w-md">
      <h2 class="text-sm font-semibold text-gray-700">
        Utiliser « {{ modeleEnCours.nom }} »
      </h2>
      <p class="text-sm text-gray-500">
        Une écriture en brouillon sera créée avec les lignes du modèle.
        Vous pourrez ajuster les montants avant validation.
      </p>
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">Date de l'écriture *</label>
          <input [(ngModel)]="instForm.date" name="date" type="date" required
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">Numéro de pièce *</label>
          <input [(ngModel)]="instForm.numeroPiece" name="numeroPiece" required
                 placeholder="Ex. SAL-2026-01"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
      @if (error()) {
        <p class="text-sm text-red-600">{{ error() }}</p>
      }
      @if (instSuccess()) {
        <div class="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-700">
          Écriture créée en brouillon. Rendez-vous dans Écritures pour la valider.
        </div>
      }
      <div class="flex gap-3 pt-1">
        <button (click)="vue.set('liste')"
                class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50">
          Retour
        </button>
        <button (click)="instancier()" [disabled]="saving()"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
          {{ saving() ? 'Création…' : 'Créer l\'écriture' }}
        </button>
      </div>
    </div>
  }

</div>
  `
})
export class ModelesComponent implements OnInit {

  private svc        = inject(ModeleService);
  private compteSvc  = inject(CompteService);

  modeles     = signal<ModeleResponse[]>([]);
  comptes     = signal<any[]>([]);
  vue         = signal<Vue>('liste');
  saving      = signal(false);
  error       = signal<string | null>(null);
  instSuccess = signal(false);

  modeleEnCours: ModeleResponse | null = null;

  form: ModeleRequest = this.emptyForm();
  instForm = { date: new Date().toISOString().slice(0, 10), numeroPiece: '' };

  ngOnInit() {
    this.svc.lister().subscribe({ next: m => this.modeles.set(m) });
    this.compteSvc.findAll().subscribe({ next: c => this.comptes.set(c) });
  }

  ouvrirForm(modele: ModeleResponse | null) {
    this.modeleEnCours = modele;
    this.error.set(null);
    if (modele) {
      this.form = {
        nom: modele.nom,
        libelleDefaut: modele.libelleDefaut ?? '',
        journal: modele.journal as any,
        lignes: modele.lignes.map(l => ({ ...l }))
      };
    } else {
      this.form = this.emptyForm();
    }
    this.vue.set('form');
  }

  ouvrirInstancier(modele: ModeleResponse) {
    this.modeleEnCours = modele;
    this.instForm = { date: new Date().toISOString().slice(0, 10), numeroPiece: '' };
    this.error.set(null);
    this.instSuccess.set(false);
    this.vue.set('instancier');
  }

  ajouterLigne() {
    this.form.lignes.push({ compteId: '', libelle: '', debit: 0, credit: 0, ordre: this.form.lignes.length });
  }

  supprimerLigne(i: number) { this.form.lignes.splice(i, 1); }

  solde(): number {
    const d = this.form.lignes.reduce((s, l) => s + (Number(l.debit) || 0), 0);
    const c = this.form.lignes.reduce((s, l) => s + (Number(l.credit) || 0), 0);
    return Math.round((d - c) * 100) / 100;
  }

  sauvegarder() {
    this.saving.set(true);
    this.error.set(null);
    const obs = this.modeleEnCours
      ? this.svc.modifier(this.modeleEnCours.id, this.form)
      : this.svc.creer(this.form);
    obs.subscribe({
      next: () => {
        this.saving.set(false);
        this.svc.lister().subscribe({ next: m => this.modeles.set(m) });
        this.vue.set('liste');
      },
      error: e => { this.error.set(e?.error?.message ?? 'Erreur.'); this.saving.set(false); }
    });
  }

  supprimer(m: ModeleResponse) {
    if (!confirm(`Supprimer le modèle « ${m.nom} » ?`)) return;
    this.svc.supprimer(m.id).subscribe({
      next: () => this.svc.lister().subscribe({ next: list => this.modeles.set(list) }),
      error: e => alert(e?.error?.message ?? 'Erreur lors de la suppression.')
    });
  }

  instancier() {
    if (!this.modeleEnCours) return;
    this.saving.set(true);
    this.error.set(null);
    this.svc.instancier(this.modeleEnCours.id, this.instForm).subscribe({
      next: () => { this.saving.set(false); this.instSuccess.set(true); },
      error: e => { this.error.set(e?.error?.message ?? 'Erreur.'); this.saving.set(false); }
    });
  }

  private emptyForm(): ModeleRequest {
    return { nom: '', libelleDefaut: '', journal: 'OD', lignes: [
      { compteId: '', libelle: '', debit: 0, credit: 0, ordre: 0 },
      { compteId: '', libelle: '', debit: 0, credit: 0, ordre: 1 },
    ]};
  }
}
