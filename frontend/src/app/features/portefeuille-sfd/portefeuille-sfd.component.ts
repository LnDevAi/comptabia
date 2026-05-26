import {
  ChangeDetectionStrategy, Component, OnInit, signal, computed
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CreditSfdService } from '../../core/services/credit-sfd.service';
import {
  CreditSfdResponse, CreditSfdDashboard, StatutCredit, TypeCredit,
  TYPES_CREDIT, STATUTS_CREDIT
} from '../../core/models/credit-sfd.model';

@Component({
  selector: 'app-portefeuille-sfd',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, DecimalPipe],
  template: `
<div class="p-6 space-y-6">

  <!-- En-tête -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Portefeuille Crédits SFD</h1>
      <p class="text-sm text-gray-500 mt-1">Gestion du portefeuille — Ratios prudentiels BCEAO/UMOA</p>
    </div>
    <button (click)="ouvrirModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
      + Nouveau crédit
    </button>
  </div>

  <!-- Dashboard ratios -->
  @if (dashboard()) {
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <p class="text-xs text-gray-500">Encours total actif</p>
        <p class="text-xl font-bold text-gray-900 mt-1">{{ dashboard()!.encoursTotalActif | number:'1.0-0' }}</p>
        <p class="text-xs text-gray-400">{{ dashboard()!.nbCredits }} crédits</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border" [class]="ratioClass(dashboard()!.ratioPAR30, 5, false)">
        <p class="text-xs text-gray-500">PAR 30</p>
        <p class="text-xl font-bold mt-1">{{ dashboard()!.ratioPAR30 | number:'1.2-2' }}%</p>
        <p class="text-xs opacity-70">Seuil BCEAO ≤ 5%</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border" [class]="ratioClass(dashboard()!.ratioPAR90, 3, false)">
        <p class="text-xs text-gray-500">PAR 90</p>
        <p class="text-xl font-bold mt-1">{{ dashboard()!.ratioPAR90 | number:'1.2-2' }}%</p>
        <p class="text-xs opacity-70">Crédits douteux</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border" [class]="ratioClass(dashboard()!.car, 10, true)">
        <p class="text-xs text-gray-500">CAR (Fonds propres)</p>
        <p class="text-xl font-bold mt-1">{{ dashboard()!.car | number:'1.2-2' }}%</p>
        <p class="text-xs opacity-70">Seuil BCEAO ≥ 10%</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <p class="text-xs text-gray-500">PNB</p>
        <p class="text-xl font-bold text-gray-900 mt-1">{{ dashboard()!.pnb | number:'1.0-0' }}</p>
        <p class="text-xs text-gray-400">Produit Net Bancaire</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <p class="text-xs text-gray-500">ROA</p>
        <p class="text-xl font-bold text-gray-900 mt-1">{{ dashboard()!.roa | number:'1.2-2' }}%</p>
        <p class="text-xs text-gray-400">Résultat / Actif total</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border">
        <p class="text-xs text-gray-500">ROE</p>
        <p class="text-xl font-bold text-gray-900 mt-1">{{ dashboard()!.roe | number:'1.2-2' }}%</p>
        <p class="text-xs text-gray-400">Résultat / Fonds propres</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border" [class]="ratioClass(dashboard()!.exploitation, 70, false)">
        <p class="text-xs text-gray-500">Coeff. exploitation</p>
        <p class="text-xl font-bold mt-1">{{ dashboard()!.exploitation | number:'1.2-2' }}%</p>
        <p class="text-xs opacity-70">Seuil ≤ 70%</p>
      </div>
    </div>

    <!-- Répartition par type -->
    @if (dashboard()!.repartitionParType.length > 0) {
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div class="px-4 py-3 border-b bg-gray-50">
          <h2 class="text-sm font-semibold text-gray-700">Répartition par type de crédit</h2>
        </div>
        <table class="w-full text-sm">
          <thead><tr class="bg-gray-50 text-xs text-gray-500 uppercase">
            <th class="px-4 py-2 text-left">Type</th>
            <th class="px-4 py-2 text-right">Nb crédits</th>
            <th class="px-4 py-2 text-right">Encours</th>
            <th class="px-4 py-2 text-right">%</th>
          </tr></thead>
          <tbody>
            @for (r of dashboard()!.repartitionParType; track r.typeCredit) {
              <tr class="border-t hover:bg-gray-50">
                <td class="px-4 py-2 font-medium">{{ r.typeCreditLabel }}</td>
                <td class="px-4 py-2 text-right">{{ r.nbCredits }}</td>
                <td class="px-4 py-2 text-right">{{ r.encours | number:'1.0-0' }}</td>
                <td class="px-4 py-2 text-right font-semibold">{{ r.pourcentage | number:'1.1-1' }}%</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  }

  <!-- Liste des crédits -->
  <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
    <div class="px-4 py-3 border-b bg-gray-50">
      <h2 class="text-sm font-semibold text-gray-700">Portefeuille de crédits ({{ credits().length }})</h2>
    </div>
    @if (credits().length === 0) {
      <p class="text-center text-gray-400 py-12 text-sm">Aucun crédit enregistré.</p>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead><tr class="bg-gray-50 text-xs text-gray-500 uppercase">
            <th class="px-3 py-2 text-left">N° / Client</th>
            <th class="px-3 py-2 text-right">Accordé</th>
            <th class="px-3 py-2 text-right">Encours</th>
            <th class="px-3 py-2 text-right">Jours retard</th>
            <th class="px-3 py-2 text-left">Type</th>
            <th class="px-3 py-2 text-left">Statut</th>
            <th class="px-3 py-2 text-left">Débloqué</th>
            <th class="px-3 py-2 text-left">Échéance</th>
            <th class="px-3 py-2"></th>
          </tr></thead>
          <tbody>
            @for (c of credits(); track c.id) {
              <tr class="border-t hover:bg-gray-50">
                <td class="px-3 py-2">
                  <p class="font-medium text-gray-900">{{ c.nomClient }}</p>
                  <p class="text-xs text-gray-400">{{ c.numeroCredit ?? '—' }}</p>
                </td>
                <td class="px-3 py-2 text-right">{{ c.montantAccorde | number:'1.0-0' }}</td>
                <td class="px-3 py-2 text-right font-semibold">{{ c.montantEncours | number:'1.0-0' }}</td>
                <td class="px-3 py-2 text-right" [class]="retardClass(c.joursRetard)">{{ c.joursRetard }}</td>
                <td class="px-3 py-2 text-xs">{{ c.typeCreditLabel }}</td>
                <td class="px-3 py-2">
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium" [class]="statutBadge(c.statut)">
                    {{ c.statutLabel }}
                  </span>
                </td>
                <td class="px-3 py-2 text-xs text-gray-500">{{ c.dateDeblocage }}</td>
                <td class="px-3 py-2 text-xs text-gray-500">{{ c.dateEcheance ?? '—' }}</td>
                <td class="px-3 py-2">
                  <div class="flex gap-1">
                    <button (click)="ouvrirModal(c)" class="text-blue-600 hover:text-blue-800 text-xs">Modifier</button>
                    <button (click)="confirmerSuppression(c)" class="text-red-500 hover:text-red-700 text-xs">Suppr.</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  </div>

</div>

<!-- Modal Créer / Modifier -->
@if (modalOuvert()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg">
      <div class="px-6 py-4 border-b flex justify-between items-center">
        <h2 class="font-semibold text-gray-900">{{ creditEnEdition() ? 'Modifier le crédit' : 'Nouveau crédit' }}</h2>
        <button (click)="fermerModal()" class="text-gray-400 hover:text-gray-600 text-xl">×</button>
      </div>
      <form [formGroup]="form" (ngSubmit)="sauvegarder()" class="px-6 py-4 space-y-3">
        @if (!creditEnEdition()) {
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Nom client *</label>
              <input formControlName="nomClient" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">N° crédit</label>
              <input formControlName="numeroCredit" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Montant accordé *</label>
              <input type="number" formControlName="montantAccorde" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Montant encours</label>
              <input type="number" formControlName="montantEncours" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Date déblocage *</label>
              <input type="date" formControlName="dateDeblocage" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Date échéance</label>
              <input type="date" formControlName="dateEcheance" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Type de crédit</label>
              <select formControlName="typeCredit" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                @for (t of typesCredit; track t.value) {
                  <option [value]="t.value">{{ t.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Jours de retard</label>
              <input type="number" formControlName="joursRetard" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        } @else {
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Montant encours</label>
              <input type="number" formControlName="montantEncours" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Jours de retard</label>
              <input type="number" formControlName="joursRetard" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Statut</label>
              <select formControlName="statut" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Auto (selon jours retard)</option>
                @for (s of statuts; track s.value) {
                  <option [value]="s.value">{{ s.label }}</option>
                }
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 mb-1">Date échéance</label>
              <input type="date" formControlName="dateEcheance" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        }
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Notes</label>
          <textarea formControlName="notes" rows="2" class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" (click)="fermerModal()" class="px-4 py-2 text-sm text-gray-700 border rounded-lg hover:bg-gray-50">Annuler</button>
          <button type="submit" [disabled]="form.invalid" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {{ creditEnEdition() ? 'Enregistrer' : 'Créer' }}
          </button>
        </div>
      </form>
    </div>
  </div>
}

<!-- Confirmation suppression -->
@if (creditASupprimer()) {
  <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
      <h3 class="font-semibold text-gray-900">Supprimer le crédit ?</h3>
      <p class="text-sm text-gray-600">Client : <strong>{{ creditASupprimer()!.nomClient }}</strong></p>
      <div class="flex justify-end gap-3">
        <button (click)="creditASupprimer.set(null)" class="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Annuler</button>
        <button (click)="supprimer()" class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">Supprimer</button>
      </div>
    </div>
  </div>
}
`,
})
export class PortefeuilleSfdComponent implements OnInit {
  private svc = new CreditSfdService();
  private fb: FormBuilder;

