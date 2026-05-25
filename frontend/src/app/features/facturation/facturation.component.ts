import {
  ChangeDetectionStrategy, Component, OnInit, signal, computed, inject
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FactureService } from '../../core/services/facture.service';
import { TiersService } from '../../core/services/tiers.service';
import {
  FactureResume, FactureDetail, FactureStatut, LigneFactureForm, FactureCreateRequest
} from '../../core/models/facture.model';
import { Tiers } from '../../core/models/tiers.model';

type View = 'list' | 'form' | 'detail' | 'payer';

const STATUT_LABELS: Record<FactureStatut, string> = {
  BROUILLON: 'Brouillon', EMISE: 'Émise', PAYEE: 'Payée', ANNULEE: 'Annulée'
};
const STATUT_CLASSES: Record<FactureStatut, string> = {
  BROUILLON: 'bg-gray-100 text-gray-700',
  EMISE:     'bg-blue-100 text-blue-700',
  PAYEE:     'bg-green-100 text-green-700',
  ANNULEE:   'bg-red-100 text-red-700',
};

@Component({
  selector: 'app-facturation',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  template: `
<div class="p-6 space-y-5">

  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-xl font-bold text-gray-800">Facturation clients</h1>
      <p class="text-xs text-gray-400 mt-0.5">
        {{ totalElements() }} facture{{ totalElements() !== 1 ? 's' : '' }}
      </p>
    </div>
    <div class="flex items-center gap-3">
      <select [ngModel]="filterStatut()" (ngModelChange)="filterStatut.set($event); loadList()"
              class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="">Tous les statuts</option>
        <option value="BROUILLON">Brouillon</option>
        <option value="EMISE">Émise</option>
        <option value="PAYEE">Payée</option>
        <option value="ANNULEE">Annulée</option>
      </select>
      <button (click)="openNew()"
              class="px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
        + Nouvelle facture
      </button>
    </div>
  </div>

  <!-- ── LIST VIEW ── -->
  @if (view() === 'list') {
    @if (loading()) {
      <div class="flex items-center justify-center h-48 text-gray-400 text-sm">Chargement…</div>
    } @else if (factures().length === 0) {
      <div class="flex items-center justify-center h-48 text-gray-400 text-sm">
        Aucune facture
      </div>
    } @else {
      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th class="px-4 py-2.5 text-left">Numéro</th>
              <th class="px-4 py-2.5 text-left">Client</th>
              <th class="px-4 py-2.5 text-right">Date</th>
              <th class="px-4 py-2.5 text-right">Échéance</th>
              <th class="px-4 py-2.5 text-right">Montant HT</th>
              <th class="px-4 py-2.5 text-right">TVA</th>
              <th class="px-4 py-2.5 text-right">TTC</th>
              <th class="px-4 py-2.5 text-center">Statut</th>
              <th class="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            @for (f of factures(); track f.id) {
              <tr class="hover:bg-gray-50 cursor-pointer" (click)="openDetail(f.id)">
                <td class="px-4 py-3 font-mono text-xs text-gray-800 font-medium">{{ f.numero }}</td>
                <td class="px-4 py-3 text-gray-800 max-w-[180px] truncate">
                  {{ f.nomTiers || '—' }}
                </td>
                <td class="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                  {{ f.dateFacture | date:'dd/MM/yyyy' }}
                </td>
                <td class="px-4 py-3 text-right text-xs whitespace-nowrap"
                    [class]="f.enRetard ? 'text-red-600 font-semibold' : 'text-gray-500'">
                  {{ f.dateEcheance ? (f.dateEcheance | date:'dd/MM/yyyy') : '—' }}
                  @if (f.enRetard) { <span class="ml-1 text-xs text-red-500">⚠</span> }
                </td>
                <td class="px-4 py-3 text-right font-mono text-xs">{{ f.montantHt | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-mono text-xs text-gray-500">{{ f.montantTva | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-right font-mono text-xs font-semibold text-gray-800">{{ f.montantTtc | number:'1.0-0' }}</td>
                <td class="px-4 py-3 text-center">
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold"
                        [class]="statutClass(f.statut)">
                    {{ statutLabel(f.statut) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right" (click)="$event.stopPropagation()">
                  <div class="flex items-center justify-end gap-1">
                    @if (f.statut === 'BROUILLON') {
                      <button (click)="openEdit(f.id)"
                              class="text-xs text-blue-600 hover:underline">Modifier</button>
                      <span class="text-gray-300">|</span>
                      <button (click)="doEmettre(f.id)"
                              class="text-xs text-green-600 hover:underline">Émettre</button>
                      <span class="text-gray-300">|</span>
                      <button (click)="doDelete(f.id)"
                              class="text-xs text-red-500 hover:underline">Suppr.</button>
                    }
                    @if (f.statut === 'EMISE') {
                      <button (click)="openPayer(f.id)"
                              class="text-xs text-green-600 hover:underline font-semibold">Payer</button>
                      <span class="text-gray-300">|</span>
                      <button (click)="doAnnuler(f.id)"
                              class="text-xs text-red-500 hover:underline">Annuler</button>
                    }
                    @if (f.statut === 'BROUILLON' || f.statut === 'EMISE') {
                      <span class="text-gray-300">|</span>
                    }
                    <button (click)="openDetail(f.id)"
                            class="text-xs text-gray-500 hover:underline">Détail</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex items-center justify-center gap-2">
          <button (click)="goPage(currentPage() - 1)" [disabled]="currentPage() === 0"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40">←</button>
          <span class="text-sm text-gray-600">Page {{ currentPage() + 1 }} / {{ totalPages() }}</span>
          <button (click)="goPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1"
                  class="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-40">→</button>
        </div>
      }
    }
  }

  <!-- ── FORM VIEW (create / edit) ── -->
  @if (view() === 'form') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold flex items-center justify-between">
        <span>{{ editingId() ? 'Modifier la facture' : 'Nouvelle facture' }}</span>
        <button (click)="backToList()" class="text-gray-300 hover:text-white text-xs">✕ Annuler</button>
      </div>
      <div class="p-5 space-y-5">

        <!-- Infos générales -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Date *</label>
            <input type="date" [(ngModel)]="form.dateFacture"
                   class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Échéance</label>
            <input type="date" [(ngModel)]="form.dateEcheance"
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

        <!-- Nom / adresse libre si pas de tiers lié -->
        @if (!form.tiersId) {
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Nom du client *</label>
              <input type="text" [(ngModel)]="form.nomTiers" placeholder="Nom du client"
                     class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
              <input type="text" [(ngModel)]="form.adresseTiers" placeholder="Adresse (optionnel)"
                     class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        }

        <!-- Lignes -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-xs font-semibold text-gray-600 uppercase tracking-wide">Lignes de facturation</label>
            <button (click)="addLigne()"
                    class="text-xs text-blue-600 hover:underline">+ Ajouter une ligne</button>
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
                  <th class="px-3 py-2 text-right w-28">Montant HT</th>
                  <th class="px-3 py-2 text-right w-28">TTC</th>
                  <th class="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100">
                @for (l of form.lignes; track $index; let i = $index) {
                  <tr>
                    <td class="px-3 py-2">
                      <input type="text" [(ngModel)]="l.description" placeholder="Description"
                             class="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" [(ngModel)]="l.quantite" (ngModelChange)="recalcLigne(i)"
                             min="0" step="0.001"
                             class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" [(ngModel)]="l.prixUnitaire" (ngModelChange)="recalcLigne(i)"
                             min="0" step="0.01"
                             class="w-full border border-gray-200 rounded px-2 py-1 text-xs text-right focus:outline-none focus:ring-1 focus:ring-blue-400">
                    </td>
                    <td class="px-3 py-2">
                      <input type="number" [(ngModel)]="l.tauxTva" (ngModelChange)="recalcLigne(i)"
                             min="0" max="99" step="0.1"
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

        <!-- Notes -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Notes / mentions</label>
          <textarea [(ngModel)]="form.notes" rows="2" placeholder="Conditions de paiement, notes…"
                    class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        @if (formError()) {
          <p class="text-red-600 text-sm">{{ formError() }}</p>
        }

        <div class="flex items-center justify-end gap-3">
          <button (click)="backToList()"
                  class="px-4 py-1.5 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button (click)="save()" [disabled]="saving()"
                  class="px-6 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {{ saving() ? 'Enregistrement…' : (editingId() ? 'Mettre à jour' : 'Créer la facture') }}
          </button>
        </div>
      </div>
    </div>
  }

  <!-- ── DETAIL VIEW ── -->
  @if (view() === 'detail' && selectedFacture()) {
    <div class="space-y-4">
      <button (click)="backToList()" class="text-sm text-blue-600 hover:underline">← Retour à la liste</button>

      <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div class="bg-gray-800 text-white px-5 py-3 flex items-center justify-between">
          <div>
            <span class="font-bold font-mono">{{ selectedFacture()!.numero }}</span>
            <span class="ml-3 px-2 py-0.5 rounded-full text-xs font-semibold"
                  [class]="statutClass(selectedFacture()!.statut)">
              {{ statutLabel(selectedFacture()!.statut) }}
            </span>
          </div>
          <div class="flex items-center gap-2">
            @if (selectedFacture()!.statut === 'BROUILLON') {
              <button (click)="openEdit(selectedFacture()!.id)"
                      class="px-3 py-1 bg-gray-600 hover:bg-gray-500 text-xs rounded-lg">Modifier</button>
              <button (click)="doEmettre(selectedFacture()!.id)"
                      class="px-3 py-1 bg-green-600 hover:bg-green-700 text-xs rounded-lg">Émettre</button>
            }
            @if (selectedFacture()!.statut === 'EMISE') {
              <button (click)="openPayer(selectedFacture()!.id)"
                      class="px-3 py-1 bg-green-600 hover:bg-green-700 text-xs rounded-lg font-semibold">Enregistrer paiement</button>
              <button (click)="doAnnuler(selectedFacture()!.id)"
                      class="px-3 py-1 bg-red-600 hover:bg-red-700 text-xs rounded-lg">Annuler</button>
            }
          </div>
        </div>
        <div class="p-5 space-y-4">
          <!-- Infos client -->
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Client</p>
              <p class="font-semibold text-gray-800 mt-0.5">{{ selectedFacture()!.nomTiers || '—' }}</p>
              @if (selectedFacture()!.adresseTiers) {
                <p class="text-xs text-gray-500 mt-0.5">{{ selectedFacture()!.adresseTiers }}</p>
              }
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Date</p>
              <p class="font-medium text-gray-800 mt-0.5">{{ selectedFacture()!.dateFacture | date:'dd/MM/yyyy' }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 uppercase tracking-wide">Échéance</p>
              <p class="font-medium mt-0.5"
                 [class]="selectedFacture()!.enRetard ? 'text-red-600 font-semibold' : 'text-gray-800'">
                {{ selectedFacture()!.dateEcheance ? (selectedFacture()!.dateEcheance | date:'dd/MM/yyyy') : '—' }}
                @if (selectedFacture()!.enRetard) { <span class="text-red-500 text-xs"> — EN RETARD</span> }
              </p>
            </div>
          </div>

          <!-- Lignes -->
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th class="px-4 py-2 text-left">Description</th>
                <th class="px-4 py-2 text-right">Qté</th>
                <th class="px-4 py-2 text-right">P.U. HT</th>
                <th class="px-4 py-2 text-right">TVA %</th>
                <th class="px-4 py-2 text-right">Montant HT</th>
                <th class="px-4 py-2 text-right">TVA</th>
                <th class="px-4 py-2 text-right">TTC</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              @for (l of selectedFacture()!.lignes; track l.id) {
                <tr>
                  <td class="px-4 py-2.5 text-gray-800">{{ l.description }}</td>
                  <td class="px-4 py-2.5 text-right text-gray-600 font-mono text-xs">{{ l.quantite | number:'1.0-3' }}</td>
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
                <td class="px-4 py-2.5 text-right font-mono">{{ selectedFacture()!.montantHt | number:'1.0-0' }}</td>
                <td class="px-4 py-2.5 text-right font-mono">{{ selectedFacture()!.montantTva | number:'1.0-0' }}</td>
                <td class="px-4 py-2.5 text-right font-mono">{{ selectedFacture()!.montantTtc | number:'1.0-0' }}</td>
              </tr>
            </tfoot>
          </table>

          @if (selectedFacture()!.notes) {
            <div class="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
              <p class="font-medium text-gray-700 mb-1">Notes</p>
              {{ selectedFacture()!.notes }}
            </div>
          }
        </div>
      </div>
    </div>
  }

  <!-- ── PAYER VIEW ── -->
  @if (view() === 'payer') {
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-md">
      <div class="bg-gray-800 text-white px-4 py-2.5 text-sm font-semibold flex items-center justify-between">
        <span>Enregistrer le paiement</span>
        <button (click)="backToList()" class="text-gray-300 hover:text-white text-xs">✕</button>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Date de règlement *</label>
          <input type="date" [(ngModel)]="payForm.dateReglement"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">Compte bancaire (ex : 521)</label>
          <input type="text" [(ngModel)]="payForm.compteReglement" placeholder="521"
                 class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        @if (formError()) {
          <p class="text-red-600 text-sm">{{ formError() }}</p>
        }
        <div class="flex gap-3 justify-end">
          <button (click)="backToList()" class="px-4 py-1.5 border border-gray-300 text-sm rounded-lg">Annuler</button>
          <button (click)="confirmPayer()" [disabled]="saving()"
                  class="px-6 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50">
            {{ saving() ? '…' : 'Confirmer' }}
          </button>
        </div>
      </div>
    </div>
  }

</div>
  `
})
export class FacturationComponent implements OnInit {

