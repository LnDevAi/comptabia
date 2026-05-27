import {
  ChangeDetectionStrategy, Component, OnInit, signal, computed, inject
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DevisService } from '../../core/services/devis.service';
import { TiersService } from '../../core/services/tiers.service';
import { DevisResume, DevisDetail, DevisStatut, LigneDevisForm, DevisSaveRequest } from '../../core/models/devis.model';
import { Tiers } from '../../core/models/tiers.model';

type View = 'list' | 'form' | 'detail';

const STATUT_LABELS: Record<DevisStatut, string> = {
  BROUILLON: 'Brouillon', ENVOYE: 'Envoyé', ACCEPTE: 'Accepté', REFUSE: 'Refusé', EXPIRE: 'Expiré'
};
const STATUT_CLASSES: Record<DevisStatut, string> = {
  BROUILLON: 'bg-gray-100 text-gray-700',
  ENVOYE:    'bg-blue-100 text-blue-700',
  ACCEPTE:   'bg-green-100 text-green-700',
  REFUSE:    'bg-red-100 text-red-700',
  EXPIRE:    'bg-orange-100 text-orange-700',
};

@Component({
  selector: 'app-devis',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe, RouterLink],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Devis</h1>
      <p class="text-xs text-gray-400 mt-0.5">{{ totalElements() }} devis</p>
    </div>
    <div class="flex items-center gap-3">
      <select [ngModel]="filterStatut()" (ngModelChange)="filterStatut.set($event); loadList()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Tous les statuts</option>
        <option value="BROUILLON">Brouillon</option>
        <option value="ENVOYE">Envoyé</option>
        <option value="ACCEPTE">Accepté</option>
        <option value="REFUSE">Refusé</option>
        <option value="EXPIRE">Expiré</option>
      </select>
      <button (click)="openNew()"
              class="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
        + Nouveau devis
      </button>
    </div>
  </div>

  <!-- ── LIST ── -->
  @if (view() === 'list') {
    @if (loading()) {
      <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
    } @else if (devisList().length === 0) {
      <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Aucun devis</div>
    } @else {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-2.5 text-left">Numéro</th>
              <th class="px-4 py-2.5 text-left">Client</th>
              <th class="px-4 py-2.5 text-left">Objet</th>
              <th class="px-4 py-2.5 text-right">Date</th>
              <th class="px-4 py-2.5 text-right">Validité</th>
              <th class="px-4 py-2.5 text-right">Montant TTC</th>
              <th class="px-4 py-2.5 text-center">Statut</th>
              <th class="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (d of devisList(); track d.id) {
              <tr class="hover:bg-gray-50 cursor-pointer" (click)="openDetail(d.id)">
                <td class="px-4 py-3 font-mono text-xs font-medium text-gray-800">{{ d.numero }}</td>
                <td class="px-4 py-3 text-gray-800 max-w-[160px] truncate">{{ d.nomTiers || '—' }}</td>
                <td class="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">—</td>
                <td class="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                  {{ d.dateDevis | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-4 py-3 text-right text-xs whitespace-nowrap"
                    [class]="d.expire ? 'text-orange-600 font-semibold' : 'text-gray-500'">
                  {{ d.dateValidite ? (d.dateValidite | date:'dd/MM/yyyy') : '—' }}
                  @if (d.expire) { <span class="text-orange-500 text-xs ml-0.5">⚠</span> }
                </td>
                <td class="px-4 py-3 text-right font-mono text-xs font-semibold text-gray-800">
                  {{ d.montantTtc | number:'1.0-0' }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                        [class]="statutClass(d.statut)">
                    {{ statutLabel(d.statut) }}
                  </span>
                  @if (d.factureId) {
                    <span class="ml-1 text-xs text-green-600" title="Converti en facture">→ FAC</span>
                  }
                </td>
                <td class="px-4 py-3 text-right" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-1 text-xs">
                    @if (d.statut === 'BROUILLON') {
                      <button (click)="openEdit(d.id)" class="text-blue-600 hover:underline">Modifier</button>
                      <span class="text-gray-300">|</span>
                      <button (click)="doEnvoyer(d.id)" class="text-indigo-600 hover:underline">Envoyer</button>
                      <span class="text-gray-300">|</span>
                      <button (click)="doDelete(d.id)" class="text-red-500 hover:underline">Suppr.</button>
                    }
                    @if (d.statut === 'ENVOYE') {
                      <button (click)="doStatut(d.id, 'ACCEPTE')" class="text-green-600 hover:underline font-semibold">Accepté</button>
                      <span class="text-gray-300">|</span>
                      <button (click)="doStatut(d.id, 'REFUSE')" class="text-red-500 hover:underline">Refusé</button>
                    }
                    @if (d.statut === 'ACCEPTE' && !d.factureId) {
                      <button (click)="doConvertir(d.id)" class="text-green-700 hover:underline font-semibold">→ Facture</button>
                    }
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (totalPages() > 1) {
        <div class="flex items-center justify-center gap-2">
          <button (click)="goPage(currentPage() - 1)" [disabled]="currentPage() === 0"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40">←</button>
          <span class="text-sm text-gray-600">{{ currentPage() + 1 }} / {{ totalPages() }}</span>
          <button (click)="goPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40">→</button>
        </div>
      }
    }
  }

  <!-- ── FORM ── -->
  @if (view() === 'form') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold flex items-center justify-between">
        <span>{{ editingId() ? 'Modifier le devis' : 'Nouveau devis' }}</span>
        <button (click)="backToList()" class="text-gray-300 hover:text-white text-xs">✕ Annuler</button>
      </div>
      <div class="p-5 space-y-5">

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date *</label>
            <input type="date" [(ngModel)]="form.dateDevis"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Validité jusqu'au</label>
            <input type="date" [(ngModel)]="form.dateValidite"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-600 mb-1">Client (tiers)</label>
            <select [(ngModel)]="form.tiersId" (ngModelChange)="onTiersChange($event)"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Saisie libre —</option>
              @for (t of clients(); track t.id) {
                <option [value]="t.id">{{ t.nom }} ({{ t.code }})</option>
              }
            </select>
          </div>
        </div>

        @if (!form.tiersId) {
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Nom du client *</label>
              <input type="text" [(ngModel)]="form.nomTiers" placeholder="Nom du client"
                     class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
              <input type="text" [(ngModel)]="form.adresseTiers"
                     class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        }

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Objet du devis</label>
          <input type="text" [(ngModel)]="form.objet" placeholder="Description courte de la prestation…"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>

        <!-- Lignes -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Lignes</label>
            <button (click)="addLigne()" class="text-xs text-blue-600 hover:underline">+ Ajouter</button>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th class="px-3 py-2 text-left">Description</th>
                  <th class="px-3 py-2 text-right w-20">Qté</th>
                  <th class="px-3 py-2 text-right w-28">P.U. HT</th>
                  <th class="px-3 py-2 text-right w-20">TVA %</th>
                  <th class="px-3 py-2 text-right w-28">Compte</th>
                  <th class="px-3 py-2 text-right w-28">HT</th>
                  <th class="px-3 py-2 text-right w-28">TTC</th>
                  <th class="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (l of form.lignes; track l; let i = $index) {
                  <tr>
                    <td class="px-3 py-2">
                      <input type="text" [(ngModel)]="l.description" placeholder="Description"
                             class="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" [(ngModel)]="l.quantite" (ngModelChange)="recalcLigne(i)" min="0" step="0.001"
                             class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" [(ngModel)]="l.prixUnitaire" (ngModelChange)="recalcLigne(i)" min="0" step="0.01"
                             class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" [(ngModel)]="l.tauxTva" (ngModelChange)="recalcLigne(i)" min="0" max="99"
                             class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400">
                    </td>
                    <td class="px-3 py-2">
                      <input type="text" [(ngModel)]="l.compteProduit" placeholder="706"
                             class="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
                    </td>
                    <td class="px-3 py-2 text-right font-mono text-xs text-gray-700">
                      {{ lignesCalc[i]?.ht | number:'1.0-0' }}
                    </td>
                    <td class="px-3 py-2 text-right font-mono text-xs font-semibold">
                      {{ lignesCalc[i]?.ttc | number:'1.0-0' }}
                    </td>
                    <td class="px-3 py-2 text-center">
                      <button (click)="removeLigne(i)" class="text-red-400 hover:text-red-600 text-xs">✕</button>
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot class="bg-gray-800 text-white text-xs font-semibold">
                <tr>
                  <td class="px-3 py-2.5" colspan="5">Total</td>
                  <td class="px-3 py-2.5 text-right font-mono">{{ totalHt() | number:'1.0-0' }}</td>
                  <td class="px-3 py-2.5 text-right font-mono">{{ totalTtc() | number:'1.0-0' }}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Conditions / mentions</label>
          <textarea [(ngModel)]="form.conditions" rows="2" placeholder="Conditions de paiement, délais…"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        @if (formError()) {
          <p class="text-red-600 text-sm">{{ formError() }}</p>
        }

        <div class="flex items-center justify-end gap-3">
          <button (click)="backToList()"
                  class="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">Annuler</button>
          <button (click)="save()" [disabled]="saving()"
                  class="px-6 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {{ saving() ? 'Enregistrement…' : (editingId() ? 'Mettre à jour' : 'Créer le devis') }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ── DETAIL ── -->
  @if (view() === 'detail' && selected()) {
    <div class="space-y-4">
      <button (click)="backToList()" class="text-sm text-blue-600 hover:underline">← Retour</button>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="font-bold font-mono">{{ selected()!.numero }}</span>
            <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                  [class]="statutClass(selected()!.statut)">
              {{ statutLabel(selected()!.statut) }}
            </span>
            @if (selected()!.expire) {
              <span class="text-orange-300 text-xs">⚠ Expiré</span>
            }
          </div>
          <div class="flex items-center gap-2">
            @if (selected()!.statut === 'BROUILLON') {
              <button (click)="openEdit(selected()!.id)"
                      class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-xs rounded-lg">Modifier</button>
              <button (click)="doEnvoyer(selected()!.id)"
                      class="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-xs rounded-lg">Marquer envoyé</button>
            }
            @if (selected()!.statut === 'ENVOYE') {
              <button (click)="doStatut(selected()!.id, 'ACCEPTE')"
                      class="px-3 py-1 bg-green-600 hover:bg-green-700 text-xs rounded-lg font-semibold">Accepté</button>
              <button (click)="doStatut(selected()!.id, 'REFUSE')"
                      class="px-3 py-1 bg-red-600 hover:bg-red-700 text-xs rounded-lg">Refusé</button>
            }
            @if (selected()!.statut === 'ACCEPTE' && !selected()!.factureId) {
              <button (click)="doConvertir(selected()!.id)"
                      class="px-3 py-1 bg-green-700 hover:bg-green-800 text-xs rounded-lg font-bold">
                → Convertir en facture
              </button>
            }
            @if (selected()!.factureId) {
              <a [routerLink]="['/dashboard/facturation']"
                 class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-xs rounded-lg">
                Voir facture →
              </a>
            }
          </div>
        </div>
        <div class="p-5 space-y-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Client</p>
              <p class="font-semibold text-gray-800 mt-0.5">{{ selected()!.nomTiers || '—' }}</p>
              @if (selected()!.adresseTiers) {
                <p class="text-xs text-gray-500">{{ selected()!.adresseTiers }}</p>
              }
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Objet</p>
              <p class="font-medium text-gray-800 mt-0.5">{{ selected()!.objet || '—' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Date</p>
              <p class="font-medium text-gray-800 mt-0.5">{{ selected()!.dateDevis | date:'dd/MM/yyyy' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Validité</p>
              <p class="font-medium mt-0.5"
                 [class]="selected()!.expire ? 'text-orange-600 font-semibold' : 'text-gray-800'">
                {{ selected()!.dateValidite ? (selected()!.dateValidite | date:'dd/MM/yyyy') : '—' }}
              </p>
            </div>
          </div>

          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-2 text-left">Description</th>
                <th class="px-4 py-2 text-right">Qté</th>
                <th class="px-4 py-2 text-right">P.U. HT</th>
                <th class="px-4 py-2 text-right">TVA %</th>
                <th class="px-4 py-2 text-right">HT</th>
                <th class="px-4 py-2 text-right">TVA</th>
                <th class="px-4 py-2 text-right">TTC</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (l of selected()!.lignes; track l.id) {
                <tr>
                  <td class="px-4 py-2.5 text-gray-800">{{ l.description }}</td>
                  <td class="px-4 py-2.5 text-right font-mono text-xs">{{ l.quantite | number:'1.0-3' }}</td>
                  <td class="px-4 py-2.5 text-right font-mono text-xs">{{ l.prixUnitaire | number:'1.0-0' }}</td>
                  <td class="px-4 py-2.5 text-right text-gray-500 text-xs">{{ l.tauxTva }}%</td>
                  <td class="px-4 py-2.5 text-right font-mono text-xs">{{ l.montantHt | number:'1.0-0' }}</td>
                  <td class="px-4 py-2.5 text-right font-mono text-xs text-gray-500">{{ l.montantTva | number:'1.0-0' }}</td>
                  <td class="px-4 py-2.5 text-right font-mono text-xs font-semibold">{{ l.montantTtc | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
            <tfoot class="bg-gray-800 text-white text-xs font-semibold">
              <tr>
                <td class="px-4 py-2.5" colspan="4">Total</td>
                <td class="px-4 py-2.5 text-right font-mono">{{ selected()!.montantHt | number:'1.0-0' }}</td>
                <td class="px-4 py-2.5 text-right font-mono">{{ selected()!.montantTva | number:'1.0-0' }}</td>
                <td class="px-4 py-2.5 text-right font-mono">{{ selected()!.montantTtc | number:'1.0-0' }}</td>
              </tr>
            </tfoot>
          </table>

          @if (selected()!.conditions) {
            <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <p class="font-medium text-gray-700 mb-1">Conditions</p>{{ selected()!.conditions }}
            </div>
          }
        </div>
      </div>
    </div>
  }

</div>
  `
})
export class DevisComponent implements OnInit {

  private devisSvc = inject(DevisService);
  private tiersSvc = inject(TiersService);

  view         = signal<View>('list');
  loading      = signal(false);
  saving       = signal(false);
  formError    = signal<string | null>(null);

  devisList    = signal<DevisResume[]>([]);
  totalElements= signal(0);
  totalPages   = signal(0);
  currentPage  = signal(0);
  filterStatut = signal<DevisStatut | ''>('');

  clients      = signal<Tiers[]>([]);
  selected     = signal<DevisDetail | null>(null);
  editingId    = signal<string | null>(null);

  form: DevisSaveRequest & { dateValidite: string } = this.emptyForm();
  lignesCalc: { ht: number; tva: number; ttc: number }[] = [];

  totalHt  = computed(() => this.lignesCalc.reduce((s, l) => s + (l?.ht ?? 0), 0));
  totalTtc = computed(() => this.lignesCalc.reduce((s, l) => s + (l?.ttc ?? 0), 0));

  ngOnInit() { this.loadList(); this.loadClients(); }

  loadList() {
    this.loading.set(true);
    const statut = this.filterStatut() as DevisStatut | undefined;
    this.devisSvc.findAll(statut || undefined, this.currentPage()).subscribe({
      next: p => {
        this.devisList.set(p.content);
        this.totalElements.set(p.totalElements);
        this.totalPages.set(p.totalPages);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadClients() {
    this.tiersSvc.findAll({ type: 'CLIENT', actifOnly: true, page: 0, size: 200 }).subscribe({
      next: p => this.clients.set(p.content)
    });
  }

  goPage(p: number) { this.currentPage.set(p); this.loadList(); }

  openNew() {
    this.editingId.set(null);
    this.form = this.emptyForm();
    this.lignesCalc = [this.calcLigne(this.form.lignes[0])];
    this.formError.set(null);
    this.view.set('form');
  }

  openEdit(id: string) {
    this.devisSvc.findOne(id).subscribe(d => {
      this.editingId.set(id);
      this.form = {
        dateDevis:    d.dateDevis,
        dateValidite: d.dateValidite ?? '',
        tiersId:      d.tiersId ?? '',
        nomTiers:     d.nomTiers ?? '',
        adresseTiers: d.adresseTiers ?? '',
        objet:        d.objet ?? '',
        conditions:   d.conditions ?? '',
        lignes:       d.lignes.map(l => ({
          description: l.description, quantite: l.quantite, prixUnitaire: l.prixUnitaire,
          tauxTva: l.tauxTva, compteProduit: l.compteProduit, ordre: l.ordre
        }))
      };
      this.lignesCalc = this.form.lignes.map(l => this.calcLigne(l));
      this.formError.set(null);
      this.view.set('form');
    });
  }

  openDetail(id: string) {
    this.devisSvc.findOne(id).subscribe(d => {
      this.selected.set(d);
      this.view.set('detail');
    });
  }

  backToList() {
    this.view.set('list');
    this.selected.set(null);
    this.editingId.set(null);
  }

  onTiersChange(id: string) {
    const t = this.clients().find(c => c.id === id);
    if (t) { this.form.nomTiers = t.nom; this.form.adresseTiers = (t as any).adresse ?? ''; }
  }

  addLigne() {
    const l: LigneDevisForm = { description: '', quantite: 1, prixUnitaire: 0, tauxTva: 18, compteProduit: '706', ordre: this.form.lignes.length };
    this.form.lignes.push(l);
    this.lignesCalc.push(this.calcLigne(l));
  }

  removeLigne(i: number) { this.form.lignes.splice(i, 1); this.lignesCalc.splice(i, 1); }
  recalcLigne(i: number) { this.lignesCalc[i] = this.calcLigne(this.form.lignes[i]); }

  private calcLigne(l: LigneDevisForm) {
    const ht = (l.quantite ?? 0) * (l.prixUnitaire ?? 0);
    const tva = ht * (l.tauxTva ?? 0) / 100;
    return { ht: Math.round(ht * 100) / 100, tva: Math.round(tva * 100) / 100, ttc: Math.round((ht + tva) * 100) / 100 };
  }

  save() {
    if (!this.form.dateDevis) { this.formError.set('La date est obligatoire.'); return; }
    if (this.form.lignes.length === 0) { this.formError.set('Ajoutez au moins une ligne.'); return; }
    if (!this.form.tiersId && !this.form.nomTiers) { this.formError.set('Saisissez un client.'); return; }

    const req: DevisSaveRequest = {
      ...this.form,
      tiersId:      this.form.tiersId || null,
      dateValidite: this.form.dateValidite || null,
      lignes:       this.form.lignes.map((l, i) => ({ ...l, ordre: i }))
    };

    this.saving.set(true);
    this.formError.set(null);
    const obs = this.editingId()
        ? this.devisSvc.update(this.editingId()!, req)
        : this.devisSvc.create(req);

    obs.subscribe({
      next: () => { this.saving.set(false); this.loadList(); this.backToList(); },
      error: (e: any) => { this.formError.set(e?.error?.message ?? 'Erreur'); this.saving.set(false); }
    });
  }

  doEnvoyer(id: string) {
    this.devisSvc.envoyer(id).subscribe({ next: () => { this.loadList(); if (this.view() === 'detail') this.openDetail(id); } });
  }

  doStatut(id: string, statut: DevisStatut) {
    this.devisSvc.changerStatut(id, statut).subscribe({ next: () => { this.loadList(); if (this.view() === 'detail') this.openDetail(id); } });
  }

  doConvertir(id: string) {
    if (!confirm('Convertir ce devis en facture ?')) return;
    this.devisSvc.convertir(id).subscribe({
      next: f => { alert(`Facture ${f.numero} créée avec succès.`); this.loadList(); this.backToList(); },
      error: (e: any) => alert(e?.error?.message ?? 'Erreur')
    });
  }

  doDelete(id: string) {
    if (!confirm('Supprimer ce devis ?')) return;
    this.devisSvc.delete(id).subscribe({ next: () => this.loadList() });
  }

  statutLabel(s: DevisStatut): string { return STATUT_LABELS[s] ?? s; }
  statutClass(s: DevisStatut): string { return STATUT_CLASSES[s] ?? 'bg-gray-100 text-gray-700'; }

  private emptyForm(): DevisSaveRequest & { dateValidite: string } {
    return {
      dateDevis:    new Date().toISOString().substring(0, 10),
      dateValidite: '',
      tiersId:      '',
      nomTiers:     '',
      adresseTiers: '',
      objet:        '',
      conditions:   '',
      lignes:       [{ description: '', quantite: 1, prixUnitaire: 0, tauxTva: 18, compteProduit: '706', ordre: 0 }]
    };
  }
}