  credits = signal<CreditSfdResponse[]>([]);
  dashboard = signal<CreditSfdDashboard | null>(null);
  modalOuvert = signal(false);
  creditEnEdition = signal<CreditSfdResponse | null>(null);
  creditASupprimer = signal<CreditSfdResponse | null>(null);

  typesCredit = TYPES_CREDIT;
  statuts = STATUTS_CREDIT;

  form = (() => {
    const fb = new FormBuilder();
    return fb.group({
      nomClient: ['', Validators.required],
      numeroCredit: [''],
      montantAccorde: [0, [Validators.required, Validators.min(1)]],
      montantEncours: [null as number | null],
      dateDeblocage: ['', Validators.required],
      dateEcheance: [''],
      joursRetard: [0, [Validators.required, Validators.min(0)]],
      typeCredit: ['MICRO_CREDIT' as TypeCredit],
      statut: ['' as StatutCredit | ''],
      notes: [''],
    });
  })();

  constructor() {
    this.fb = new FormBuilder();
  }

  ngOnInit() {
    this.charger();
  }

  private charger() {
    this.svc.lister().subscribe(d => this.credits.set(d));
    this.svc.getDashboard().subscribe(d => this.dashboard.set(d));
  }

  ouvrirModal(credit?: CreditSfdResponse) {
    this.creditEnEdition.set(credit ?? null);
    if (credit) {
      this.form.patchValue({
        montantEncours: credit.montantEncours,
        joursRetard: credit.joursRetard,
        statut: credit.statut,
        dateEcheance: credit.dateEcheance ?? '',
        notes: credit.notes ?? '',
      });
    } else {
      this.form.reset({ joursRetard: 0, typeCredit: 'MICRO_CREDIT' });
    }
    this.modalOuvert.set(true);
  }

