import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject, signal
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PretService } from '../../core/services/pret.service';
import { AuthService } from '../../core/services/auth.service';
import {
  PretResponse, PretRequest, EcheanceResponse,
  TypePret, StatutPret,
  TYPE_PRET_LABELS, STATUT_PRET_LABELS, MOIS_LABELS
} from '../../core/models/pret.model';

const STATUT_CSS: Record<StatutPret, string> = {
  EN_ATTENTE: 'bg-amber-100 text-amber-700',
  APPROUVE:   'bg-blue-100 text-blue-700',
  EN_COURS:   'bg-indigo-100 text-indigo-700',
  SOLDE:      'bg-green-100 text-green-700',
  REFUSE:     'bg-red-100 text-red-700',
};

@Component({
  selector: 'app-prets',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Default,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Prêts & Avances sur salaire</h1>
      <p class="text-xs text-gray-400 mt-0.5">Demandes · Approbation · Suivi des remboursements</p>
    </div>
    @if (isAdmin) {
      <button (click)="openModal()" class="bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
        + Nouveau prêt / avance
      </button>
    }
  </div>

  <!-- Stats rapides -->
  @if (prets.length > 0) {
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      @for (stat of stats; track stat.label) {
        <div class="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm">
          <p class="text-xs text-gray-400">{{ stat.label }}</p>
          <p class="text-lg font-bold mt-0.5" [class]="stat.color">{{ stat.value }}</p>
        </div>
      }
    </div>
  }

  <!-- Liste des prêts -->
  @if (loading) {
    <p class="text-sm text-gray-400 text-center py-10">Chargement...</p>
  } @else if (prets.length === 0) {
    <div class="text-center py-16 text-gray-400">
      <div class="text-4xl mb-3">💳</div>
      <p class="text-sm">Aucun prêt ou avance enregistré.</p>
    </div>
  } @else {
    <div class="space-y-4">
      @for (p of prets; track p.id) {
        <div class="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <!-- En-tête prêt -->
          <div class="flex items-start justify-between gap-3">
            <div class="space-y-0.5">
              <div class="flex items-center gap-2">
                <span class="text-sm font-semibold text-gray-800">{{ p.collaborateurNom }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                      [class]="typeCss(p.typePret)">
                  {{ typeLabel(p.typePret) }}
                </span>
              </div>
              @if (p.motif) {
                <p class="text-xs text-gray-400">{{ p.motif }}</p>
              }
              <p class="text-xs text-gray-400">Début : {{ p.dateDebut | date:'dd/MM/yyyy' }}</p>
            </div>
            <div class="text-right space-y-1">
              <p class="text-base font-bold text-gray-800">{{ p.montant | number:'1.0-0' }} FCFA</p>
              <p class="text-xs text-gray-400">{{ p.nbEcheances }} × {{ p.montantEcheance | number:'1.0-0' }} FCFA</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium inline-block"
                    [class]="statutCss(p.statut)">
                {{ statutLabel(p.statut) }}
              </span>
            </div>
          </div>

          <!-- Barre de remboursement -->
          @if (p.statut === 'EN_COURS' || p.statut === 'SOLDE') {
            <div>
              <div class="flex justify-between text-xs text-gray-400 mb-1">
                <span>{{ p.nbPrelevees }} / {{ p.nbEcheances }} échéances prélevées</span>
                <span>{{ progressPret(p) }}%</span>
              </div>
              <div class="w-full bg-gray-100 rounded-full h-2">
                <div class="h-2 rounded-full transition-all"
                     [class]="p.statut === 'SOLDE' ? 'bg-green-500' : 'bg-indigo-500'"
                     [style.width]="progressPret(p) + '%'"></div>
              </div>
            </div>
          }

          <!-- Actions admin -->
          @if (isAdmin) {
            <div class="flex gap-2 pt-1 border-t border-gray-100 flex-wrap">
              @if (p.statut === 'EN_ATTENTE') {
                <button (click)="approuver(p)"
                        class="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg transition">
                  Approuver & générer échéances
                </button>
                <button (click)="refuser(p)"
                        class="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition">
                  Refuser
                </button>
                <button (click)="deletePret(p)"
                        class="text-xs text-gray-400 hover:text-red-500 ml-auto">Supprimer</button>
              }
              @if (p.statut === 'REFUSE') {
                <button (click)="deletePret(p)"
                        class="text-xs text-gray-400 hover:text-red-500">Supprimer</button>
              }
              @if (p.statut === 'EN_COURS') {
                <button (click)="toggleEcheances(p)"
                        class="text-xs bg-gray-50 text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition">
                  {{ expandedId === p.id ? 'Masquer' : 'Voir' }} les échéances
                </button>
              }
            </div>
          }

          <!-- Tableau des échéances -->
          @if (expandedId === p.id && p.echeances.length > 0) {
            <div class="border border-gray-100 rounded-xl overflow-hidden">
              <table class="w-full text-xs">
                <thead class="bg-gray-50 text-gray-500">
                  <tr>
                    <th class="px-3 py-2 text-left font-medium">N°</th>
                    <th class="px-3 py-2 text-left font-medium">Période</th>
                    <th class="px-3 py-2 text-right font-medium">Montant</th>
                    <th class="px-3 py-2 text-center font-medium">Statut</th>
                    @if (isAdmin) { <th class="px-3 py-2"></th> }
                  </tr>
                </thead>
                <tbody>
                  @for (e of p.echeances; track e.id) {
                    <tr class="border-t border-gray-100" [class]="e.statut === 'PRELEVE' ? 'bg-green-50' : ''">
                      <td class="px-3 py-2 text-gray-600">{{ e.numero }}</td>
                      <td class="px-3 py-2 text-gray-600">{{ moisLabel(e.mois) }} {{ e.annee }}</td>
                      <td class="px-3 py-2 text-right font-medium text-gray-800">{{ e.montant | number:'1.0-0' }}</td>
                      <td class="px-3 py-2 text-center">
                        @if (e.statut === 'PRELEVE') {
                          <span class="text-green-600">✓ Prélevé</span>
                        } @else {
                          <span class="text-gray-400">En attente</span>
                        }
                      </td>
                      @if (isAdmin) {
                        <td class="px-3 py-2 text-center">
                          @if (e.statut === 'EN_ATTENTE') {
                            <button (click)="prelevEcheance(p, e)"
                                    class="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-1 rounded transition">
                              Prélever
                            </button>
                          }
                        </td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }
    </div>
  }
</div>

<!-- Modal création -->
@if (showModal) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
      <h2 class="font-bold text-gray-800">Nouveau prêt / avance</h2>
      <div class="space-y-3">
        <div>
          <label class="block text-xs text-gray-500 mb-1">ID Collaborateur *</label>
          <input [(ngModel)]="form.collaborateurId" placeholder="UUID du collaborateur"
                 class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Type</label>
            <select [(ngModel)]="form.typePret"
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
              <option value="PRET">Prêt</option>
              <option value="AVANCE">Avance sur salaire</option>
            </select>
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Montant (FCFA) *</label>
            <input type="number" [(ngModel)]="form.montant" min="1"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs text-gray-500 mb-1">Nb échéances</label>
            <input type="number" [(ngModel)]="form.nbEcheances" min="1"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          </div>
          <div>
            <label class="block text-xs text-gray-500 mb-1">Date début</label>
            <input type="date" [(ngModel)]="form.dateDebut"
                   class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          </div>
        </div>
        @if (form.montant > 0 && form.nbEcheances > 0) {
          <p class="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2">
            Échéance mensuelle : <strong>{{ (form.montant / form.nbEcheances) | number:'1.0-0' }} FCFA</strong>
          </p>
        }
        <div>
          <label class="block text-xs text-gray-500 mb-1">Motif</label>
          <textarea [(ngModel)]="form.motif" rows="2" placeholder="Raison de la demande..."
                    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"></textarea>
        </div>
      </div>
      @if (error) { <p class="text-xs text-red-500">{{ error }}</p> }
      <div class="flex justify-end gap-3 pt-2">
        <button (click)="closeModal()" class="text-sm text-gray-500 hover:text-gray-700">Annuler</button>
        <button (click)="submit()" [disabled]="saving"
                class="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
          {{ saving ? 'Enregistrement...' : 'Créer la demande' }}
        </button>
      </div>
    </div>
  </div>
}
`,
})
export class PretsComponent implements OnInit {
  private svc  = inject(PretService);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  prets:   PretResponse[] = [];
  loading  = false;
  saving   = false;
  error    = '';
  showModal = false;
  expandedId: string | null = null;

  form: PretRequest = { collaborateurId: '', typePret: 'PRET', montant: 0, nbEcheances: 1, dateDebut: '' };

  get isAdmin() { return this.auth.user()?.role === 'ADMIN'; }

  get stats() {
    const enAttente = this.prets.filter(p => p.statut === 'EN_ATTENTE').length;
    const enCours   = this.prets.filter(p => p.statut === 'EN_COURS').length;
    const soldes    = this.prets.filter(p => p.statut === 'SOLDE').length;
    const totalEnCours = this.prets
      .filter(p => p.statut === 'EN_COURS')
      .reduce((s, p) => s + (p.nbEcheances - p.nbPrelevees) * p.montantEcheance, 0);
    return [
      { label: 'En attente', value: enAttente, color: 'text-amber-600' },
      { label: 'En cours',   value: enCours,   color: 'text-indigo-600' },
      { label: 'Soldés',     value: soldes,     color: 'text-green-600' },
      { label: 'Restant dû', value: totalEnCours.toLocaleString('fr-FR') + ' FCFA', color: 'text-red-500' },
    ];
  }

  ngOnInit() { this.load(); }

  private load() {
    this.loading = true;
    this.svc.findAll().subscribe({
      next: d => { this.prets = d; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  progressPret(p: PretResponse) {
    return p.nbEcheances === 0 ? 0 : Math.round((p.nbPrelevees / p.nbEcheances) * 100);
  }

  typeCss(t: TypePret) { return t === 'AVANCE' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'; }
  typeLabel(t: TypePret)     { return TYPE_PRET_LABELS[t]; }
  statutCss(s: StatutPret)   { return STATUT_CSS[s]; }
  statutLabel(s: StatutPret) { return STATUT_PRET_LABELS[s]; }
  moisLabel(m: number)       { return MOIS_LABELS[m] ?? m; }

  toggleEcheances(p: PretResponse) {
    this.expandedId = this.expandedId === p.id ? null : p.id;
  }

  openModal()  { this.error = ''; this.form = { collaborateurId: '', typePret: 'PRET', montant: 0, nbEcheances: 1, dateDebut: '' }; this.showModal = true; }
  closeModal() { this.showModal = false; }

  submit() {
    if (!this.form.collaborateurId.trim()) { this.error = 'ID collaborateur obligatoire.'; return; }
    if (this.form.montant <= 0)            { this.error = 'Montant invalide.'; return; }
    if (!this.form.dateDebut)              { this.error = 'Date de début obligatoire.'; return; }
    this.saving = true; this.error = '';
    this.svc.create(this.form).subscribe({
      next: p => { this.prets.unshift(p); this.saving = false; this.showModal = false; this.cdr.markForCheck(); },
      error: () => { this.saving = false; this.error = 'Erreur lors de la création.'; }
    });
  }

  approuver(p: PretResponse) {
    this.svc.approuver(p.id).subscribe({
      next: updated => { this.updatePret(updated); this.expandedId = updated.id; }
    });
  }

  refuser(p: PretResponse) {
    if (!confirm(`Refuser le prêt de ${p.collaborateurNom} ?`)) return;
    this.svc.refuser(p.id).subscribe({ next: updated => this.updatePret(updated) });
  }

  deletePret(p: PretResponse) {
    if (!confirm(`Supprimer la demande de ${p.collaborateurNom} ?`)) return;
    this.svc.delete(p.id).subscribe({ next: () => { this.prets = this.prets.filter(x => x.id !== p.id); this.cdr.markForCheck(); } });
  }

  prelevEcheance(p: PretResponse, e: EcheanceResponse) {
    this.svc.prelevEcheance(p.id, e.id).subscribe({ next: updated => this.updatePret(updated) });
  }

  private updatePret(updated: PretResponse) {
    const idx = this.prets.findIndex(x => x.id === updated.id);
    if (idx >= 0) this.prets[idx] = updated;
    this.cdr.markForCheck();
  }
}
