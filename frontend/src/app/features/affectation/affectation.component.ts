import {
  ChangeDetectionStrategy, Component, inject, OnInit, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AffectationService } from '../../core/services/affectation.service';
import { InfoResultat, LigneAffectation } from '../../core/models/affectation.model';

const COMPTES_DEFAUT_BENEFICE: LigneAffectation[] = [
  { compteNumero: '10610', libelle: 'Réserve légale (5%)',        montant: 0 },
  { compteNumero: '1062',  libelle: 'Autres réserves',            montant: 0 },
  { compteNumero: '4651',  libelle: 'Dividendes à distribuer',    montant: 0 },
  { compteNumero: '1101',  libelle: 'Report à nouveau bénéficiaire', montant: 0 },
];

const COMPTES_DEFAUT_PERTE: LigneAffectation[] = [
  { compteNumero: '1191', libelle: 'Report à nouveau déficitaire', montant: 0 },
];

@Component({
  selector: 'app-affectation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 max-w-3xl mx-auto space-y-6">

  <!-- Header -->
  <div>
    <h1 class="text-xl font-bold text-gray-800">Affectation du résultat</h1>
    <p class="text-sm text-gray-500 mt-0.5">
      Distribution du résultat de l'exercice clôturé vers les réserves, dividendes et report à nouveau
    </p>
  </div>

  <!-- Exercice selector -->
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <div class="flex items-center gap-4">
      <label class="text-sm font-medium text-gray-700">Exercice</label>
      <input type="number" [(ngModel)]="anneeSelectionnee" name="annee"
             class="w-28 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
             [min]="2020" [max]="anneeMax" />
      <button (click)="charger()"
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg">
        Charger
      </button>
    </div>
  </div>

  @if (info()) {
    <!-- Info résultat -->
    <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Résultat net exercice {{ info()!.exercice }}</p>
          <p class="text-2xl font-bold mt-1"
             [ngClass]="info()!.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'">
            {{ info()!.resultatNet | number:'1.2-2' }}
            <span class="text-sm font-normal text-gray-400 ml-1">XOF</span>
          </p>
        </div>
        <div class="flex flex-col items-end gap-1">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                [ngClass]="info()!.statut === 'CLOTURE' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'">
            {{ info()!.statut }}
          </span>
          @if (info()!.dejAffecte) {
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              Déjà affecté
            </span>
          }
        </div>
      </div>

      @if (info()!.statut !== 'CLOTURE') {
        <p class="text-sm text-orange-600 bg-orange-50 rounded-lg px-3 py-2">
          L'exercice doit être clôturé avant de procéder à l'affectation du résultat.
        </p>
      }
    </div>

    @if (info()!.statut === 'CLOTURE' && !info()!.dejAffecte) {
      <!-- Distribution form -->
      <form (ngSubmit)="affecter()" class="space-y-4">
        <div class="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-gray-700">Distribution</h2>
            <button type="button" (click)="ajouterLigne()"
                    class="text-xs text-blue-600 hover:text-blue-800 font-medium">
              + Ajouter une ligne
            </button>
          </div>

          <div class="space-y-3">
            @for (ligne of lignes; track ligne) {
              <div class="grid grid-cols-12 gap-2 items-center">
                <div class="col-span-3">
                  <input [(ngModel)]="ligne.compteNumero" [name]="'compte-' + $index"
                         placeholder="N° compte"
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div class="col-span-5">
                  <input [(ngModel)]="ligne.libelle" [name]="'libelle-' + $index"
                         placeholder="Libellé"
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div class="col-span-3">
                  <input [(ngModel)]="ligne.montant" [name]="'montant-' + $index"
                         type="number" min="0" step="0.01"
                         class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div class="col-span-1 flex justify-center">
                  <button type="button" (click)="supprimerLigne($index)"
                          class="text-gray-400 hover:text-red-600 text-xs">✕</button>
                </div>
              </div>
            }
          </div>

          <!-- Solde -->
          <div class="flex justify-between items-center pt-3 border-t border-gray-100">
            <span class="text-sm text-gray-500">Solde à affecter</span>
            <span class="text-sm font-semibold"
                  [ngClass]="solde() === 0 ? 'text-green-700' : 'text-red-600'">
              {{ solde() | number:'1.2-2' }}
            </span>
          </div>
        </div>

        @if (error()) {
          <p class="text-sm text-red-600">{{ error() }}</p>
        }

        <div class="flex justify-end">
          <button type="submit" [disabled]="saving() || solde() !== 0"
                  class="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-sm font-medium rounded-lg">
            {{ saving() ? 'Enregistrement…' : 'Valider l\'affectation' }}
          </button>
        </div>
      </form>
    }

    @if (info()!.dejAffecte) {
      <div class="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700">
        L'affectation du résultat de l'exercice {{ info()!.exercice }} a été enregistrée (OD AFFECT-{{ info()!.exercice }}).
      </div>
    }

    @if (success()) {
      <div class="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
        Affectation enregistrée avec succès (OD AFFECT-{{ info()!.exercice }}).
      </div>
    }
  }

</div>
  `
})
export class AffectationComponent implements OnInit {

  private svc = inject(AffectationService);

  info    = signal<InfoResultat | null>(null);
  saving  = signal(false);
  error   = signal<string | null>(null);
  success = signal(false);

  anneeSelectionnee = new Date().getFullYear() - 1;
  anneeMax = new Date().getFullYear();
  lignes: LigneAffectation[] = [];

  ngOnInit() { this.charger(); }

  charger() {
    this.info.set(null);
    this.error.set(null);
    this.success.set(false);
    this.svc.getInfo(this.anneeSelectionnee).subscribe({
      next: info => {
        this.info.set(info);
        this.initLignes(info);
      },
      error: e => this.error.set(e?.error?.message ?? 'Exercice introuvable.')
    });
  }

  private initLignes(info: InfoResultat) {
    const defauts = info.resultatNet >= 0 ? COMPTES_DEFAUT_BENEFICE : COMPTES_DEFAUT_PERTE;
    this.lignes = defauts.map(l => ({ ...l }));
    // Pre-fill last line (RAN) with the full amount
    if (this.lignes.length > 0) {
      this.lignes[this.lignes.length - 1].montant = Math.abs(info.resultatNet);
    }
  }

  solde(): number {
    const total = this.lignes.reduce((acc, l) => acc + (Number(l.montant) || 0), 0);
    const resultat = Math.abs(this.info()?.resultatNet ?? 0);
    return Math.round((resultat - total) * 100) / 100;
  }

  ajouterLigne() {
    this.lignes.push({ compteNumero: '', libelle: '', montant: 0 });
  }

  supprimerLigne(index: number) {
    this.lignes.splice(index, 1);
  }

  affecter() {
    this.saving.set(true);
    this.error.set(null);
    this.svc.affecter(this.anneeSelectionnee, { lignes: this.lignes }).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        this.info.update(i => i ? { ...i, dejAffecte: true } : i);
      },
      error: e => {
        this.error.set(e?.error?.message ?? 'Erreur lors de l\'affectation.');
        this.saving.set(false);
      }
    });
  }
}