  private factureSvc = inject(FactureService);
  private tiersSvc   = inject(TiersService);

  view          = signal<View>('list');
  loading       = signal(false);
  saving        = signal(false);
  formError     = signal<string | null>(null);

  factures      = signal<FactureResume[]>([]);
  totalElements = signal(0);
  totalPages    = signal(0);
  currentPage   = signal(0);
  filterStatut  = signal<FactureStatut | ''>('');

  clients       = signal<Tiers[]>([]);
  selectedFacture = signal<FactureDetail | null>(null);
  editingId     = signal<string | null>(null);
  payingId      = signal<string | null>(null);

  form: FactureCreateRequest & { dateEcheance: string } = this.emptyForm();
  lignesCalc: { ht: number; tva: number; ttc: number }[] = [];

  payForm = { dateReglement: new Date().toISOString().substring(0, 10), compteReglement: '521' };

  totalHt = computed(() => this.lignesCalc.reduce((s, l) => s + (l?.ht ?? 0), 0));
  totalTtc = computed(() => this.lignesCalc.reduce((s, l) => s + (l?.ttc ?? 0), 0));

  ngOnInit() {
    this.loadList();
    this.loadClients();
  }

  loadList() {
    this.loading.set(true);
    const statut = this.filterStatut() as FactureStatut | undefined;
    this.factureSvc.findAll(statut || undefined, this.currentPage()).subscribe({
      next: p => {
        this.factures.set(p.content);
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
    this.factureSvc.findOne(id).subscribe(f => {
      this.editingId.set(id);
      this.form = {
        dateFacture:   f.dateFacture,
        dateEcheance:  f.dateEcheance ?? '',
        tiersId:       f.tiersId ?? '',
        nomTiers:      f.nomTiers ?? '',
        adresseTiers:  f.adresseTiers ?? '',
        notes:         f.notes ?? '',
        lignes:        f.lignes.map(l => ({
          description:   l.description,
          quantite:      l.quantite,
          prixUnitaire:  l.prixUnitaire,
          tauxTva:       l.tauxTva,
          compteProduit: l.compteProduit,
          ordre:         l.ordre
        }))
      };
      this.lignesCalc = this.form.lignes.map(l => this.calcLigne(l));
      this.formError.set(null);
      this.view.set('form');
    });
  }

  openDetail(id: string) {
    this.factureSvc.findOne(id).subscribe(f => {
      this.selectedFacture.set(f);
      this.view.set('detail');
    });
  }

  openPayer(id: string) {
    this.payingId.set(id);
    this.payForm = { dateReglement: new Date().toISOString().substring(0, 10), compteReglement: '521' };
    this.formError.set(null);
    this.view.set('payer');
  }

  backToList() {
    this.view.set('list');
    this.selectedFacture.set(null);
    this.editingId.set(null);
    this.payingId.set(null);
  }

  onTiersChange(id: string) {
    const t = this.clients().find(c => c.id === id);
    if (t) {
      this.form.nomTiers = t.nom;
      this.form.adresseTiers = (t as any).adresse ?? '';
    }
  }

  addLigne() {
    const l: LigneFactureForm = { description: '', quantite: 1, prixUnitaire: 0, tauxTva: 18, compteProduit: '706', ordre: this.form.lignes.length };
    this.form.lignes.push(l);
    this.lignesCalc.push(this.calcLigne(l));
  }

  removeLigne(i: number) {
    this.form.lignes.splice(i, 1);
    this.lignesCalc.splice(i, 1);
  }

  recalcLigne(i: number) {
    this.lignesCalc[i] = this.calcLigne(this.form.lignes[i]);
  }

  private calcLigne(l: LigneFactureForm) {
    const ht = (l.quantite ?? 0) * (l.prixUnitaire ?? 0);
    const tva = ht * (l.tauxTva ?? 0) / 100;
    return { ht: Math.round(ht * 100) / 100, tva: Math.round(tva * 100) / 100, ttc: Math.round((ht + tva) * 100) / 100 };
  }

  save() {
    if (!this.form.dateFacture) { this.formError.set('La date est obligatoire.'); return; }
    if (this.form.lignes.length === 0) { this.formError.set('Ajoutez au moins une ligne.'); return; }
    if (!this.form.tiersId && !this.form.nomTiers) { this.formError.set('Saisissez un client.'); return; }

    const req: FactureCreateRequest = {
      ...this.form,
      tiersId:      this.form.tiersId || null,
      dateEcheance: this.form.dateEcheance || null,
      lignes:       this.form.lignes.map((l, i) => ({ ...l, ordre: i }))
    };

    this.saving.set(true);
    this.formError.set(null);
    const obs = this.editingId()
        ? this.factureSvc.update(this.editingId()!, req)
        : this.factureSvc.create(req);

    obs.subscribe({
      next: () => { this.saving.set(false); this.loadList(); this.backToList(); },
      error: (e: any) => { this.formError.set(e?.error?.message ?? 'Erreur'); this.saving.set(false); }
    });
  }

  doEmettre(id: string) {
    this.factureSvc.emettre(id).subscribe({
      next: () => this.loadList(),
      error: (e: any) => alert(e?.error?.message ?? 'Erreur')
    });
  }

  doDelete(id: string) {
    if (!confirm('Supprimer cette facture ?')) return;
    this.factureSvc.delete(id).subscribe({ next: () => this.loadList() });
  }

  doAnnuler(id: string) {
    if (!confirm('Annuler cette facture ?')) return;
    this.factureSvc.annuler(id).subscribe({ next: () => this.loadList() });
  }

  confirmPayer() {
    if (!this.payForm.dateReglement) { this.formError.set('Date obligatoire'); return; }
    this.saving.set(true);
    this.factureSvc.payer(this.payingId()!, this.payForm).subscribe({
      next: () => { this.saving.set(false); this.loadList(); this.backToList(); },
      error: (e: any) => { this.formError.set(e?.error?.message ?? 'Erreur'); this.saving.set(false); }
    });
  }

  statutLabel(s: FactureStatut): string { return STATUT_LABELS[s] ?? s; }
  statutClass(s: FactureStatut): string { return STATUT_CLASSES[s] ?? 'bg-gray-100 text-gray-700'; }

  private emptyForm(): FactureCreateRequest & { dateEcheance: string } {
    return {
      dateFacture:  new Date().toISOString().substring(0, 10),
      dateEcheance: '',
      tiersId:      '',
      nomTiers:     '',
      adresseTiers: '',
      notes:        '',
      lignes:       [{ description: '', quantite: 1, prixUnitaire: 0, tauxTva: 18, compteProduit: '706', ordre: 0 }]
    };
  }
}