  fermerModal() {
    this.modalOuvert.set(false);
    this.creditEnEdition.set(null);
  }

  sauvegarder() {
    if (this.form.invalid) return;
    const v = this.form.value;
    const edition = this.creditEnEdition();

    if (edition) {
      const req = {
        montantEncours: v.montantEncours ?? undefined,
        joursRetard: v.joursRetard ?? 0,
        statut: (v.statut || undefined) as StatutCredit | undefined,
        dateEcheance: v.dateEcheance || undefined,
        notes: v.notes || undefined,
      };
      this.svc.mettrAJour(edition.id, req).subscribe(() => { this.fermerModal(); this.charger(); });
    } else {
      const req = {
        nomClient: v.nomClient!,
        numeroCredit: v.numeroCredit || undefined,
        montantAccorde: v.montantAccorde!,
        montantEncours: v.montantEncours ?? undefined,
        dateDeblocage: v.dateDeblocage!,
        dateEcheance: v.dateEcheance || undefined,
        joursRetard: v.joursRetard ?? 0,
        typeCredit: (v.typeCredit as TypeCredit) || 'MICRO_CREDIT',
        notes: v.notes || undefined,
      };
      this.svc.creer(req).subscribe(() => { this.fermerModal(); this.charger(); });
    }
  }

  confirmerSuppression(c: CreditSfdResponse) {
    this.creditASupprimer.set(c);
  }

  supprimer() {
    const c = this.creditASupprimer();
    if (!c) return;
    this.svc.supprimer(c.id).subscribe(() => { this.creditASupprimer.set(null); this.charger(); });
  }

  ratioClass(value: number, threshold: number, higherIsBetter: boolean): string {
    const ok = higherIsBetter ? value >= threshold : value <= threshold;
    return ok
      ? 'bg-green-50 text-green-800'
      : 'bg-red-50 text-red-800';
  }

  retardClass(jours: number): string {
    if (jours > 90) return 'text-red-600 font-semibold';
    if (jours > 30) return 'text-orange-500 font-semibold';
    return 'text-gray-700';
  }

  statutBadge(statut: StatutCredit): string {
    const map: Record<StatutCredit, string> = {
      ACTIF: 'bg-green-100 text-green-800',
      EN_SOUFFRANCE: 'bg-orange-100 text-orange-800',
      DOUTEUX: 'bg-red-100 text-red-800',
      REMBOURSE: 'bg-blue-100 text-blue-800',
      PASSE_EN_PERTES: 'bg-gray-100 text-gray-600',
    };
    return map[statut] ?? 'bg-gray-100 text-gray-600';
  }
}
