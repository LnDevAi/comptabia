import {
  Component, OnInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConsolidationService } from '../../core/services/consolidation.service';
import {
  GroupeResponse, GroupeRequest,
  BilanConsolide, CompteResultatConsolide
} from '../../core/models/consolidation.model';

type View = 'groupes' | 'form-groupe' | 'etats';
type EtatTab = 'bilan' | 'resultat';

@Component({
  selector: 'app-consolidation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
<div class="p-6 space-y-6">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Consolidation & Multi-sociétés</h1>
      <p class="text-sm text-gray-500 mt-0.5">Regroupez plusieurs sociétés pour générer des états consolidés</p>
    </div>
    @if (view === 'groupes') {
      <button (click)="openFormGroupe()"
              class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
        + Nouveau groupe
      </button>
    }
    @if (view !== 'groupes') {
      <button (click)="view = 'groupes'"
              class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
        ← Retour aux groupes
      </button>
    }
  </div>

  <!-- ═══ LISTE DES GROUPES ═══ -->
  @if (view === 'groupes') {
    @if (groupes.length === 0) {
      <div class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <p class="text-gray-400 text-lg mb-1">Aucun groupe défini</p>
        <p class="text-sm text-gray-400">Créez un groupe pour consolider plusieurs sociétés</p>
      </div>
    } @else {
      <div class="grid grid-cols-1 gap-4">
        @for (g of groupes; track g.id) {
          <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition">
            <div class="flex items-start justify-between">
              <div>
                <h3 class="font-semibold text-gray-900">{{ g.nom }}</h3>
                @if (g.description) {
                  <p class="text-sm text-gray-500 mt-0.5">{{ g.description }}</p>
                }
                <div class="flex flex-wrap gap-1 mt-2">
                  @for (m of g.membres; track m.entrepriseId) {
                    <span class="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                      {{ m.nom }} <span class="text-blue-400">{{ m.pays }}</span>
                    </span>
                  }
                  @if (g.membres.length === 0) {
                    <span class="text-xs text-gray-400 italic">Aucun membre</span>
                  }
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button (click)="openEtats(g)"
                        class="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                  États consolidés
                </button>
                <button (click)="openFormGroupe(g)"
                        class="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-lg hover:bg-gray-50">
                  Modifier
                </button>
                <button (click)="supprimerGroupe(g.id)"
                        class="px-3 py-1.5 text-red-500 hover:text-red-700 text-xs">
                  Suppr.
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    }
  }

  <!-- ═══ FORMULAIRE GROUPE ═══ -->
  @if (view === 'form-groupe') {
    <div class="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
      <h2 class="text-lg font-semibold text-gray-800 mb-4">
        {{ editGroupeId ? 'Modifier le groupe' : 'Nouveau groupe' }}
      </h2>
      <form (ngSubmit)="saveGroupe()" class="space-y-4">
        <div>
          <label class="text-sm text-gray-600">Nom du groupe *</label>
          <input type="text" [(ngModel)]="form.nom" name="nom" required
                 class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
        </div>
        <div>
          <label class="text-sm text-gray-600">Description</label>
          <textarea [(ngModel)]="form.description" name="description" rows="2"
                    class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"></textarea>
        </div>
        <div>
          <label class="text-sm text-gray-600">IDs des sociétés membres (un UUID par ligne)</label>
          <textarea [(ngModel)]="membresText" name="membres" rows="4"
                    placeholder="Collez ici les UUIDs des entreprises..."
                    class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono"></textarea>
          <p class="text-xs text-gray-400 mt-1">Vous trouverez les IDs dans Paramètres → Entreprise.</p>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="view = 'groupes'"
                  class="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button type="submit"
                  class="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            {{ editGroupeId ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  }

  <!-- ═══ ÉTATS CONSOLIDÉS ═══ -->
  @if (view === 'etats' && selectedGroupe) {
    <div class="space-y-4">

      <!-- Controls -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
        <div class="flex-1">
          <p class="text-xs text-gray-500 uppercase tracking-wide">Groupe</p>
          <p class="font-semibold text-gray-900">{{ selectedGroupe.nom }}</p>
          <div class="flex flex-wrap gap-1 mt-1">
            @for (m of selectedGroupe.membres; track m.entrepriseId) {
              <span class="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{{ m.nom }}</span>
            }
          </div>
        </div>
        <div class="flex items-center gap-3">
          <label class="text-sm text-gray-600">Exercice :</label>
          <input type="number" [(ngModel)]="exercice" min="2000" max="2100"
                 class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-24">
          <button (click)="chargerEtats()"
                  class="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
            Générer
          </button>
        </div>
      </div>

      <!-- Tabs -->
      @if (bilan || compteResultat) {
        <div class="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button (click)="etatTab = 'bilan'"
                  class="px-4 py-1.5 text-sm rounded-md transition"
                  [ngClass]="etatTab === 'bilan' ? 'bg-white text-blue-700 font-semibold shadow-sm' : 'text-gray-600'">
            Bilan
          </button>
          <button (click)="etatTab = 'resultat'"
                  class="px-4 py-1.5 text-sm rounded-md transition"
                  [ngClass]="etatTab === 'resultat' ? 'bg-white text-blue-700 font-semibold shadow-sm' : 'text-gray-600'">
            Compte de résultat
          </button>
        </div>
      }

      <!-- Bilan consolidé -->
      @if (etatTab === 'bilan' && bilan) {
        <div class="grid grid-cols-2 gap-4">
          <!-- Actif -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-blue-600 text-white px-4 py-2 flex justify-between items-center">
              <span class="font-semibold text-sm">ACTIF</span>
              <span class="font-bold">{{ fmt(bilan.totalActif) }}</span>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr class="text-xs text-gray-500">
                  <th class="px-3 py-1.5 text-left">Compte</th>
                  <th class="px-3 py-1.5 text-left">Intitulé</th>
                  <th class="px-3 py-1.5 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                @for (p of bilan.actif; track p.numero) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-1.5 font-mono text-xs text-gray-500">{{ p.numero }}</td>
                    <td class="px-3 py-1.5 text-gray-800">{{ p.intitule }}</td>
                    <td class="px-3 py-1.5 text-right font-medium">{{ fmt(p.montant) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Passif -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-gray-700 text-white px-4 py-2 flex justify-between items-center">
              <span class="font-semibold text-sm">PASSIF</span>
              <span class="font-bold">{{ fmt(bilan.totalPassif) }}</span>
            </div>
            <table class="w-full text-sm">
              <thead class="bg-gray-50">
                <tr class="text-xs text-gray-500">
                  <th class="px-3 py-1.5 text-left">Compte</th>
                  <th class="px-3 py-1.5 text-left">Intitulé</th>
                  <th class="px-3 py-1.5 text-right">Montant</th>
                </tr>
              </thead>
              <tbody>
                @for (p of bilan.passif; track p.numero) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-1.5 font-mono text-xs text-gray-500">{{ p.numero }}</td>
                    <td class="px-3 py-1.5 text-gray-800">{{ p.intitule }}</td>
                    <td class="px-3 py-1.5 text-right font-medium">{{ fmt(p.montant) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          ⚠ {{ bilan.note }}
        </p>
      }

      <!-- Compte de résultat consolidé -->
      @if (etatTab === 'resultat' && compteResultat) {
        <!-- KPIs -->
        <div class="grid grid-cols-3 gap-4">
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Total produits</p>
            <p class="text-xl font-bold text-green-600 mt-1">{{ fmt(compteResultat.totalProduits) }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Total charges</p>
            <p class="text-xl font-bold text-red-500 mt-1">{{ fmt(compteResultat.totalCharges) }}</p>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-4">
            <p class="text-xs text-gray-500 uppercase">Résultat consolidé</p>
            <p class="text-xl font-bold mt-1"
               [ngClass]="compteResultat.resultat >= 0 ? 'text-green-700' : 'text-red-700'">
              {{ fmt(compteResultat.resultat) }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Produits -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-green-600 text-white px-4 py-2 flex justify-between items-center">
              <span class="font-semibold text-sm">PRODUITS (classe 7)</span>
              <span class="font-bold">{{ fmt(compteResultat.totalProduits) }}</span>
            </div>
            <table class="w-full text-sm">
              <tbody>
                @for (p of compteResultat.produits; track p.numero) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-1.5 font-mono text-xs text-gray-500">{{ p.numero }}</td>
                    <td class="px-3 py-1.5 text-gray-800">{{ p.intitule }}</td>
                    <td class="px-3 py-1.5 text-right font-medium text-green-600">{{ fmt(p.montant) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Charges -->
          <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div class="bg-red-500 text-white px-4 py-2 flex justify-between items-center">
              <span class="font-semibold text-sm">CHARGES (classe 6)</span>
              <span class="font-bold">{{ fmt(compteResultat.totalCharges) }}</span>
            </div>
            <table class="w-full text-sm">
              <tbody>
                @for (p of compteResultat.charges; track p.numero) {
                  <tr class="border-t border-gray-100 hover:bg-gray-50">
                    <td class="px-3 py-1.5 font-mono text-xs text-gray-500">{{ p.numero }}</td>
                    <td class="px-3 py-1.5 text-gray-800">{{ p.intitule }}</td>
                    <td class="px-3 py-1.5 text-right font-medium text-red-500">{{ fmt(p.montant) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
          ℹ {{ compteResultat.note }}
        </p>
      }

    </div>
  }

</div>
  `
})
export class ConsolidationComponent implements OnInit {

  private svc = inject(ConsolidationService);
  private cdr = inject(ChangeDetectorRef);

  view: View = 'groupes';
  etatTab: EtatTab = 'bilan';

  groupes: GroupeResponse[] = [];
  selectedGroupe: GroupeResponse | null = null;
  editGroupeId: string | null = null;

  exercice = new Date().getFullYear();
  bilan: BilanConsolide | null = null;
  compteResultat: CompteResultatConsolide | null = null;

  form: GroupeRequest = this.emptyForm();
  membresText = '';

  ngOnInit() { this.chargerGroupes(); }

  chargerGroupes() {
    this.svc.listGroupes().subscribe(g => {
      this.groupes = g;
      this.cdr.markForCheck();
    });
  }

  openFormGroupe(g?: GroupeResponse) {
    if (g) {
      this.editGroupeId = g.id;
      this.form = { nom: g.nom, description: g.description || '', membreIds: g.membres.map(m => m.entrepriseId) };
      this.membresText = g.membres.map(m => m.entrepriseId).join('\n');
    } else {
      this.editGroupeId = null;
      this.form = this.emptyForm();
      this.membresText = '';
    }
    this.view = 'form-groupe';
  }

  saveGroupe() {
    this.form.membreIds = this.membresText
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const obs = this.editGroupeId
      ? this.svc.updateGroupe(this.editGroupeId, this.form)
      : this.svc.createGroupe(this.form);

    obs.subscribe(() => {
      this.chargerGroupes();
      this.view = 'groupes';
    });
  }

  supprimerGroupe(id: string) {
    if (!confirm('Supprimer ce groupe ?')) return;
    this.svc.deleteGroupe(id).subscribe(() => this.chargerGroupes());
  }

  openEtats(g: GroupeResponse) {
    this.selectedGroupe = g;
    this.bilan = null;
    this.compteResultat = null;
    this.view = 'etats';
    this.chargerEtats();
  }

  chargerEtats() {
    if (!this.selectedGroupe) return;
    const id = this.selectedGroupe.id;

    this.svc.getBilan(id, this.exercice).subscribe(b => {
      this.bilan = b;
      this.cdr.markForCheck();
    });
    this.svc.getCompteResultat(id, this.exercice).subscribe(r => {
      this.compteResultat = r;
      this.cdr.markForCheck();
    });
  }

  fmt(n: number): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency', currency: 'XOF', maximumFractionDigits: 0
    }).format(n);
  }

  private emptyForm(): GroupeRequest {
    return { nom: '', description: '', membreIds: [] };
  }
}
